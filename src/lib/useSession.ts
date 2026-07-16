// src/lib/useSession.ts
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
};

export function useSession() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) { setProfile(null); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("id", user.id)
        .single();
      if (mounted) { setProfile(data); setLoading(false); }
    };

    loadProfile();

    // Keep profile in sync if session changes (login/logout in another tab, token refresh, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { profile, loading };
}