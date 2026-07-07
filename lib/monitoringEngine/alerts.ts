import type { MonitoringChange, MonitoringSeverity } from "./types";

export type MonitoringAlert = {
  id: string;
  severity: MonitoringSeverity;
  title: string;
  message: string;
  changes: MonitoringChange[];
  createdAt: string;
};

const severityRank: Record<MonitoringSeverity, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

export const summarizeChangesAsAlert = (changes: MonitoringChange[], createdAt = new Date().toISOString()): MonitoringAlert | null => {
  if (changes.length === 0) return null;

  const highestSeverity = changes.reduce<MonitoringSeverity>((highest, change) =>
    severityRank[change.severity] > severityRank[highest] ? change.severity : highest,
  "info");

  const categories = Array.from(new Set(changes.map((change) => change.category))).sort();

  return {
    id: `monitoring-alert-${createdAt.replace(/[^0-9]/g, "")}`,
    severity: highestSeverity,
    title: `${changes.length} meaningful monitoring change${changes.length === 1 ? "" : "s"} detected`,
    message: `Changed categories: ${categories.join(", ")}.`,
    changes,
    createdAt,
  };
};
