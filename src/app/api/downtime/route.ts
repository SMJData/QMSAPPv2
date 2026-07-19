// src/app/api/downtime/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    jobNum,
    jobDescription,
    shift,
    shiftDate,
    downtimeCodeId,
    partAffected,
    startTime,
    endTime,
    description,
    supervisorName,
  } = body;

  if (!jobNum || !downtimeCodeId || !partAffected || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("downtime_events")
    .insert({
      job_num: jobNum,
      job_description: jobDescription,
      shift,
      shift_date: shiftDate,
      downtime_code_id: downtimeCodeId,
      part_affected: partAffected,
      start_time: startTime,
      end_time: endTime,
      description,
      supervisor_name: supervisorName,
      status: "recorded",
    })
    .select()
    .single();

  if (error) {
    console.error("POST /api/downtime error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data }, { status: 201 });
}
