"use client";

import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShiftKey } from "@/types";
import { SHIFTS } from "@/lib/constants";

interface ShiftSelectorProps {
  value: ShiftKey;
  onChange: (shift: ShiftKey) => void;
}

export function ShiftSelector({ value, onChange }: ShiftSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {(["day", "night"] as ShiftKey[]).map((key) => {
        const s = SHIFTS[key];
        const isSelected = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "rounded-xl border-2 p-3 text-center transition-all",
              isSelected
                ? "border-smj-navy bg-smj-navy-light"
                : "border-gray-200 bg-white"
            )}
          >
            <div
              className={cn(
                "flex justify-center mb-1.5",
                isSelected ? "text-smj-navy" : "text-gray-400"
              )}
            >
              {key === "day" ? <Sun size={24} /> : <Moon size={24} />}
            </div>
            <div
              className={cn(
                "text-sm font-semibold",
                isSelected ? "text-smj-navy" : "text-gray-700"
              )}
            >
              {s.label}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {s.start} – {s.end}
            </div>
          </button>
        );
      })}
    </div>
  );
}
