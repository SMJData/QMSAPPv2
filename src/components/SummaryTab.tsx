// src/components/SummaryTab.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Send, CheckCircle2, BarChart3, CloudUpload, Search } from "lucide-react";
import { SHIFTS, getShiftDate, DOWNTIME_CATEGORY_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ProductionLog, ShiftKey, ShiftReport, Job, OpenDowntimeEvent, DowntimeCategory } from "@/types";
import type { useOfflineQueue } from "@/lib/useOfflineQueue";
import { format } from "date-fns";

interface SummaryTabProps {
  shift: ShiftKey;
  supervisorName: string;
  productionLogs: ProductionLog[];
  jobs: Job[];
  jobsLoading: boolean;
  preselectedJob: Job | null;
  onSubmitSuccess: () => void;
  syncOrQueue: ReturnType<typeof useOfflineQueue>["syncOrQueue"];
}

export function SummaryTab({
  shift,
  supervisorName,
  productionLogs,
  jobs,
  jobsLoading,
  preselectedJob,
  onSubmitSuccess,
  syncOrQueue,
}: SummaryTabProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(preselectedJob ?? null);
  const [jobQuery, setJobQuery] = useState("");

  const [openDowntime, setOpenDowntime] = useState<OpenDowntimeEvent[]>([]);
  const [downtimeLoading, setDowntimeLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedOffline, setSubmittedOffline] = useState(false);
  const [error, setError] = useState("");

  const s = SHIFTS[shift];

  const filteredJobs = useMemo(() => {
    const q = jobQuery.toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.jobNum.includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.brand.toLowerCase().includes(q)
    );
  }, [jobs, jobQuery]);

  const jobLogs = useMemo(
    () => productionLogs.filter((l) => l.jobNum === selectedJob?.jobNum),
    [productionLogs, selectedJob]
  );

  const loadOpenDowntime = useCallback(async (jobNum: string) => {
    setDowntimeLoading(true);
    try {
      const res = await fetch(`/api/downtime/by-job?jobNum=${encodeURIComponent(jobNum)}`);
      const data = await res.json();
      setOpenDowntime(data.events ?? []);
    } catch {
      console.error("Failed to load downtime for job");
    } finally {
      setDowntimeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedJob) {
      loadOpenDowntime(selectedJob.jobNum);
    } else {
      setOpenDowntime([]);
    }
  }, [selectedJob, loadOpenDowntime]);

  const totalProduced = jobLogs.reduce((a, l) => a + l.casesProduced, 0);
  const totalRejected = jobLogs.reduce((a, l) => a + l.casesRejected, 0);
  const totalDowntime = openDowntime.reduce((a, e) => a + (e.duration_minutes ?? 0), 0);
  const efficiency =
    totalProduced > 0
      ? (((totalProduced - totalRejected) / totalProduced) * 100).toFixed(1)
      : null;

  const isEmpty = !!selectedJob && jobLogs.length === 0 && openDowntime.length === 0;

  const handleSubmit = async () => {
    if (!selectedJob) {
      setError("Select a job first.");
      return;
    }
    if (!jobLogs.length) {
      setError("No production logs for this job.");
      return;
    }
    if (!supervisorName.trim()) {
      setError("Unable to identify supervisor — please sign out and back in.");
      return;
    }
    setError("");
    setSubmitting(true);

    const report: ShiftReport = {
      shift,
      shiftDate: getShiftDate(shift),
      supervisorName,
      productionLogs: jobLogs,
      downtimeEvents: [], // DB-linked separately by /api/submit; not re-sent
      totalCasesProduced: totalProduced,
      totalCasesRejected: totalRejected,
      totalDowntimeMinutes: totalDowntime,
      submittedAt: new Date().toISOString(),
    };

    const { queued } = await syncOrQueue("/api/submit", "POST", report);

    setSubmitting(false);
    setSubmitted(true);
    setSubmittedOffline(queued);
    onSubmitSuccess();
  };

  if (submitted) {
    return (
      <div className="page-enter px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-4",
          submittedOffline ? "bg-amber-100" : "bg-green-100"
        )}>
          {submittedOffline
            ? <CloudUpload size={36} className="text-amber-600" />
            : <CheckCircle2 size={36} className="text-green-600" />
          }
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {submittedOffline ? "Saved offline!" : "Report submitted!"}
        </h2>
        <p className="text-sm text-gray-500 mb-1">
          {s.label} · {format(new Date(), "d MMM yyyy")}
        </p>
        <p className="text-sm text-gray-400 mb-3">
          {totalProduced.toLocaleString()} cases
        </p>
        {submittedOffline && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 max-w-xs">
            Your report is queued and will sync automatically when you&apos;re back online.
          </p>
        )}
      </div>
    );
  }

  if (!selectedJob) {
    return (
      <div className="page-enter px-4 pt-4">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Select job to summarize
        </div>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={jobQuery}
            onChange={(e) => setJobQuery(e.target.value)}
            placeholder="Search job #, product, brand…"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white"
          />
        </div>
        {jobsLoading ? (
          <div className="text-xs text-gray-400 py-4 text-center">Loading jobs…</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Search size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No jobs match your search</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredJobs.map((job) => (
              <button
                key={job.jobNum}
                onClick={() => setSelectedJob(job)}
                className="w-full text-left border border-gray-200 rounded-xl px-3 py-2.5 bg-white hover:bg-gray-50"
              >
                <div className="text-sm font-semibold text-gray-800">{job.jobNum}</div>
                <div className="text-xs text-gray-500 truncate">{job.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-enter px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Shift summary
        </div>
        <button
          onClick={() => setSelectedJob(null)}
          className="text-xs text-smj-navy font-medium"
        >
          Change job
        </button>
      </div>

      <div className="bg-smj-navy-light border-2 border-smj-navy rounded-xl p-3 mb-4">
        <div className="font-mono text-[11px] text-smj-navy/70 mb-0.5">{selectedJob.jobNum}</div>
        <div className="text-sm font-semibold text-smj-navy leading-snug">{selectedJob.description}</div>
      </div>

      {isEmpty ? (
        <div className="text-center py-12 text-gray-400">
          <BarChart3 size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No entries logged yet for this job</p>
        </div>
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-smj-navy-light rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-smj-navy">{totalProduced.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Cases produced</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-red-700">{totalRejected.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Cases rejected</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-amber-700">{totalDowntime}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Downtime min</div>
            </div>
          </div>

          {/* Shift details */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200 mb-4">
            <SumRow label="Shift"      value={s.label} />
            <SumRow label="Window"     value={`${s.start} – ${s.end}`} />
            <SumRow label="Supervisor" value={supervisorName || "—"} />
            {efficiency && <SumRow label="Yield rate" value={`${efficiency}%`} />}
          </div>

          {/* Production breakdown */}
          {jobLogs.length > 0 && (
            <>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Production logs ({jobLogs.length})
              </div>
              <div className="space-y-1.5 mb-4">
                {jobLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2">
                    <div>
                      <div className="font-mono text-[11px] text-gray-400">{log.jobNum}</div>
                      <div className="text-xs text-gray-700 truncate max-w-[180px]">{log.jobDescription}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {log.casesProduced.toLocaleString()}
                      <span className="text-xs font-normal text-gray-400"> cs</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Downtime breakdown — fetched from DB, includes events logged by anyone for this job */}
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Downtime events {!downtimeLoading && `(${openDowntime.length})`}
          </div>
          {downtimeLoading ? (
            <div className="text-xs text-gray-400 py-3 text-center mb-4">Loading…</div>
          ) : openDowntime.length === 0 ? (
            <p className="text-xs text-gray-400 mb-4">No downtime recorded for this job</p>
          ) : (
            <div className="space-y-1.5 mb-4">
              {openDowntime.map((e) => {
                const style = e.downtime_codes
                  ? DOWNTIME_CATEGORY_STYLES[e.downtime_codes.category as DowntimeCategory] ?? { bg: "bg-gray-100", text: "text-gray-700" }
                  : { bg: "bg-gray-100", text: "text-gray-700" };
                return (
                  <div key={e.id} className="bg-white border border-gray-200 rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", style.bg, style.text)}>
                        {e.downtime_codes ? `${e.downtime_codes.code} — ${e.downtime_codes.label}` : "Unknown code"}
                      </span>
                      <span className="text-sm font-semibold text-amber-700">
                        {e.duration_minutes ?? "—"} min
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center justify-between">
                      <span>{e.start_time} – {e.end_time ?? "—"}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full font-medium",
                        e.status === "recorded" ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"
                      )}>
                        {e.status}
                      </span>
                    </div>
                    {e.corrective_action && (
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Corrective action:</span> {e.corrective_action}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {error && (
        <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || isEmpty}
        className={cn(
          "w-full flex items-center justify-center gap-2 bg-smj-navy text-white rounded-xl py-3.5 text-sm font-semibold mb-3",
          (submitting || isEmpty) && "opacity-60"
        )}
      >
        <Send size={16} />
        {submitting ? "Submitting…" : "Submit shift report"}
      </button>
    </div>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}