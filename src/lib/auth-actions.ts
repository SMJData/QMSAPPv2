// src/lib/auth-actions.ts
"use client";

import { supabase } from "@/lib/supabase";

export async function logout(router: { push: (path: string) => void; refresh: () => void }) {
  await supabase.auth.signOut();
  router.push("/login");
  router.refresh(); // clears any cached server-rendered data tied to the old session
}