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
  const existingIndex = reports.findIndex((report) => report.id === record.reportId);

  const lockedReport: ShadowScoreReport = {
    id: record.reportId,
    title: `${record.planName} Checkout`,
    source: `Payment intent • ${record.method} • ${new Date(record.acceptedAt).toLocaleString()}`,
    createdAt: record.acceptedAt,
    score: 0,
    confidence: 0,
    status: "Locked",
    factors: [
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
