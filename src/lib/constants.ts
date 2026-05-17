import type { Shift, DowntimeCategory } from "@/types";

export const SHIFTS: Record<string, Shift> = {
  day:   { key: "day",   label: "Day shift",   start: "07:00", end: "19:00" },
  night: { key: "night", label: "Night shift", start: "19:00", end: "07:00" },
};

export const PRODUCTION_LINES = [
  "Line 1",
  "Line 2",
  "Line 3",
  "Line 4",
  "Line 5",
  "Line 6",
];

export const DOWNTIME_CATEGORIES: DowntimeCategory[] = [
  "Operational",
  "Mechanical",
  "External",
  "Scheduled",
];

export const DOWNTIME_CATEGORY_STYLES: Record<
  DowntimeCategory,
  { bg: string; text: string }
> = {
  Operational: { bg: "bg-blue-100",   text: "text-blue-800"   },
  Mechanical:  { bg: "bg-amber-100",  text: "text-amber-800"  },
  External:    { bg: "bg-green-100",  text: "text-green-800"  },
  Scheduled:   { bg: "bg-purple-100", text: "text-purple-800" },
};

export const DOWNTIME_PARTS = [
  "Air Compressor",
  "ADUE",
  "Ammonia Compressor",
  "Boiler",
  "Capper",
  "Case Packer - OCME",
  "Case Packer - SMI",
  "Chain Conveyer",
  "Code Change",
  "Depal/Lanfranchi",
  "Domino",
  "Dumper",
  "Filler",
  "Filtec",
  "Flavour Change",
  "Forklift",
  "Labeller - B&H",
  "Labeller - Fuji",
  "Labeller - SACMI",
  "Line Change",
  "Lube System",
  "Lunch",
  "Nitrogen System",
  "Palletizer",
  "Pasteurizer",
  "PET",
  "Projects",
  "Quality Control",
  "Raw Materials",
  "Rincer",
  "Sanitation/CIP",
  "SBO",
  "Schedule Maintenance",
  "Silo",
  "Space Constraints",
  "Start up",
  "Stretch Wrapper",
  "Syrup room",
  "Utilities: Electricity",
  "Utilities: Water",
  "Videojet",
  "Warmer",
  "Other",
] as const;

export type DowntimePart = (typeof DOWNTIME_PARTS)[number];

// The shift date is always the calendar date on which the shift STARTS.
// Night shift starts at 19:00 the previous day relative to its 07:00 end.
export function getShiftDate(shiftKey: string): string {
  const now = new Date();
  const hour = now.getHours();
  if (shiftKey === "night" && hour < 7) {
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
  let endMins   = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60; // crosses midnight
  return endMins - startMins;
}