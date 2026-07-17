// src/components/TopBar.tsx
"use client";

import { SMJLogo } from "./SMJLogo";
import type { ShiftKey } from "@/types";
import { SHIFTS } from "@/lib/constants";
import { Sun, Moon, Wifi, WifiOff, CloudUpload, LogOut, Users } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { logout } from "@/lib/auth-actions";

interface TopBarProps {
  shift: ShiftKey;
  pendingSync?: number;
  syncing?: boolean;
}

export function TopBar({ shift, pendingSync = 0, syncing = false }: TopBarProps) {
  const s = SHIFTS[shift];
  const today = format(new Date(), "EEE d MMM");
  const router = useRouter();
  const { profile } = useSession();

  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="bg-smj-navy px-4 pt-3 pb-2.5 text-white">
      {/* Row 1: logo + shift */}
      <div className="flex items-center justify-between">
        <SMJLogo height={40} variant="white" />
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-white/70 text-xs">
            {shift === "day" ? <Sun size={11} /> : <Moon size={11} />}
            <span>{s.label}</span>
          </div>
          <div className="text-white/50 text-[10px] mt-0.5">{today}</div>
        </div>
      </div>

      {/* Row 2: app label + status pills */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="text-[10px] text-white/50 tracking-wide">
          Production Logger · SMJ-02
        </div>

        <div className="flex items-center gap-1.5">

          {syncing ? (
            <div className="flex items-center gap-1 bg-blue-400/20 border border-blue-400/40 rounded-full px-2 py-0.5">
              <CloudUpload size={10} className="text-blue-300 animate-pulse" />
              <span className="text-blue-300 text-[10px] font-semibold">Syncing…</span>
            </div>
          ) : pendingSync > 0 ? (
            <div className="flex items-center gap-1 bg-amber-400/20 border border-amber-400/40 rounded-full px-2 py-0.5">
              <CloudUpload size={10} className="text-amber-300" />
              <span className="text-amber-300 text-[10px] font-semibold">
                {pendingSync} to sync
              </span>
            </div>
          ) : null}

          {online === null ? null : online ? (
            <div className="flex items-center gap-1 bg-green-400/20 border border-green-400/40 rounded-full px-2 py-0.5">
              <Wifi size={10} className="text-green-300" />
              <span className="text-green-300 text-[10px] font-semibold">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-red-400/20 border border-red-400/40 rounded-full px-2 py-0.5">
              <WifiOff size={10} className="text-red-300" />
              <span className="text-red-300 text-[10px] font-semibold">Offline</span>
            </div>
          )}

          {/* User + admin link + logout */}
          {profile && (
            <div className="flex items-center gap-1.5 ml-1 pl-1.5 border-l border-white/20">
              <span className="text-white/60 text-[10px] hidden sm:inline">
                {profile.full_name ?? profile.email}
              </span>
              {profile.role === "admin" && (
                <button
                  onClick={() => router.push("/admin/users")}
                  title="User management"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <Users size={13} />
                </button>
              )}
              <button
                onClick={() => logout(router)}
                title="Sign out"
                className="text-white/70 hover:text-white transition-colors"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}