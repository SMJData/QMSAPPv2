// src/components/DowntimeTab.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Clock, Trash2, Search } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import {
  DOWNTIME_PARTS,
  DOWNTIME_CATEGORY_STYLES,
  SHIFTS,
  calcDurationMinutes,
  getShiftDate,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DowntimeCategory, DowntimeEvent, DowntimeCode, ShiftKey, Job } from "@/types";
import type { useOfflineQueue } from "@/lib/useOfflineQueue";

interface DowntimeTabProps {
  shift: ShiftKey;
  line: string;
  supervisorName: string;
  events: DowntimeEvent[];
  jobs: Job[];
  jobsLoading: boolean;
  preselectedJob: Job | null;
  onEventAdded: (event: DowntimeEvent) => void;
  onEventRemoved: (index: number) => void;
  syncOrQueue: ReturnType<typeof useOfflineQueue>["syncOrQueue"];
}

export function DowntimeTab({
  shift,
  line,
  supervisorName,
  events,
  jobs,
  jobsLoading,
  preselectedJob,
  onEventAdded,
  onEventRemoved,
}: DowntimeTabProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  // Downtime codes lookup
  const [codes, setCodes] = useState<DowntimeCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [selectedCodeId, setSelectedCodeId] = useState<string>("");

  const [partAffected, setPartAffected] = useState<string>(DOWNTIME_PARTS[0]);
  const [startTime, setStartTime] = useState(SHIFTS[shift].start);
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Job selection
  const [selectedJob, setSelectedJob] = useState<Job | null>(preselectedJob ?? null);
  const [jobQuery, setJobQuery] = useState("");

  const s = SHIFTS[shift];

  // Load downtime codes once on mount
  useEffect(() => {
    async function loadCodes() {
      setCodesLoading(true);
      try {
        const res = await fetch("/api/downtime-codes");
        const data = await res.json();
        setCodes(data.codes ?? []);
      } catch {
        console.error("Failed to load downtime codes");
      } finally {
        setCodesLoading(false);
      }
    }
    loadCodes();
  }, []);

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

  const handleOpen = () => {
    setStartTime(s.start);
    setEndTime("");
    setPartAffected(DOWNTIME_PARTS[0]);
    setDescription("");
    setSelectedJob(preselectedJob ?? null);
    setJobQuery("");
    setSelectedCodeId("");
    setError("");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!selectedJob)    { setError("Select a job");          return; }
    if (!selectedCodeId) { setError("Select a downtime code"); return; }
    if (!partAffected)   { setError("Select part affected");  return; }
    if (!startTime)       { setError("Enter start time");      return; }
    if (!endTime)         { setError("Enter end time");        return; }
    setError("");
    setSaving(true);

    const selectedCode = codes.find((c) => c.id === selectedCodeId)!;

    const event: DowntimeEvent = {
      jobNum: selectedJob.jobNum,
      jobDescription: selectedJob.description,
      shift,
      shiftDate: getShiftDate(shift),
      line,
      downtimeCodeId: selectedCode.id,
      downtimeCode: selectedCode.code,
      downtimeCodeLabel: selectedCode.label,
      category: selectedCode.category,
      partAffected,
      startTime,
      endTime,
      durationMinutes: calcDurationMinutes(startTime, endTime),
      description,
      supervisorName,
    };

    onEventAdded(event);
    setSheetOpen(false);
    setSaving(false);
  };

  const totalMins = events.reduce((a, e) => a + (e.durationMinutes ?? 0), 0);

  return (
    <div className="page-enter px-4 pt-4">
      {/* Shift info */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-4 text-sm text-gray-600">
        <Clock size={14} className="shrink-0" />
        <span>{s.label} · {s.start} – {s.end}</span>
      </div>

      {/* Pre-selected job banner */}
      {preselectedJob && (
        <div className="flex items-center gap-2.5 bg-smj-navy-light border border-smj-navy/20 rounded-xl px-3.5 py-2.5 mb-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-smj-navy/60">Selected job</div>
            <div className="text-sm font-semibold text-smj-navy truncate">
              {preselectedJob.jobNum} · {preselectedJob.description}
            </div>
          </div>
        </div>
      )}

      {/* Summary chip */}
      {events.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            {events.length} event{events.length !== 1 ? "s" : ""} logged
          </span>
          <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-medium">
            {totalMins} min total downtime
          </span>
        </div>
      )}

      {/* Add button */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-smj-navy/30 text-smj-navy rounded-xl py-3 text-sm font-semibold mb-4 hover:bg-smj-navy-light transition-colors"
      >
        <PlusCircle size={18} />
        Log downtime event
      </button>

      {/* Event list */}
      {events.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Clock size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No downtime events logged</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((e, i) => {
            const style = DOWNTIME_CATEGORY_STYLES[e.category as DowntimeCategory] ?? {
              bg: "bg-gray-100",
              text: "text-gray-700",
            };
            return (
              <div key={i} className="border border-gray-200 rounded-xl p-3 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col gap-1">
                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit", style.bg, style.text)}>
                      {e.downtimeCode} — {e.downtimeCodeLabel}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {e.jobNum} · {e.partAffected}
                    </span>
                  </div>
                  <button onClick={() => onEventRemoved(i)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="text-sm font-semibold text-gray-800">
                  {e.startTime} – {e.endTime}
                  {e.durationMinutes !== undefined && (
                    <span className="text-xs font-normal text-gray-400 ml-2">
                      ({e.durationMinutes} min)
                    </span>
                  )}
                </div>
                {e.description && (
                  <div className="text-xs text-gray-500 mt-1">{e.description}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add downtime sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Log downtime event">
        <div className="space-y-3">

          {/* Job selection */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Job *</label>
            {selectedJob ? (
              <div className="flex items-center justify-between border border-smj-navy/30 bg-smj-navy-light rounded-xl px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-smj-navy truncate">
                    {selectedJob.jobNum}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {selectedJob.description}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-xs text-smj-navy font-medium shrink-0 ml-2"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={jobQuery}
                    onChange={(e) => setJobQuery(e.target.value)}
                    placeholder="Search job #, product, brand…"
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {jobsLoading ? (
                    <div className="p-3 text-xs text-gray-400">Loading jobs…</div>
                  ) : filteredJobs.length === 0 ? (
                    <div className="p-3 text-xs text-gray-400">No jobs match</div>
                  ) : (
                    filteredJobs.map((job) => (
                      <button
                        key={job.jobNum}
                        onClick={() => setSelectedJob(job)}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50"
                      >
                        <div className="text-sm font-semibold text-gray-800">{job.jobNum}</div>
                        <div className="text-xs text-gray-500 truncate">{job.description}</div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Downtime code + Part — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Downtime code *</label>
              <select
                value={selectedCodeId}
                onChange={(e) => setSelectedCodeId(e.target.value)}
                disabled={codesLoading}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
              >
                <option value="" disabled>
                  {codesLoading ? "Loading…" : "Select code"}
                </option>
                {codes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Part affected *</label>
              <select
                value={partAffected}
                onChange={(e) => setPartAffected(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
              >
                {DOWNTIME_PARTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Start time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">End time *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the event…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className={cn("w-full bg-smj-navy text-white rounded-xl py-3 text-sm font-semibold", saving && "opacity-60")}
          >
            {saving ? "Saving…" : "Save downtime"}
          </button>
          <button
            onClick={() => setSheetOpen(false)}
            className="w-full border-2 border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}