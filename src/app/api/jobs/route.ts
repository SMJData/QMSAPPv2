// src/app/api/jobs/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchOpenJobsFromEpicor } from "@/lib/epicor";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Try job_master table first (populated by BAQ sync)
    const { data: cachedJobs, error } = await supabase
      .from("job_master")
      .select("*")
      .eq("job_closed", false)
      .order("job_num", { ascending: true });

    if (!error && cachedJobs && cachedJobs.length > 0) {
      // Normalise to the shape the app expects
      const jobs = cachedJobs.map((j) => ({
        jobNum:      j.job_num,
        description: j.description,
        brand:       j.brand,
        size:        j.size,
        pack:        j.pack,
        targetQty:   j.target_qty,
        jobReleased: j.job_released,
        jobHeld:     j.job_held,
        reqDueDate:  j.req_due_date,
      }));
      return NextResponse.json({ jobs, source: "job_master" });
    }

    // 2. Fallback: hit Epicor directly if job_master is empty
    const jobs = await fetchOpenJobsFromEpicor();
    return NextResponse.json({ jobs, source: "epicor" });

  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}