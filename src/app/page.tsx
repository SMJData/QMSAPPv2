"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomTabBar, type TabKey } from "@/components/BottomTabBar";
import { JobsTab } from "@/components/JobsTab";
import { LogEntryTab } from "@/components/LogEntryTab";
import { DowntimeTab } from "@/components/DowntimeTab";
import { SummaryTab } from "@/components/SummaryTab";
import type { Job, ShiftKey, ProductionLog, DowntimeEvent } from "@/types";
import { PRODUCTION_LINES } from "@/lib/constants";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("jobs");

  // Shift state
  const [shift, setShift] = useState<ShiftKey>("day");
  const [line, setLine] = useState<string>(PRODUCTION_LINES[0]);
  const [supervisorName, setSupervisorName] = useState("");

  // Job state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Session data
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([]);
  const [downtimeEvents, setDowntimeEvents] = useState<DowntimeEvent[]>([]);

  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch {
      console.error("Failed to load jobs");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

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
    // Reset session after successful submission
    setTimeout(() => {
      setProductionLogs([]);
      setDowntimeEvents([]);
      setSelectedJob(null);
      setActiveTab("jobs");
    }, 3000);
  };

  return (
    <div className="app-shell shadow-xl">
      <TopBar shift={shift} />

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
          />
        )}
      </div>

      <BottomTabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
