import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("downtime_codes")
    .select("id, code, label, category")
    .eq("active", true)
    .order("category", { ascending: true })
    .order("code", { ascending: true });

  if (error) {
    console.error("GET /api/downtime-codes error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ codes: data });
}