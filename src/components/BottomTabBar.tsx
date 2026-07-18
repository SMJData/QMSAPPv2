// BottomTabBar.tsx
"use client";

import { ClipboardList, FilePen, PauseCircle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabKey = "jobs" | "log" | "downtime" | "summary";
export type UserRole = "admin" | "production_coordinator" | "machine_operator" | "maintenance_technician";

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

// Central role → tab visibility map
const ROLE_TAB_ACCESS: Record<UserRole, TabKey[]> = {
  admin: ["jobs", "log", "downtime", "summary"],
  production_coordinator: ["jobs", "log", "downtime", "summary"],
  machine_operator: ["jobs", "downtime"],
  maintenance_technician: ["jobs", "downtime"],
};

interface BottomTabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  role: UserRole;
}

export function BottomTabBar({ active, onChange, role }: BottomTabBarProps) {
  const visibleTabs = TABS.filter((tab) => ROLE_TAB_ACCESS[role]?.includes(tab.key));

  return (
    <div className="tab-bar bg-white border-t border-gray-200 pb-safe">
      <div className="flex">
        {visibleTabs.map((tab) => (
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