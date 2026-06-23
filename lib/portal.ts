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

export const demoReports: ShadowScoreReport[] = [
  {
    reportId: "SS-2026-000481",
    acceptanceId: "SSA-2026-000481",
    title: "eBay MC011 Exposure Review",
    entity: "gadge.deals",
    platform: "eBay",
    riskScore: 78,
    confidenceScore: 84,
    stage: "Restricted",
    createdAt: "2026-06-17T12:30:00.000Z",
    source: "Example dataset",
    topFactors: ["Supplier documentation gaps", "Tracking integrity exposure", "Marketplace enforcement signals", "Retail arbitrage indicators"],
  },
  {
    reportId: "SS-2026-000512",
    acceptanceId: "SSA-2026-000512",
    title: "Payment Hold Risk Snapshot",
    entity: "PayPal / Payoneer flow",
    platform: "Payments",
    riskScore: 64,
    confidenceScore: 76,
    stage: "Warning",
    createdAt: "2026-06-18T08:45:00.000Z",
    source: "Example dataset",
    topFactors: ["Payout review friction", "Reserve exposure", "Business verification dependency"],
  },
];

export const demoEntities: ShadowScoreEntity[] = [
  { id: "ent-ebay", name: "eBay Seller Account", type: "Marketplace", status: "Needs Evidence", lastScore: 78, updatedAt: "2026-06-17T12:30:00.000Z" },
  { id: "ent-paypal", name: "PayPal / Payoneer Payments", type: "Payment", status: "Monitoring", lastScore: 64, updatedAt: "2026-06-18T08:45:00.000Z" },
  { id: "ent-url", name: "shadowscore.io", type: "Website", status: "Stable", lastScore: 31, updatedAt: "2026-06-19T07:20:00.000Z" },
];

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
