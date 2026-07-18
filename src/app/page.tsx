"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomTabBar, type TabKey, type UserRole } from "@/components/BottomTabBar";
import { JobsTab } from "@/components/JobsTab";
import { LogEntryTab } from "@/components/LogEntryTab";
import { DowntimeTab } from "@/components/DowntimeTab";
import { SummaryTab } from "@/components/SummaryTab";
import type { Job, ShiftKey, ProductionLog, DowntimeEvent } from "@/types";
import { PRODUCTION_LINES } from "@/lib/constants";
import { useOfflineQueue, getCachedJobs, setCachedJobs } from "@/lib/useOfflineQueue";
import { supabase } from "@/lib/supabase";

// Central access map — keep in sync with the one in BottomTabBar.tsx
const ROLE_TAB_ACCESS: Record<UserRole, TabKey[]> = {
  admin: ["jobs", "log", "downtime", "summary"],
  production_coordinator: ["jobs", "log", "downtime", "summary"],
  machine_operator: ["jobs", "downtime"],
  maintenance_technician: ["jobs", "downtime"],
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("jobs");

  // Role state
  const [role, setRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Shift state
  const [shift, setShift] = useState<ShiftKey>("day");
  const [line, setLine] = useState<string>(PRODUCTION_LINES[0]);
  const [supervisorName, setSupervisorName] = useState("");

  // Job state — seed from cache immediately so UI isn't blank offline
  const [jobs, setJobs] = useState<Job[]>(() => getCachedJobs<Job>());
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Session data
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([]);
  const [downtimeEvents, setDowntimeEvents] = useState<DowntimeEvent[]>([]);

  // Offline queue
  const { online, syncing, pendingSync, syncOrQueue, drain } = useOfflineQueue();

  // Prevent duplicate syncs if online event fires multiple times rapidly
  const syncingJobsRef = useRef(false);

  // ─── Load current user's role ──────────────────────────────
  useEffect(() => {
    async function loadRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRoleLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const resolvedRole = (data?.role ?? null) as UserRole | null;
      setRole(resolvedRole);

      // Land restricted roles on a tab they're actually allowed to see
      if (resolvedRole && !ROLE_TAB_ACCESS[resolvedRole]?.includes("jobs")) {
        setActiveTab(ROLE_TAB_ACCESS[resolvedRole]?.[0] ?? "downtime");
      }

      setRoleLoading(false);
    }
    loadRole();
  }, []);

  // Guard: whenever activeTab changes, redirect away if the current
  // role isn't allowed to view it (defensive — covers any programmatic
  // setActiveTab call, e.g. handleLogSaved sending someone to "summary")
  useEffect(() => {
    if (!role) return;
    if (!ROLE_TAB_ACCESS[role]?.includes(activeTab)) {
      setActiveTab(ROLE_TAB_ACCESS[role]?.[0] ?? "downtime");
    }
  }, [role, activeTab]);

  // ─── Load jobs from job_master ────────────────────────────
  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      const fetched = data.jobs ?? [];
      setJobs(fetched);
      setCachedJobs(fetched);
    } catch {
      console.error("Failed to load jobs — using cache");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  // ─── Full sync: Epicor → job_master → local state ─────────
  const syncOnConnect = useCallback(async () => {
    if (syncingJobsRef.current) return;
    syncingJobsRef.current = true;

    try {
      await drain();
      await fetch("/api/sync-jobs");
      await loadJobs();
    } catch {
      console.error("Sync on connect failed");
    } finally {
      syncingJobsRef.current = false;
    }
  }, [drain, loadJobs]);

  // ─── Initial load ─────────────────────────────────────────
  useEffect(() => {
    if (navigator.onLine) {
      syncOnConnect();
    } else {
      loadJobs();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── React to WiFi reconnection ───────────────────────────
  useEffect(() => {
    const handleOnline = () => syncOnConnect();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncOnConnect]);

  // Auto-detect shift based on current time
  useEffect(() => {
    const hour = new Date().getHours();
    setShift(hour >= 7 && hour < 19 ? "day" : "night");
  }, []);

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    if (!role) return;
    // Coordinator/admin go to Log Entry as before; operators/technicians
    // (who don't have "log" access) go straight to Downtime instead.
    setActiveTab(ROLE_TAB_ACCESS[role].includes("log") ? "log" : "downtime");
  };

  const handleLogSaved = (log: ProductionLog) => {
    setProductionLogs((prev) => [...prev, log]);
    setActiveTab("summary");
  };

  const handleEventAdded = (event: DowntimeEvent) => {
    setDowntimeEvents((prev) => [...prev, event]);
  };

  const handleEventRemoved = (index: number) => {
    setDowntimeEvents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitSuccess = () => {
    setTimeout(() => {
      setProductionLogs([]);
      setDowntimeEvents([]);
      setSelectedJob(null);
      setActiveTab("jobs");
    }, 3000);
  };

  if (roleLoading) {
    return <div className="app-shell shadow-xl flex items-center justify-center">Loading…</div>;
  }

  if (!role) {
    return <div className="app-shell shadow-xl flex items-center justify-center">Unable to load user profile.</div>;
  }

  return (
    <div className="app-shell shadow-xl">
      <TopBar shift={shift} pendingSync={pendingSync} syncing={syncing} />

      <div className="content-area">
        {activeTab === "jobs" && ROLE_TAB_ACCESS[role].includes("jobs") && (
          <JobsTab
            jobs={jobs}
            loading={jobsLoading}
            shift={shift}
            selectedJob={selectedJob}
            onShiftChange={setShift}
            onJobSelect={handleJobSelect}
            onRefresh={loadJobs}
          />
        )}
        {activeTab === "log" && ROLE_TAB_ACCESS[role].includes("log") && (
          <LogEntryTab
            selectedJob={selectedJob}
            shift={shift}
            line={line}
            supervisorName={supervisorName}
            onSupervisorChange={setSupervisorName}
            onGoToJobs={() => setActiveTab("jobs")}
            onLogSaved={handleLogSaved}
            syncOrQueue={syncOrQueue}
          />
        )}
        {activeTab === "downtime" && ROLE_TAB_ACCESS[role].includes("downtime") && (
          <DowntimeTab
            shift={shift}
            line={line}
            supervisorName={supervisorName}
            events={downtimeEvents}
            jobs={jobs}
            jobsLoading={jobsLoading}
            onEventAdded={handleEventAdded}
            onEventRemoved={handleEventRemoved}
            syncOrQueue={syncOrQueue}
          />
        )}
        {activeTab === "summary" && ROLE_TAB_ACCESS[role].includes("summary") && (
          <SummaryTab
            shift={shift}
            line={line}
            supervisorName={supervisorName}
            productionLogs={productionLogs}
            downtimeEvents={downtimeEvents}
            onSubmitSuccess={handleSubmitSuccess}
            syncOrQueue={syncOrQueue}
          />
        )}
      </div>

      <BottomTabBar active={activeTab} onChange={setActiveTab} role={role} />
    </div>
  );
}