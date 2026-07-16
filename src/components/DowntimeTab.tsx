"use client";

import { useState } from "react";
import { PlusCircle, Clock, Trash2 } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import {
  DOWNTIME_CATEGORIES,
  DOWNTIME_PARTS,
  DOWNTIME_CATEGORY_STYLES,
  SHIFTS,
  calcDurationMinutes,
  getShiftDate,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DowntimeCategory, DowntimeEvent, ShiftKey } from "@/types";
import type { useOfflineQueue } from "@/lib/useOfflineQueue";

interface DowntimeTabProps {
  shift: ShiftKey;
  line: string;
  supervisorName: string;
  events: DowntimeEvent[];
  onEventAdded: (event: DowntimeEvent) => void;
  onEventRemoved: (index: number) => void;
  syncOrQueue: ReturnType<typeof useOfflineQueue>["syncOrQueue"];
}

export function DowntimeTab({
  shift,
  line,
  supervisorName,
  events,
  onEventAdded,
  onEventRemoved,
  syncOrQueue,
}: DowntimeTabProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [category, setCategory] = useState<DowntimeCategory>("Mechanical");
  const [partAffected, setPartAffected] = useState<string>(DOWNTIME_PARTS[0]);
  const [startTime, setStartTime] = useState(SHIFTS[shift].start);
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [error, setError] = useState("");

  const s = SHIFTS[shift];

  const handleOpen = () => {
    setStartTime(s.start);
    setEndTime("");
    setPartAffected(DOWNTIME_PARTS[0]);
    setDescription("");
    setError("");
    setSavedOffline(false);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!partAffected) { setError("Select part affected"); return; }
    if (!startTime)    { setError("Enter start time");     return; }
    if (!endTime)      { setError("Enter end time");       return; }
    setError("");
    setSaving(true);
    setSavedOffline(false);

    const event: DowntimeEvent = {
      shift,
      shiftDate: getShiftDate(shift),
      line,
      category,
      partAffected,
      startTime,
      endTime,
      durationMinutes: calcDurationMinutes(startTime, endTime),
      description,
      supervisorName,
    };

    const { queued } = await syncOrQueue("/api/submit", "POST", event);

    if (queued) setSavedOffline(true);
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

      {/* Offline notice */}
      {savedOffline && (
        <p className="text-amber-700 text-sm mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          Saved offline — will sync automatically when online.
        </p>
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
                      {e.category}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {e.partAffected}
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

          {/* Category + Part — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DowntimeCategory)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
              >
                {DOWNTIME_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
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