import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { ProductionLog } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: ProductionLog = await req.json();

    const { data, error } = await supabase
      .from("production_logs")
      .insert([
        {
          job_num: body.jobNum,
          job_description: body.jobDescription,
          brand: body.brand,
          shift: body.shift,
          shift_date: body.shiftDate,
          line: body.line,
          cases_produced: body.casesProduced,
          cases_rejected: body.casesRejected,
          notes: body.notes,
          supervisor_name: body.supervisorName,
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ log: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/logs error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shiftDate = searchParams.get("shiftDate");
  const shift = searchParams.get("shift");

  let query = supabase
    .from("production_logs")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (shiftDate) query = query.eq("shift_date", shiftDate);
  if (shift) query = query.eq("shift", shift);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}
