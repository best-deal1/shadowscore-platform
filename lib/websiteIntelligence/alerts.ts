import type { WebsiteChange, WebsiteChangeCategory, WebsiteChangeReport } from "./history";

export type WebsiteAlertSeverity = "Critical" | "High" | "Medium" | "Low";
export type WebsiteAlertStatus = "New" | "Reviewing" | "Resolved" | "Dismissed";
export type WebsiteAlert = {
  id: string; tenantId: string; domain: string; category: WebsiteChangeCategory; severity: WebsiteAlertSeverity;
  field: string; previousValue: string | null; currentValue: string | null; detectedAt: string;
  explanation: string; recommendedAction: string; evidenceSource: string; currentScanId: string;
  previousScanId: string; status: WebsiteAlertStatus;
};

const badReputation = /\b(blocked|malicious|dangerous|listed)\b/i;
const unavailable = /\b(unavailable|unreachable|failed|timeout|error)\b/i;
const invalidTls = /\b(invalid|expired|untrusted|failed)\b/i;
const successHttp = /\b(?:2\d\d|success|reachable|completed)\b/i;
const serverError = /\b5\d\d\b|server error/i;
const importantDns = /\b(mx|a record|aaaa|nameserver|ns|dnssec)\b/i;
const protection = /\b(hsts|content-security-policy|csp|x-frame-options|strict-transport-security)\b/i;
const expiry = /\b(expir|days remaining|valid until|not after)\b/i;

function worsened(change: WebsiteChange) {
  const before = change.before || ""; const after = change.after || "";
  if (change.category === "Reputation") return !badReputation.test(before) && badReputation.test(after);
  if (change.category === "SSL/TLS") return (!invalidTls.test(before) && invalidTls.test(after)) || (expiry.test(change.field) && numericDrop(before, after));
  if (change.category === "HTTP") return (!unavailable.test(before) && unavailable.test(after)) || (successHttp.test(before) && serverError.test(after));
  if (change.category === "DNS") return change.kind === "removed" && importantDns.test(change.field);
  if (change.category === "Security Headers") return change.kind === "removed" || (/present|enabled|valid/i.test(before) && /missing|disabled|invalid/i.test(after));
  if (change.category === "WHOIS") return expiry.test(change.field) && numericDrop(before, after);
  return false;
}

function numericDrop(before: string, after: string) {
  const oldValue = Number(before.match(/\d+/)?.[0]); const newValue = Number(after.match(/\d+/)?.[0]);
  return Number.isFinite(oldValue) && Number.isFinite(newValue) && newValue < oldValue - 14;
}

export function classifyWebsiteRegression(change: WebsiteChange): WebsiteAlertSeverity | null {
  if (!worsened(change)) return null;
  const before = change.before || ""; const after = change.after || "";
  if ((change.category === "HTTP" && !unavailable.test(before) && unavailable.test(after)) ||
      (change.category === "SSL/TLS" && !invalidTls.test(before) && invalidTls.test(after)) ||
      (change.category === "Reputation" && badReputation.test(after))) return "Critical";
  if ((change.category === "HTTP" && successHttp.test(before) && serverError.test(after)) ||
      (change.category === "DNS" && importantDns.test(change.field)) ||
      (change.category === "Security Headers" && protection.test(change.field))) return "High";
  if (change.category === "SSL/TLS" || change.category === "WHOIS" || change.category === "Security Headers") return "Medium";
  return "Low";
}

const guidance: Record<WebsiteChangeCategory, { explanation: string; action: string }> = {
  "SSL/TLS": { explanation: "The HTTPS configuration regressed and may affect secure access.", action: "Review the certificate and TLS configuration, then restore a valid HTTPS setup." },
  DNS: { explanation: "An important DNS record was removed.", action: "Confirm the intended DNS configuration and restore the record if needed." },
  HTTP: { explanation: "Website availability or the HTTP response regressed.", action: "Review server health and deployment logs, then restore a successful response." },
  WHOIS: { explanation: "The recorded domain expiration window materially decreased.", action: "Confirm the registration expiration date and renew the domain when appropriate." },
  "Security Headers": { explanation: "A browser security protection was removed or weakened.", action: "Restore the header with a policy suitable for the website." },
  Reputation: { explanation: "A reputation source now reports a harmful or blocked state.", action: "Review the cited reputation source and investigate the domain for compromise or abuse." },
};

export function createWebsiteAlerts(tenantId: string, domain: string, report: WebsiteChangeReport): WebsiteAlert[] {
  if (!report.previousScanId) return [];
  return report.changes.flatMap((change) => {
    const severity = classifyWebsiteRegression(change); if (!severity) return [];
    const advice = guidance[change.category];
    return [{ id: `${report.currentScanId}:${change.category}:${change.field}`, tenantId, domain, category: change.category, severity, field: change.field, previousValue: change.before, currentValue: change.after, detectedAt: report.generatedAt, explanation: advice.explanation, recommendedAction: advice.action, evidenceSource: `${change.category} Website Intelligence evidence`, currentScanId: report.currentScanId, previousScanId: report.previousScanId!, status: "New" as const }];
  });
}

export function canTransitionAlertStatus(from: WebsiteAlertStatus, to: WebsiteAlertStatus) {
  if (from === to) return true;
  const transitions: Record<WebsiteAlertStatus, WebsiteAlertStatus[]> = { New: ["Reviewing", "Resolved", "Dismissed"], Reviewing: ["New", "Resolved", "Dismissed"], Resolved: ["Reviewing"], Dismissed: ["Reviewing"] };
  return transitions[from].includes(to);
}

export interface WebsiteAlertRepository { list(tenantId: string): Promise<WebsiteAlert[]>; appendMany(alerts: WebsiteAlert[]): Promise<void>; updateStatus(tenantId: string, id: string, status: WebsiteAlertStatus): Promise<void>; }
type AlertGlobal = typeof globalThis & { __websiteAlerts?: WebsiteAlert[] };
export class MemoryWebsiteAlertRepository implements WebsiteAlertRepository {
  private records() { const root = globalThis as AlertGlobal; return root.__websiteAlerts ?? (root.__websiteAlerts = []); }
  async list(tenantId: string) { return structuredClone(this.records().filter((item) => item.tenantId === tenantId)); }
  async appendMany(alerts: WebsiteAlert[]) { for (const alert of alerts) if (!this.records().some((item) => item.id === alert.id)) this.records().push(structuredClone(alert)); }
  async updateStatus(tenantId: string, id: string, status: WebsiteAlertStatus) { const alert = this.records().find((item) => item.tenantId === tenantId && item.id === id); if (!alert) throw new Error("Alert not found."); if (!canTransitionAlertStatus(alert.status, status)) throw new Error("Invalid alert status transition."); alert.status = status; }
}
