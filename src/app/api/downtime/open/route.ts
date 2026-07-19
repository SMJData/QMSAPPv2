// src/app/api/downtime/open/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("downtime_events")
    .select(`
      id, job_num, job_description, shift, shift_date,
      part_affected, start_time, end_time, duration_minutes,
      description, supervisor_name, logged_at, status, corrective_action,
      downtime_code_id,
      downtime_codes ( code, label, category )
    `)
    .eq("status", "recorded")
    .order("logged_at", { ascending: false });

  if (error) {
    console.error("GET /api/downtime/open error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data });
}
