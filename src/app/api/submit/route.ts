import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { ShiftReport } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: ShiftReport = await req.json();

    const { data, error } = await supabase
      .from("shift_reports")
      .insert([
        {
          shift: body.shift,
          shift_date: body.shiftDate,
          line: body.line,
          supervisor_name: body.supervisorName,
          total_cases_produced: body.totalCasesProduced,
          total_cases_rejected: body.totalCasesRejected,
          total_downtime_minutes: body.totalDowntimeMinutes,
          production_logs: body.productionLogs,
          downtime_events: body.downtimeEvents,
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase shift report insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ report: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/submit error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
