import type { CostRecord } from "./billing.ts";

export type UsageMetric = "investigation" | "monitoring_execution" | "ai_usage" | "provider_spend" | "storage_usage";
export type UsageEntry = { metric: UsageMetric; quantity: number; occurredAt: string; cost?: number; currency?: string };
export type WorkspaceAllowance = { metric: UsageMetric; limit: number | null };
export type WorkspaceUsageSummary = {
  periodStart: string;
  periodEnd: string;
  investigationsUsed: number;
  investigationsRemaining: number | null;
  monitoringExecutions: number;
  aiUsage: number;
  providerSpend: number;
  storageUsage: number;
  monthlyTotals: { usage: number; cost: number; currency: string };
};

export function summarizeWorkspaceUsage(entries: readonly UsageEntry[], allowances: readonly WorkspaceAllowance[], period: { start: string; end: string; currency: string }): WorkspaceUsageSummary {
  const start = Date.parse(period.start), end = Date.parse(period.end);
  const current = entries.filter((entry) => { const time = Date.parse(entry.occurredAt); return time >= start && time < end; });
  const total = (metric: UsageMetric) => current.filter((entry) => entry.metric === metric).reduce((sum, entry) => sum + entry.quantity, 0);
  const investigationsUsed = total("investigation");
  const investigationLimit = allowances.find((item) => item.metric === "investigation")?.limit ?? null;
  return {
    periodStart: period.start, periodEnd: period.end, investigationsUsed,
    investigationsRemaining: investigationLimit === null ? null : Math.max(0, investigationLimit - investigationsUsed),
    monitoringExecutions: total("monitoring_execution"), aiUsage: total("ai_usage"), providerSpend: total("provider_spend"), storageUsage: total("storage_usage"),
    monthlyTotals: { usage: current.reduce((sum, entry) => sum + entry.quantity, 0), cost: current.reduce((sum, entry) => sum + (entry.cost ?? 0), 0), currency: period.currency },
  };
}

export function costRecordsToUsage(records: readonly CostRecord[], occurredAt: string): UsageEntry[] {
  return records.map((record) => ({ metric: record.costSource === "ai_model" ? "ai_usage" : "provider_spend", quantity: record.quantity, occurredAt, cost: record.actualCost?.amount ?? record.estimatedCost.amount, currency: record.estimatedCost.currency }));
}
