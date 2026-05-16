import type { EpicorJob, Job } from "@/types";

/**
 * Fetches open FG jobs from the Epicor BAQ via OData.
 * Called server-side only (API route) to keep the API key off the client.
 */
export async function fetchOpenJobsFromEpicor(): Promise<Job[]> {
  const baseUrl = process.env.NEXT_PUBLIC_EPICOR_BASE_URL;
  const apiKey = process.env.EPICOR_API_KEY;

  if (!baseUrl || !apiKey) {
    console.warn("Epicor env vars not set — returning mock data");
    return getMockJobs();
  }

  try {
    const url = `${baseUrl}/BaqSvc/OpenJobs?$filter=JobHead_JobClosed eq false and Part_ClassID eq 'FG'&$orderby=JobHead_ReqDueDate asc`;
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      next: { revalidate: 60 }, // cache for 60s on Vercel
    });

    if (!res.ok) {
      console.error("Epicor BAQ error:", res.status, await res.text());
      return getMockJobs();
    }

    const data = await res.json();
    const rows: EpicorJob[] = data.value ?? [];
    return rows.map(normaliseJob);
  } catch (err) {
    console.error("Epicor fetch failed:", err);
    return getMockJobs();
  }
}

function normaliseJob(row: EpicorJob): Job {
  return {
    jobNum: row.JobHead_JobNum,
    partNum: row.JobHead_PartNum,
    description: row.JobHead_PartDescription || row.Part_PartDescription,
    brand: row.Part_CommercialBrand,
    size: row.Part_CommercialSize1,
    pack: row.Part_CommercialSize2,
    flavor: row.Part_CommercialColor,
    targetQty: row.JobHead_ProdQty,
    reqDueDate: row.JobHead_ReqDueDate,
    isReleased: row.JobHead_JobReleased,
    isHeld: row.JobHead_JobHeld,
    classId: row.Part_ClassID,
  };
}

// -------------------------------------------------------------------
// Mock data — used when Epicor env vars are absent (local dev / demo)
// -------------------------------------------------------------------
function getMockJobs(): Job[] {
  return [
    { jobNum: "0066482", partNum: "T0439022240", description: "Busta Lemon Lime 355ml X24", brand: "Busta", size: "355ml", pack: "X24", flavor: "Lemon Lime", targetQty: 6551, reqDueDate: "2026-05-20", isReleased: false, isHeld: true, classId: "FG" },
    { jobNum: "0066483", partNum: "T0240022240", description: "Classic Lime In 355ml X24", brand: "Classic", size: "355ml", pack: "X24", flavor: "Lime", targetQty: 7425, reqDueDate: "2026-05-20", isReleased: false, isHeld: true, classId: "FG" },
    { jobNum: "0066484", partNum: "T0417022240", description: "Busta Cola 355ml X24", brand: "Busta", size: "355ml", pack: "X24", flavor: "Cola", targetQty: 8393, reqDueDate: "2026-05-20", isReleased: false, isHeld: true, classId: "FG" },
    { jobNum: "0066498", partNum: "T0424022240", description: "Busta Ginger Ale 355ml X24", brand: "Busta", size: "355ml", pack: "X24", flavor: "Ginger Ale", targetQty: 16830, reqDueDate: "2026-05-20", isReleased: false, isHeld: true, classId: "FG" },
    { jobNum: "0066499", partNum: "T0224022240", description: "Classic Ginger Ale 355ml X24", brand: "Classic", size: "355ml", pack: "X24", flavor: "Ginger Ale", targetQty: 10710, reqDueDate: "2026-05-20", isReleased: false, isHeld: true, classId: "FG" },
    { jobNum: "0066803", partNum: "T13MP006240", description: "Fruta Mango Passion 315ml x24", brand: "Fruta", size: "315ml", pack: "X24", flavor: "Mango Passion", targetQty: 5912, reqDueDate: "2026-05-23", isReleased: false, isHeld: true, classId: "FG" },
    { jobNum: "0066816", partNum: "T0454013240", description: "Busta Pineapple 500ml X24", brand: "Busta", size: "500ml", pack: "X24", flavor: "Pineapple", targetQty: 7251, reqDueDate: "2026-05-23", isReleased: false, isHeld: true, classId: "FG" },
    { jobNum: "0066818", partNum: "T0406013240", description: "Busta Banana 500ml X24", brand: "Busta", size: "500ml", pack: "X24", flavor: "Banana", targetQty: 5907, reqDueDate: "2026-05-23", isReleased: false, isHeld: true, classId: "FG" },
    { jobNum: "0066819", partNum: "T0429013240", description: "Busta Green Punch 500ml X24", brand: "Busta", size: "500ml", pack: "X24", flavor: "Green Punch", targetQty: 4406, reqDueDate: "2026-05-23", isReleased: false, isHeld: true, classId: "FG" },
    { jobNum: "0066820", partNum: "T0444013240", description: "Busta Orange 500ml X24", brand: "Busta", size: "500ml", pack: "X24", flavor: "Orange", targetQty: 7020, reqDueDate: "2026-05-23", isReleased: false, isHeld: true, classId: "FG" },
    { jobNum: "0066863", partNum: "T3020013240", description: "Oasis Cranberry Water 500ml X24", brand: "Oasis Flavoured", size: "500ml", pack: "X24", flavor: "Cranberry", targetQty: 19500, reqDueDate: "2026-05-23", isReleased: false, isHeld: true, classId: "FG" },
    { jobNum: "0066864", partNum: "T3057013240", description: "Oasis Premium Purified Water 500ml X24", brand: "Oasis", size: "500ml", pack: "X24", flavor: "Water", targetQty: 24000, reqDueDate: "2026-05-23", isReleased: false, isHeld: true, classId: "FG" },
    { jobNum: "0066893", partNum: "T1723004242", description: "Fruta Kool Kidz Vit.C Fruit Punch 200ml x24", brand: "Kool Kidz", size: "200ml", pack: "X24", flavor: "Fruit Punch", targetQty: 5283, reqDueDate: "2026-05-30", isReleased: true, isHeld: true, classId: "FG" },
    { jobNum: "0066810", partNum: "T0425013240", description: "Busta Ginger Ale 500ml X24", brand: "Busta", size: "500ml", pack: "X24", flavor: "Ginger Ale", targetQty: 2172, reqDueDate: "2026-05-29", isReleased: true, isHeld: false, classId: "FG" },
    { jobNum: "0066847", partNum: "T0844005240", description: "Chubby Orange Tango 250ml X24", brand: "Chubby", size: "250ml", pack: "X24", flavor: "Orange", targetQty: 9200, reqDueDate: "2026-05-29", isReleased: true, isHeld: false, classId: "FG" },
    { jobNum: "0066862", partNum: "T30PL013240", description: "Oasis Pink Lemonade 500ml X24", brand: "Oasis Flavoured", size: "500ml", pack: "X24", flavor: "Pink Lemonade", targetQty: 10420, reqDueDate: "2026-05-23", isReleased: true, isHeld: false, classId: "FG" },
  ];
}
