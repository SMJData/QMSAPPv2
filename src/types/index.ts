// Epicor BAQ Job record
export interface EpicorJob {
  JobHead_Company: string;
  JobHead_JobNum: string;
  JobHead_PartNum: string;
  JobHead_RevisionNum: string;
  JobHead_PartDescription: string;
  JobHead_ProdQty: number;
  JobHead_ReqDueDate: string | null;
  JobHead_StartDate: string | null;
  JobHead_DueDate: string | null;
  JobHead_JobClosed: boolean;
  JobHead_JobComplete: boolean;
  JobHead_JobEngineered: boolean;
  JobHead_JobReleased: boolean;
  JobHead_JobHeld: boolean;
  Part_PartDescription: string;
  Part_ClassID: string;
  Part_CommercialBrand: string;
  Part_CommercialSize1: string;
  Part_CommercialSize2: string;
  Part_CommercialColor: string;
  RowIdent: string;
}

// Normalised job for the UI
export interface Job {
  jobNum: string;
  partNum: string;
  description: string;
  brand: string;
  size: string;
  pack: string;
  flavor: string;
  targetQty: number;
  reqDueDate: string | null;
  isReleased: boolean;
  isHeld: boolean;
  classId: string;
}

export type ShiftKey = "day" | "night";

export interface Shift {
  key: ShiftKey;
  label: string;
  start: string; // "07:00"
  end: string;   // "19:00"
}

export interface ProductionLog {
  id?: string;
  jobNum: string;
  jobDescription: string;
  brand: string;
  shift: ShiftKey;
  shiftDate: string;
  line: string;
  casesProduced: number;
  casesRejected: number;
  notes: string;
  supervisorName: string;
  submittedAt?: string;
}

export type DowntimeCategory =
  | "Operational"
  | "Mechanical"
  | "External"
  | "Scheduled";

export interface DowntimeEvent {
  id?: string;
  jobNum: string;            // ← added
  jobDescription: string;    // ← added
  shift: ShiftKey;
  shiftDate: string;
  line: string;
  category: DowntimeCategory;
  partAffected: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  description: string;
  supervisorName: string;
}

export interface ShiftReport {
  id?: string;
  shift: ShiftKey;
  shiftDate: string;
  line: string;
  supervisorName: string;
  productionLogs: ProductionLog[];
  downtimeEvents: DowntimeEvent[];
  totalCasesProduced: number;
  totalCasesRejected: number;
  totalDowntimeMinutes: number;
  submittedAt: string;
}