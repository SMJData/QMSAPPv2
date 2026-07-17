"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomTabBar, type TabKey } from "@/components/BottomTabBar";
import { JobsTab } from "@/components/JobsTab";
import { LogEntryTab } from "@/components/LogEntryTab";
import { DowntimeTab } from "@/components/DowntimeTab";
import { SummaryTab } from "@/components/SummaryTab";
import type { Job, ShiftKey, ProductionLog, DowntimeEvent } from "@/types";
import { PRODUCTION_LINES } from "@/lib/constants";
import { useOfflineQueue, getCachedJobs, setCachedJobs } from "@/lib/useOfflineQueue";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("jobs");

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
  // Only runs when WiFi is detected and a sync is not already in flight
  const syncOnConnect = useCallback(async () => {
    if (syncingJobsRef.current) return;
    syncingJobsRef.current = true;

    try {
      // 1. Drain any records queued while offline
      await drain();

      // 2. Pull fresh jobs from Epicor into job_master
      await fetch("/api/sync-jobs");

      // 3. Refresh local state from job_master
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
      syncOnConnect(); // online at launch — sync immediately
    } else {
      loadJobs();      // offline at launch — load from cache only
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── React to WiFi reconnection ───────────────────────────
  // This is the only trigger for sync — purely event-driven
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
    setActiveTab("log");
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

  return (
    <div className="app-shell shadow-xl">
      <TopBar shift={shift} pendingSync={pendingSync} syncing={syncing} />

      <div className="content-area">
        {activeTab === "jobs" && (
          <JobsTab
            jobs={jobs}
            loading={jobsLoading}
            shift={shift}
            line={line}
            selectedJob={selectedJob}
            onShiftChange={setShift}
            onLineChange={setLine}
            onJobSelect={handleJobSelect}
            onRefresh={loadJobs}
          />
        )}
        {activeTab === "log" && (
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
        {activeTab === "downtime" && (
          <DowntimeTab
            shift={shift}
            line={line}
            supervisorName={supervisorName}
            events={downtimeEvents}
            onEventAdded={handleEventAdded}
            onEventRemoved={handleEventRemoved}
            syncOrQueue={syncOrQueue}
          />
        )}
        {activeTab === "summary" && (
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

      <BottomTabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}