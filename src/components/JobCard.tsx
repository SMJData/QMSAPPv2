// JobCard.tsx - A React component that renders a card for a production job, displaying key details such as job number, description, brand, size, pack, target quantity, required due date, and release status. The card can be selected to view more details or perform actions related to the job.
"use client";

import { cn } from "@/lib/utils";
import type { Job } from "@/types";
import { format, parseISO } from "date-fns";

interface JobCardProps {
  job: Job;
  selected: boolean;
  onSelect: () => void;
}

export function JobCard({ job, selected, onSelect }: JobCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl border-2 p-3 mb-2 transition-all",
        selected
          ? "border-smj-navy bg-smj-navy-light"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <div className="font-mono text-[11px] text-gray-400 mb-1">
        {job.jobNum}
      </div>
      <div className="text-sm font-semibold text-gray-900 leading-snug mb-2">
        {job.description}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
          {job.brand}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {job.size} · {job.pack}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-800">
          {job.targetQty.toLocaleString()} cases
        </span>
        {job.reqDueDate && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            Due {format(parseISO(job.reqDueDate), "d MMM")}
          </span>
        )}
        <span
          className={cn(
            "text-[11px] px-2 py-0.5 rounded-full",
            job.isReleased && !job.isHeld
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          )}
        >
          {job.isReleased && !job.isHeld ? "Released" : "On hold"}
        </span>
      </div>
    </button>
  );
}
