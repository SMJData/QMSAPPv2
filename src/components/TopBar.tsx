"use client";

import { SMJLogo } from "./SMJLogo";
import type { ShiftKey } from "@/types";
import { SHIFTS } from "@/lib/constants";
import { Sun, Moon } from "lucide-react";
import { format } from "date-fns";

interface TopBarProps {
  shift: ShiftKey;
}

export function TopBar({ shift }: TopBarProps) {
  const s = SHIFTS[shift];
  const today = format(new Date(), "EEE d MMM");

  return (
    <div className="bg-smj-navy px-4 pt-3 pb-2.5 text-white">
      <div className="flex items-center justify-between">
        <SMJLogo height={26} variant="white" />
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-white/70 text-xs">
            {shift === "day" ? (
              <Sun size={11} />
            ) : (
              <Moon size={11} />
            )}
            <span>{s.label}</span>
          </div>
          <div className="text-white/50 text-[10px] mt-0.5">{today}</div>
        </div>
      </div>
      <div className="text-[10px] text-white/50 mt-1 tracking-wide">
        Production Logger · SMJ-02
      </div>
    </div>
  );
}
