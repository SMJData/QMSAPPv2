// src/app/api/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { ShiftReport } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: ShiftReport = await req.json();

    const jobNum = body.productionLogs[0]?.jobNum;
    const jobDescription = body.productionLogs[0]?.jobDescription;
    const brand = body.productionLogs[0]?.brand;

    if (!jobNum) {
      return NextResponse.json({ error: "No job associated with this report" }, { status: 400 });
    }

    // 1. Insert shift report — the single source of truth
    const { data: report, error: reportError } = await supabase
      .from("shift_reports")
      .insert({
        job_num: jobNum,
        job_description: jobDescription,
        brand,
        shift: body.shift,
        shift_date: body.shiftDate,
        line: body.line,
        supervisor_name: body.supervisorName,
        cases_produced: body.totalCasesProduced,
        cases_rejected: body.totalCasesRejected,
        notes: body.productionLogs[0]?.notes ?? null,
        total_downtime_minutes: body.totalDowntimeMinutes,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (reportError) {
      console.error("shift_reports insert error:", reportError);
      if (reportError.code === "23505") {
        return NextResponse.json(
          { error: "A report for this job, shift, date and line already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }

    const shiftReportId = report.id;

    // 2. Link existing downtime events for this job to the new shift report,
    // instead of re-inserting them. These were already recorded by the operator
    // and possibly verified by a technician — we're just attaching sign-off.
    const { error: linkError } = await supabase
      .from("downtime_events")
      .update({ shift_report_id: shiftReportId })
      .eq("job_num", jobNum)
      .is("shift_report_id", null);

    if (linkError) {
      console.error("downtime_events link error:", linkError);
      return NextResponse.json(
        { report, warning: "Report saved but downtime events failed to link." },
        { status: 207 }
      );
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("POST /api/submit error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
