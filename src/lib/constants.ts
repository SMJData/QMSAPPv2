import type { Shift, DowntimeCategory } from "@/types";

export const SHIFTS: Record<string, Shift> = {
  day: { key: "day", label: "Day shift", start: "07:00", end: "19:00" },
  night: { key: "night", label: "Night shift", start: "19:00", end: "07:00" },
};

export const PRODUCTION_LINES = [
  "Line 1",
  "Line 2",
  "Line 3",
  "Line 4",
  "Hotfill Line",
];

export const DOWNTIME_CATEGORIES: DowntimeCategory[] = [
  "Mechanical",
  "Utility failure",
  "Quality hold",
  "Changeover",
  "Awaiting materials",
  "Other",
];

export const DOWNTIME_CATEGORY_STYLES: Record<
  DowntimeCategory,
  { bg: string; text: string }
> = {
  Mechanical: { bg: "bg-amber-100", text: "text-amber-800" },
  "Utility failure": { bg: "bg-blue-100", text: "text-blue-800" },
  "Quality hold": { bg: "bg-red-100", text: "text-red-800" },
  Changeover: { bg: "bg-purple-100", text: "text-purple-800" },
  "Awaiting materials": { bg: "bg-orange-100", text: "text-orange-800" },
  Other: { bg: "bg-gray-100", text: "text-gray-700" },
};

// The shift date is always the calendar date on which the shift STARTS.
// Night shift starts at 19:00 the previous day relative to its 07:00 end.
export function getShiftDate(shiftKey: string): string {
  const now = new Date();
  const hour = now.getHours();
  if (shiftKey === "night" && hour < 7) {
    // We are in the early hours — shift started yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  }
  return now.toISOString().split("T")[0];
}

export function calcDurationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60; // crosses midnight
  return endMins - startMins;
}
