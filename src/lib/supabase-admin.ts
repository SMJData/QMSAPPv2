// src/lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

// Service-role client — server-only, never import this in a 'use client' file.
// Bypasses RLS entirely, so only use it in trusted admin-only routes.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);