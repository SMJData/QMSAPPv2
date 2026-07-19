"use client";

import { useState } from "react";
import { ClipboardList, Clock, CheckCircle2 } from "lucide-react";
import { SHIFTS, getShiftDate } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Job, ShiftKey, ProductionLog } from "@/types";
import type { useOfflineQueue } from "@/lib/useOfflineQueue";

interface LogEntryTabProps {
  selectedJob: Job | null;
  shift: ShiftKey;
  supervisorName: string;
  onGoToJobs: () => void;
  onLogSaved: (log: ProductionLog) => void;
  syncOrQueue: ReturnType<typeof useOfflineQueue>["syncOrQueue"];
}

export function LogEntryTab({
  selectedJob,
  shift,
  supervisorName,
  onGoToJobs,
  onLogSaved,
  syncOrQueue,
}: LogEntryTabProps) {
  const [casesProduced, setCasesProduced] = useState("");
  const [casesRejected, setCasesRejected] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [error, setError] = useState("");

  const s = SHIFTS[shift];

  if (!selectedJob) {
    return (
      <div className="page-enter px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ClipboardList size={48} className="text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm mb-4">
          Select a job from the Jobs tab first
        </p>
        <button
          onClick={onGoToJobs}
          className="border-2 border-smj-navy text-smj-navy px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          Go to Jobs
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!casesProduced || parseInt(casesProduced) <= 0) {
      setError("Enter cases produced");
      return;
    }
    setError("");
    setSaving(true);
    setSavedOffline(false);

    const log: ProductionLog = {
      jobNum: selectedJob.jobNum,
      jobDescription: selectedJob.description,
      brand: selectedJob.brand,
      shift,
      shiftDate: getShiftDate(shift),
      casesProduced: parseInt(casesProduced),
      casesRejected: parseInt(casesRejected) || 0,
      notes,
      supervisorName,
    };

    const { queued, error: syncError } = await syncOrQueue("/api/logs", "POST", log);

    if (syncError && !queued) {
      setError("Failed to save. Check connection.");
    } else {
      if (queued) setSavedOffline(true);
      onLogSaved(log);
      setCasesProduced("");
      setCasesRejected("");
      setNotes("");
    }

    setSaving(false);
  };

  return (
    <div className="page-enter px-4 pt-4">
      {/* Selected job card */}
      <div className="bg-smj-navy-light border-2 border-smj-navy rounded-xl p-3 mb-4">
        <div className="font-mono text-[11px] text-smj-navy/70 mb-0.5">
          {selectedJob.jobNum}
        </div>
        <div className="text-sm font-semibold text-smj-navy leading-snug mb-1.5">
          {selectedJob.description}
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-800">
          Target: {selectedJob.targetQty.toLocaleString()} cases
        </span>
      </div>

      {/* Shift info */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-4 text-sm text-gray-600">
        <Clock size={14} className="shrink-0" />
        <span>{s.label} · {s.start} – {s.end}</span>
      </div>

      {/* Quantities */}
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Production quantities
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Cases produced</label>
          <input
            type="number"
            inputMode="numeric"
            value={casesProduced}
            onChange={(e) => setCasesProduced(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base font-semibold bg-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Cases rejected</label>
          <input
            type="number"
            inputMode="numeric"
            value={casesRejected}
            onChange={(e) => setCasesRejected(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base font-semibold bg-white"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any production notes for this run…"
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white resize-none"
        />
      </div>

      {/* Offline queued notice */}
      {savedOffline && (
        <p className="text-amber-700 text-sm mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          Saved offline — will sync automatically when online.
        </p>
      )}

      {error && (
        <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          "w-full flex items-center justify-center gap-2 bg-smj-navy text-white rounded-xl py-3.5 text-sm font-semibold",
          saving && "opacity-60"
        )}
      >
        <CheckCircle2 size={18} />
        {saving ? "Saving…" : "Save Production Log"}
      </button>
    </div>
  );
}