export type ShadowScoreReport = {
  reportId: string;
  acceptanceId?: string;
  title: string;
  entity: string;
  platform: string;
  riskScore: number;
  confidenceScore: number;
  stage: "Healthy" | "Warning" | "Restricted" | "Suspended" | "Critical";
  createdAt: string;
  source: string;
  topFactors: string[];
};

export type ShadowScoreEntity = {
  id: string;
  name: string;
  type: "Marketplace" | "Payment" | "Business" | "Website" | "Supplier";
  status: "Monitoring" | "Needs Evidence" | "Stable" | "High Risk";
  lastScore: number;
  updatedAt: string;
};

export type ShadowScoreAcceptance = {
  reportId: string;
  planName: string;
  price: string;
  method: string;
  acceptedAt: string;
  legalVersion: string;
  source: string;
};

export const REPORTS_STORAGE_KEY = "shadowscoreReports";
export const ENTITIES_STORAGE_KEY = "shadowscoreEntities";
export const ACCEPTANCES_STORAGE_KEY = "shadowscoreLegalAcceptances";

export const demoReports: ShadowScoreReport[] = [];

export const demoEntities: ShadowScoreEntity[] = [];

export function readJsonArray<T>(key: string, fallback: T[] = []): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}


function readReports(): ShadowScoreReport[] {
  return readJsonArray<ShadowScoreReport>(REPORTS_STORAGE_KEY);
}

function writeReports(reports: ShadowScoreReport[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
}


export function writeJsonArray<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Local storage can be unavailable. The product should remain usable.
  }
}

export function saveCheckoutReport(record: { reportId: string; planName: string; price: string; method: string; acceptedAt: string }) {
  const reports = readReports();
  const existingIndex = reports.findIndex((report) => report.reportId === record.reportId);

  const lockedReport: ShadowScoreReport = {
    reportId: record.reportId,
    acceptanceId: record.reportId,
    title: `${record.planName} Checkout`,
    entity: "Payment pending",
    platform: "Checkout",
    riskScore: 0,
    confidenceScore: 0,
    stage: "Warning",
    createdAt: record.acceptedAt,
    source: `Payment intent • ${record.method} • ${new Date(record.acceptedAt).toLocaleString()}`,
    topFactors: [
      "Legal acceptance recorded",
      "Payment intent created",
      "Full report locked until payment is completed"
    ],
  };

  const next = existingIndex >= 0
    ? reports.map((report, index) => (index === existingIndex ? lockedReport : report))
    : [lockedReport, ...reports];

  writeReports(next.slice(0, 25));
}
