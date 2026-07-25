import { isSupabaseConfigured, supabaseFetch } from "../supabase.ts";
import type { WebsiteEvidence, WebsiteIntelligenceReport, WebsiteModuleId } from "./types.ts";

export type WebsiteChangeClassification = "New" | "Improved" | "Regressed" | "Removed";
export type WebsiteChangeCategory = "SSL/TLS" | "DNS" | "Security headers" | "WHOIS" | "HTTP" | "Reputation";

export type WebsiteChange = {
  id: string;
  category: WebsiteChangeCategory;
  classification: WebsiteChangeClassification;
  label: string;
  previousValue?: string;
  currentValue?: string;
  detectedAt: string;
};

export type WebsiteChangeReport = {
  id: string;
  target: string;
  previousScanId?: string;
  currentScanId: string;
  generatedAt: string;
  changes: WebsiteChange[];
};

export type StoredWebsiteScan = {
  id: string;
  userId: string;
  target: string;
  scannedAt: string;
  report: WebsiteIntelligenceReport;
  changeReport: WebsiteChangeReport;
};

const trackedModules: Partial<Record<WebsiteModuleId, WebsiteChangeCategory>> = {
  ssl: "SSL/TLS",
  dns: "DNS",
  security_headers: "Security headers",
  domain: "WHOIS",
  http: "HTTP",
  reputation: "Reputation",
};

const missing = (value: string | undefined) => !value || /^(not published|unavailable|none|no configured)/i.test(value.trim());
const goodHttp = (value: string | undefined) => value !== undefined && Number(value) >= 200 && Number(value) < 400;

function classify(category: WebsiteChangeCategory, label: string, before: string | undefined, after: string | undefined): WebsiteChangeClassification {
  if (before === undefined) return "New";
  if (after === undefined) return "Removed";
  if (missing(before) && !missing(after)) return "Improved";
  if (!missing(before) && missing(after)) return "Removed";
  if (category === "HTTP" && /status/i.test(label) && goodHttp(before) !== goodHttp(after)) return goodHttp(after) ? "Improved" : "Regressed";
  if (category === "Security headers") return "New";
  if (category === "Reputation" && /score/i.test(label)) {
    const previousScore = Number(before);
    const currentScore = Number(after);
    if (Number.isFinite(previousScore) && Number.isFinite(currentScore)) return currentScore > previousScore ? "Improved" : "Regressed";
  }
  if (category === "SSL/TLS" && /expir/i.test(label)) {
    const previousDate = Date.parse(before || "");
    const currentDate = Date.parse(after || "");
    if (Number.isFinite(previousDate) && Number.isFinite(currentDate)) return currentDate > previousDate ? "Improved" : "Regressed";
  }
  return "New";
}

function evidenceById(report: WebsiteIntelligenceReport) {
  const values = new Map<string, WebsiteEvidence>();
  for (const scanModule of report.modules) {
    if (!trackedModules[scanModule.moduleId] || scanModule.status === "failed") continue;
    for (const evidence of scanModule.evidence) values.set(`${scanModule.moduleId}:${evidence.id}`, evidence);
  }
  return values;
}

export function detectWebsiteChanges(previous: WebsiteIntelligenceReport, current: WebsiteIntelligenceReport): WebsiteChange[] {
  const before = evidenceById(previous);
  const after = evidenceById(current);
  const keys = Array.from(new Set([...before.keys(), ...after.keys()])).sort();
  return keys.flatMap((key, index) => {
    const oldEvidence = before.get(key);
    const newEvidence = after.get(key);
    if (oldEvidence?.value === newEvidence?.value) return [];
    const moduleId = key.slice(0, key.indexOf(":")) as WebsiteModuleId;
    const category = trackedModules[moduleId];
    if (!category) return [];
    const label = newEvidence?.label || oldEvidence?.label || key;
    const previousValue = oldEvidence?.value;
    const currentValue = newEvidence?.value;
    return [{
      id: `${current.scannedAt.replace(/[^0-9]/g, "")}-${index}`,
      category,
      classification: classify(category, label, previousValue, currentValue),
      label,
      previousValue,
      currentValue,
      detectedAt: current.scannedAt,
    }];
  });
}

const memoryHistory = new Map<string, StoredWebsiteScan[]>();
const historyKey = (userId: string, target: string) => `${userId}:${target.toLowerCase()}`;
const scanId = (target: string, scannedAt: string) => `${target.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${scannedAt.replace(/[^0-9]/g, "")}`;

/** Appends one immutable scan and compares it only with the latest earlier scan. */
export async function persistWebsiteScan(input: { userId: string; report: WebsiteIntelligenceReport; accessToken?: string }): Promise<StoredWebsiteScan> {
  const { userId, report, accessToken } = input;
  let previous: StoredWebsiteScan | undefined;
  if (isSupabaseConfigured() && accessToken) {
    const rows = await supabaseFetch<Array<{ id: string; scanned_at: string; report: WebsiteIntelligenceReport }>>(`/rest/v1/website_intelligence_scans?target=eq.${encodeURIComponent(report.target)}&select=id,scanned_at,report&order=scanned_at.desc&limit=1`, {}, accessToken);
    if (rows[0]) previous = { id: rows[0].id, userId, target: report.target, scannedAt: rows[0].scanned_at, report: rows[0].report, changeReport: {} as WebsiteChangeReport };
  } else {
    previous = memoryHistory.get(historyKey(userId, report.target))?.at(-1);
  }

  const id = scanId(report.target, report.scannedAt);
  const changeReport: WebsiteChangeReport = {
    id: `change-${id}`,
    target: report.target,
    previousScanId: previous?.id,
    currentScanId: id,
    generatedAt: report.scannedAt,
    changes: previous ? detectWebsiteChanges(previous.report, report) : [],
  };
  const stored = { id, userId, target: report.target, scannedAt: report.scannedAt, report, changeReport };

  if (isSupabaseConfigured() && accessToken) {
    await supabaseFetch("/rest/v1/website_intelligence_scans", { method: "POST", body: JSON.stringify({ id, user_id: userId, target: report.target, scanned_at: report.scannedAt, report, change_report: changeReport }) }, accessToken);
  } else {
    const key = historyKey(userId, report.target);
    memoryHistory.set(key, [...(memoryHistory.get(key) || []), stored]);
  }
  return stored;
}

export function getWebsiteChangeTimeline(userId: string, target: string): WebsiteChange[] {
  return (memoryHistory.get(historyKey(userId, target)) || []).flatMap((scan) => scan.changeReport.changes).sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
}

export async function loadWebsiteChangeTimeline(input: { userId: string; target: string; accessToken?: string }): Promise<WebsiteChange[]> {
  if (isSupabaseConfigured() && input.accessToken) {
    const rows = await supabaseFetch<Array<{ change_report: WebsiteChangeReport }>>(`/rest/v1/website_intelligence_scans?target=eq.${encodeURIComponent(input.target)}&select=change_report&order=scanned_at.desc`, {}, input.accessToken);
    return rows.flatMap((row) => row.change_report.changes);
  }
  return getWebsiteChangeTimeline(input.userId, input.target);
}
