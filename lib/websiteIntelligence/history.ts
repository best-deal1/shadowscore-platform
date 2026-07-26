import type { WebsiteIntelligenceReport, WebsiteModuleId } from "./types";

export type WebsiteChangeCategory = "SSL/TLS" | "DNS" | "HTTP" | "WHOIS" | "Security Headers" | "Reputation";
export type WebsiteChange = { category: WebsiteChangeCategory; field: string; before: string | null; after: string | null; kind: "added" | "removed" | "changed" };
export type WebsiteChangeReport = { previousScanId: string | null; currentScanId: string; generatedAt: string; summary: string; changes: WebsiteChange[] };
export type WebsiteScanSnapshot = { scanId: string; target: string; scannedAt: string; report: WebsiteIntelligenceReport; changeReport: WebsiteChangeReport };
export interface WebsiteScanHistoryRepository {
  latest(target: string): Promise<WebsiteScanSnapshot | undefined>;
  list(target: string): Promise<readonly WebsiteScanSnapshot[]>;
  append(snapshot: WebsiteScanSnapshot): Promise<void>;
}

const monitoredModules: ReadonlyArray<{ id: WebsiteModuleId; category: WebsiteChangeCategory }> = [
  { id: "ssl", category: "SSL/TLS" }, { id: "dns", category: "DNS" }, { id: "http", category: "HTTP" },
  { id: "domain", category: "WHOIS" }, { id: "security_headers", category: "Security Headers" }, { id: "reputation", category: "Reputation" },
];
const clone = <T,>(value: T): T => structuredClone(value);
function values(report: WebsiteIntelligenceReport, moduleId: WebsiteModuleId) {
  const moduleResult = report.modules.find((item) => item.moduleId === moduleId);
  const entries: Array<[string, string]> = [["Module status", moduleResult?.status || "unavailable"]];
  for (const evidence of moduleResult?.evidence || []) entries.push([evidence.label, evidence.value]);
  return new Map(entries);
}

export function createWebsiteChangeReport(previous: WebsiteScanSnapshot | undefined, current: WebsiteIntelligenceReport, currentScanId: string): WebsiteChangeReport {
  const changes: WebsiteChange[] = [];
  if (previous) for (const monitored of monitoredModules) {
    const before = values(previous.report, monitored.id); const after = values(current, monitored.id);
    for (const field of new Set([...before.keys(), ...after.keys()])) {
      const oldValue = before.get(field) ?? null; const newValue = after.get(field) ?? null;
      if (oldValue !== newValue) changes.push({ category: monitored.category, field, before: oldValue, after: newValue, kind: oldValue === null ? "added" : newValue === null ? "removed" : "changed" });
    }
  }
  return { previousScanId: previous?.scanId || null, currentScanId, generatedAt: current.scannedAt, summary: previous ? (changes.length ? `${changes.length} monitored website changes were detected.` : "No monitored website changes were detected.") : "Baseline website scan recorded.", changes };
}

type HistoryGlobal = typeof globalThis & { __websiteScanHistory?: Map<string, WebsiteScanSnapshot[]> };
export class MemoryWebsiteScanHistoryRepository implements WebsiteScanHistoryRepository {
  private records() { const root = globalThis as HistoryGlobal; return root.__websiteScanHistory ?? (root.__websiteScanHistory = new Map<string, WebsiteScanSnapshot[]>()); }
  async latest(target: string) { return clone(this.records().get(target.toLowerCase())?.at(-1)); }
  async list(target: string) { return clone(this.records().get(target.toLowerCase()) || []); }
  async append(snapshot: WebsiteScanSnapshot) {
    const key = snapshot.target.toLowerCase(); const existing = this.records().get(key) || [];
    if (existing.some((item) => item.scanId === snapshot.scanId)) throw new Error("Website scan snapshots are immutable and scan IDs must be unique.");
    this.records().set(key, [...existing, clone(snapshot)]);
  }
}
export const websiteScanHistoryRepository = new MemoryWebsiteScanHistoryRepository();

