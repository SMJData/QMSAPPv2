"use client";

import { ClipboardList, FilePen, PauseCircle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabKey = "jobs" | "log" | "downtime" | "summary";

interface Tab {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { key: "jobs", label: "Jobs", icon: <ClipboardList size={20} /> },
  { key: "log", label: "Log Entry", icon: <FilePen size={20} /> },
  { key: "downtime", label: "Downtime", icon: <PauseCircle size={20} /> },
  { key: "summary", label: "Summary", icon: <BarChart3 size={20} /> },
];

interface BottomTabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <div className="tab-bar bg-white border-t border-gray-200 pb-safe">
      <div className="flex">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              active === tab.key
                ? "text-smj-navy border-t-2 border-smj-navy -mt-px"
                : "text-gray-400 border-t-2 border-transparent -mt-px"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
