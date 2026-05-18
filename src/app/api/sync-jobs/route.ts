// src/app/api/sync-jobs/route.ts
// Pulls open FG jobs from Epicor and upserts into job_master.
// Called automatically when the app detects WiFi after being offline.

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchOpenJobsFromEpicor } from "@/lib/epicor";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch from Epicor
    const jobs = await fetchOpenJobsFromEpicor();

    if (!jobs.length) {
      return NextResponse.json({ synced: 0, message: "No jobs returned from Epicor" });
    }

    // 2. Upsert into job_master
    const rows = jobs.map((j) => ({
      job_num:        j.jobNum,
      part_num:       j.partNum,
      description:    j.description,
      brand:          j.brand     ?? null,
      size:           j.size      ?? null,
      pack:           j.pack      ?? null,
      target_qty:     j.targetQty ?? 0,
      job_released:   j.isReleased ?? false,
      job_held:       j.isHeld     ?? false,
      job_closed:     false,
      req_due_date:   j.reqDueDate ?? null,
      last_synced_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("job_master")
      .upsert(rows, { onConflict: "job_num" });

    if (error) {
      console.error("job_master upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      synced: rows.length,
      source: jobs.length ? "epicor" : "fallback",
      at: new Date().toISOString(),
    });

  } catch (error) {
    console.error("GET /api/sync-jobs error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
