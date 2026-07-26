import type { WebsiteAlertSeverity } from "./alerts";
export type WebsiteMonitoringStatus = "Active" | "Paused";
export type WebsiteWatchlistEntry = { id: string; tenantId: string; domain: string; status: WebsiteMonitoringStatus; createdAt: string; lastScannedAt: string | null; latestRiskLevel: WebsiteAlertSeverity | "None"; latestChangeCount: number; nextScanAt: string | null };

export function normalizeWatchlistDomain(input: string) {
  const value = input.trim(); if (!value) throw new Error("Domain is required.");
  let hostname: string; try { hostname = new URL(value.includes("://") ? value : `https://${value}`).hostname; } catch { throw new Error("Enter a valid domain."); }
  hostname = hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  if (!hostname.includes(".") || !/^[a-z0-9.-]+$/.test(hostname)) throw new Error("Enter a valid domain.");
  return hostname;
}

type WatchGlobal = typeof globalThis & { __websiteWatchlist?: WebsiteWatchlistEntry[] };
export class MemoryWebsiteWatchlistRepository {
  private records() { const root = globalThis as WatchGlobal; return root.__websiteWatchlist ?? (root.__websiteWatchlist = []); }
  async list(tenantId: string) { return structuredClone(this.records().filter((item) => item.tenantId === tenantId)); }
  async add(tenantId: string, input: string, now = new Date()) { const domain = normalizeWatchlistDomain(input); if (this.records().some((item) => item.tenantId === tenantId && item.domain === domain)) throw new Error("This domain is already on the watchlist."); const item: WebsiteWatchlistEntry = { id: crypto.randomUUID(), tenantId, domain, status: "Active", createdAt: now.toISOString(), lastScannedAt: null, latestRiskLevel: "None", latestChangeCount: 0, nextScanAt: null }; this.records().push(item); return structuredClone(item); }
  async setStatus(tenantId: string, id: string, status: WebsiteMonitoringStatus) { const item = this.records().find((entry) => entry.tenantId === tenantId && entry.id === id); if (!item) throw new Error("Watchlist entry not found."); item.status = status; }
  async remove(tenantId: string, id: string) { const index = this.records().findIndex((entry) => entry.tenantId === tenantId && entry.id === id); if (index < 0) throw new Error("Watchlist entry not found."); this.records().splice(index, 1); }
}
