// ShiftSelector.tsx - A React component that allows users to select a shift (day or night) from a grid of buttons.

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
        const isDay = key === "day";

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "rounded-xl border-2 p-3 text-center transition-all duration-200",
              isSelected && isDay
                ? "border-amber-400 bg-amber-50"
                : isSelected && !isDay
                ? "border-[#0f2557] bg-[#0a1a3e]"
                : "border-gray-200 bg-white"
            )}
          >
            <div
              className={cn(
                "flex justify-center mb-1.5",
                isSelected && isDay
                  ? "text-amber-500"
                  : isSelected && !isDay
                  ? "text-blue-300"
                  : "text-gray-400"
              )}
            >
              {isDay ? <Sun size={24} /> : <Moon size={24} />}
            </div>
            <div
              className={cn(
                "text-sm font-semibold",
                isSelected && isDay
                  ? "text-amber-700"
                  : isSelected && !isDay
                  ? "text-blue-100"
                  : "text-gray-700"
              )}
            >
              {s.label}
            </div>
            <div
              className={cn(
                "text-xs mt-0.5",
                isSelected && isDay
                  ? "text-amber-600"
                  : isSelected && !isDay
                  ? "text-blue-300/70"
                  : "text-gray-500"
              )}
            >
              {s.start} – {s.end}
            </div>
          </button>
        );
      })}
    </div>
  );
}