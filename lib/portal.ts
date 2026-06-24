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

export function saveCheckoutReport(record: ShadowScoreAcceptance) {
  if (typeof window === "undefined") return;
  const reports = readJsonArray<ShadowScoreReport>(REPORTS_STORAGE_KEY, []);
  const exists = reports.some((item) => item.reportId === record.reportId);
  if (exists) return;

  const report: ShadowScoreReport = {
    reportId: record.reportId,
    acceptanceId: record.reportId.replace("SS-", "SSA-"),
    title: `${record.planName} Checkout`,
    entity: "New ShadowScore Request",
    platform: "Checkout",
    riskScore: record.planName.toLowerCase().includes("investigation") ? 82 : 68,
    confidenceScore: 72,
    stage: record.planName.toLowerCase().includes("investigation") ? "Restricted" : "Warning",
    createdAt: record.acceptedAt,
    source: record.source,
    topFactors: ["Legal acceptance recorded", "Payment intent created", "Evidence pending", "Report generation pending"],
  };

  writeJsonArray(REPORTS_STORAGE_KEY, [report, ...reports].slice(0, 50));
}
