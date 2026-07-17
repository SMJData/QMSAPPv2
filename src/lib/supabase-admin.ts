// src/lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

// Service-role client — server-only, never import this in a "use client" file.
// Bypasses RLS entirely, so only use it in trusted admin-only routes.
// Lazily created so build-time page-data collection doesn't fail if the
// service role key isn't present in that build context.
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}