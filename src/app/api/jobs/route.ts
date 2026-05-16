import { NextResponse } from "next/server";
import { fetchOpenJobsFromEpicor } from "@/lib/epicor";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jobs = await fetchOpenJobsFromEpicor();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
