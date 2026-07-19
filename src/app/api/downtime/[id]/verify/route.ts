// src/app/api/downtime/[id]/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: requester } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (requester?.role !== "maintenance_technician" && requester?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { correctiveAction, downtimeCodeId } = await req.json();

  if (!correctiveAction) {
    return NextResponse.json({ error: "Corrective action is required" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const updatePayload: Record<string, unknown> = {
    corrective_action: correctiveAction,
    status: "verified",
    verified_by: user.id,
  };
  if (downtimeCodeId) {
    updatePayload.downtime_code_id = downtimeCodeId;
  }

  const { data, error } = await supabaseAdmin
    .from("downtime_events")
    .update(updatePayload)
    .eq("id", id)
    .eq("status", "recorded")
    .select()
    .single();

  if (error) {
    console.error("PATCH /api/downtime/[id]/verify error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}