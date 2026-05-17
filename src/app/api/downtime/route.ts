// src/app/api/downtime/route.ts
// NOTE: Downtime events are now inserted as part of /api/submit (with shift_report_id FK).
// This route handles standalone downtime queries for a given shift report.

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shiftReportId = searchParams.get("shiftReportId");

  if (!shiftReportId) {
    return NextResponse.json(
      { error: "shiftReportId query param is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("downtime_events")
    .select("*")
    .eq("shift_report_id", shiftReportId)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("GET /api/downtime error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data });
}