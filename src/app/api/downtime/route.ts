import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { DowntimeEvent } from "@/types";
import { calcDurationMinutes } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body: DowntimeEvent = await req.json();
    const duration = body.startTime && body.endTime
      ? calcDurationMinutes(body.startTime, body.endTime)
      : null;

    const { data, error } = await supabase
      .from("downtime_events")
      .insert([
        {
          shift: body.shift,
          shift_date: body.shiftDate,
          line: body.line,
          category: body.category,
          start_time: body.startTime,
          end_time: body.endTime,
          duration_minutes: duration,
          description: body.description,
          supervisor_name: body.supervisorName,
          logged_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase downtime insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/downtime error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
