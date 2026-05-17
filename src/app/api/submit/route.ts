// src/app/api/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { ShiftReport } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: ShiftReport = await req.json();

    // 1. Insert shift report — this is the single source of truth
    const { data: report, error: reportError } = await supabase
      .from("shift_reports")
      .insert({
        job_num:               body.productionLogs[0]?.jobNum,
        job_description:       body.productionLogs[0]?.jobDescription,
        brand:                 body.productionLogs[0]?.brand,
        shift:                 body.shift,
        shift_date:            body.shiftDate,
        line:                  body.line,
        supervisor_name:       body.supervisorName,
        cases_produced:        body.totalCasesProduced,
        cases_rejected:        body.totalCasesRejected,
        notes:                 body.productionLogs[0]?.notes ?? null,
        total_downtime_minutes: body.totalDowntimeMinutes,
        submitted_at:          new Date().toISOString(),
      })
      .select("id")
      .single();

    if (reportError) {
      console.error("shift_reports insert error:", reportError);
      // Handle duplicate submission gracefully
      if (reportError.code === "23505") {
        return NextResponse.json(
          { error: "A report for this job, shift, date and line already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }

    const shiftReportId = report.id;

    // 2. Insert downtime events linked to the shift report
    if (body.downtimeEvents && body.downtimeEvents.length > 0) {
      const downtimeRows = body.downtimeEvents.map((e) => ({
        shift_report_id: shiftReportId,
        category:        e.category,
        part_affected:   e.partAffected ?? e.category, // fallback until partAffected is added to form
        start_time:      e.startTime,
        end_time:        e.endTime ?? null,
        description:     e.description ?? null,
        supervisor_name: body.supervisorName,
        logged_at:       new Date().toISOString(),
      }));

      const { error: downtimeError } = await supabase
        .from("downtime_events")
        .insert(downtimeRows);

      if (downtimeError) {
        console.error("downtime_events insert error:", downtimeError);
        // Report was saved — don't fail the whole request, just warn
        return NextResponse.json(
          { report, warning: "Report saved but downtime events failed to insert." },
          { status: 207 }
        );
      }
    }

    return NextResponse.json({ report }, { status: 201 });

  } catch (error) {
    console.error("POST /api/submit error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}