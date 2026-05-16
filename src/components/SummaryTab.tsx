//SummaryTab.tsx - Displays a summary of the shift report with key metrics and details, and allows submission to the server.

"use client";

import { useState } from "react";
import { Send, CheckCircle2, BarChart3 } from "lucide-react";
import { SHIFTS, getShiftDate } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ProductionLog, DowntimeEvent, ShiftKey, ShiftReport } from "@/types";
import { format } from "date-fns";

interface SummaryTabProps {
  shift: ShiftKey;
  line: string;
  supervisorName: string;
  productionLogs: ProductionLog[];
  downtimeEvents: DowntimeEvent[];
  onSubmitSuccess: () => void;
}

export function SummaryTab({
  shift,
  line,
  supervisorName,
  productionLogs,
  downtimeEvents,
  onSubmitSuccess,
}: SummaryTabProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const s = SHIFTS[shift];
  const totalProduced = productionLogs.reduce((a, l) => a + l.casesProduced, 0);
  const totalRejected = productionLogs.reduce((a, l) => a + l.casesRejected, 0);
  const totalDowntime = downtimeEvents.reduce((a, e) => a + (e.durationMinutes ?? 0), 0);
  const efficiency =
    totalProduced > 0
      ? (((totalProduced - totalRejected) / totalProduced) * 100).toFixed(1)
      : null;

  const isEmpty = productionLogs.length === 0 && downtimeEvents.length === 0;

  const handleSubmit = async () => {
    if (!productionLogs.length) {
      setError("No production logs to submit.");
      return;
    }
    if (!supervisorName.trim()) {
      setError("Enter supervisor name in Log Entry first.");
      return;
    }
    setError("");
    setSubmitting(true);

    const report: ShiftReport = {
      shift,
      shiftDate: getShiftDate(shift),
      line,
      supervisorName,
      productionLogs,
      downtimeEvents,
      totalCasesProduced: totalProduced,
      totalCasesRejected: totalRejected,
      totalDowntimeMinutes: totalDowntime,
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (!res.ok) throw new Error("Submit failed");
      setSubmitted(true);
      onSubmitSuccess();
    } catch {
      setError("Submission failed. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="page-enter px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={36} className="text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Report submitted!</h2>
        <p className="text-sm text-gray-500 mb-1">
          {s.label} · {format(new Date(), "d MMM yyyy")}
        </p>
        <p className="text-sm text-gray-400">
          {totalProduced.toLocaleString()} cases · {line}
        </p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="page-enter px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <BarChart3 size={48} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No entries logged yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Add production logs and downtime events first
        </p>
      </div>
    );
  }

  return (
    <div className="page-enter px-4 pt-4">
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Shift summary
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-smj-navy-light rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-smj-navy">
            {totalProduced.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Cases produced</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-red-700">
            {totalRejected.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Cases rejected</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-amber-700">{totalDowntime}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Downtime min</div>
        </div>
      </div>

      {/* Shift details */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200 mb-4">
        <SumRow label="Shift" value={s.label} />
        <SumRow label="Window" value={`${s.start} – ${s.end}`} />
        <SumRow label="Line" value={line} />
        <SumRow label="Supervisor" value={supervisorName || "—"} />
        {efficiency && <SumRow label="Yield rate" value={`${efficiency}%`} />}
      </div>

      {/* Production breakdown */}
      {productionLogs.length > 0 && (
        <>
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Production logs ({productionLogs.length})
          </div>
          <div className="space-y-1.5 mb-4">
            {productionLogs.map((log, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2"
              >
                <div>
                  <div className="font-mono text-[11px] text-gray-400">
                    {log.jobNum}
                  </div>
                  <div className="text-xs text-gray-700 truncate max-w-[180px]">
                    {log.jobDescription}
                  </div>
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

      {/* Downtime breakdown */}
      {downtimeEvents.length > 0 && (
        <>
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Downtime events ({downtimeEvents.length})
          </div>
          <div className="space-y-1.5 mb-4">
            {downtimeEvents.map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2"
              >
                <div>
                  <div className="text-xs font-semibold text-gray-700">{e.category}</div>
                  <div className="text-[11px] text-gray-400">
                    {e.startTime} – {e.endTime}
                  </div>
                </div>
                <div className="text-sm font-semibold text-amber-700">
                  {e.durationMinutes} min
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {error && (
        <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={cn(
          "w-full flex items-center justify-center gap-2 bg-smj-navy text-white rounded-xl py-3.5 text-sm font-semibold mb-3",
          submitting && "opacity-60"
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
