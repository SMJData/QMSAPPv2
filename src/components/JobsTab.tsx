"use client";

import { useState, useMemo } from "react";
import { Search, RefreshCw, Sun, Moon } from "lucide-react";
import { ShiftSelector } from "@/components/ShiftSelector";
import { JobCard } from "@/components/JobCard";
import { PRODUCTION_LINES, SHIFTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Job, ShiftKey } from "@/types";

interface JobsTabProps {
  jobs: Job[];
  loading: boolean;
  shift: ShiftKey;
  line: string;
  selectedJob: Job | null;
  onShiftChange: (s: ShiftKey) => void;
  onLineChange: (l: string) => void;
  onJobSelect: (job: Job) => void;
  onRefresh: () => void;
}

export function JobsTab({
  jobs,
  loading,
  shift,
  line,
  selectedJob,
  onShiftChange,
  onLineChange,
  onJobSelect,
  onRefresh,
}: JobsTabProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.jobNum.includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.brand.toLowerCase().includes(q) ||
        j.flavor.toLowerCase().includes(q)
    );
  }, [jobs, query]);

  const s = SHIFTS[shift];

  return (
    <div className="page-enter px-4 pt-4">
      {/* Shift selector */}
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Select shift
      </div>
      <ShiftSelector value={shift} onChange={onShiftChange} />

      {/* Active shift bar */}
      <div className="flex items-center gap-2.5 bg-smj-navy rounded-xl px-3.5 py-2.5 mb-4">
        {shift === "day" ? (
          <Sun size={16} className="text-white/70 shrink-0" />
        ) : (
          <Moon size={16} className="text-white/70 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-white/60">Active shift</div>
          <div className="text-sm font-semibold text-white truncate">
            {s.label} · {s.start} – {s.end}
          </div>
        </div>
      </div>

      {/* Line selector */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
          Production line
        </label>
        <select
          value={line}
          onChange={(e) => onLineChange(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-900"
        >
          {PRODUCTION_LINES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search job #, product, brand…"
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white"
        />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Open jobs · Epicor BAQ
        </div>
        <button
          onClick={onRefresh}
          className={cn(
            "flex items-center gap-1 text-xs text-smj-navy px-2 py-1 rounded-lg border border-smj-navy/20",
            loading && "opacity-50 pointer-events-none"
          )}
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border-2 border-gray-100 bg-gray-50 h-24 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Search size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No jobs match your search</p>
        </div>
      ) : (
        <div>
          {filtered.map((job) => (
            <JobCard
              key={job.jobNum}
              job={job}
              selected={selectedJob?.jobNum === job.jobNum}
              onSelect={() => onJobSelect(job)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
