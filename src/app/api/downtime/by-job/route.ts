// src/app/api/downtime/by-job/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobNum = searchParams.get("jobNum");

  if (!jobNum) {
    return NextResponse.json({ error: "jobNum query param is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("downtime_events")
    .select(`
      id, job_num, job_description, shift, shift_date,
      part_affected, start_time, end_time, duration_minutes,
      description, supervisor_name, logged_at, status, corrective_action,
      downtime_code_id,
      downtime_codes ( code, label, category )
    `)
    .eq("job_num", jobNum)
    .is("shift_report_id", null)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("GET /api/downtime/by-job error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data });
}