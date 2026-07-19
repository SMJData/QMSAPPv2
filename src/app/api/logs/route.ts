// src/app/api/logs/route.ts
// NOTE: Individual log POSTs are handled by /api/submit.
// This route is read-only — used for the summary/reporting view.

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shiftDate = searchParams.get("shiftDate");
  const shift     = searchParams.get("shift");

  let query = supabase
    .from("shift_reports")
    .select(`
      id,
      job_num,
      job_description,
      brand,
      shift,
      shift_date,
      supervisor_name,
      cases_produced,
      cases_rejected,
      notes,
      total_downtime_minutes,
      submitted_at,
      created_at,
      downtime_events (
        id,
        part_affected,
        start_time,
        end_time,
        duration_minutes,
        description,
        status,
        corrective_action,
        downtime_codes ( code, label, category )
      )
    `)
    .order("shift_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (shiftDate) query = query.eq("shift_date", shiftDate);
  if (shift)     query = query.eq("shift", shift);

  const { data, error } = await query;

  if (error) {
    console.error("GET /api/logs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}