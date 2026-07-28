import type { AlertCandidate, AlertCategory, AlertSeverity, MonitoredEntity, MonitoringAlert, MonitoringSnapshot, MonitoringState, NotificationEvent, RiskTrend } from "./types";

const rank: Record<AlertSeverity, number> = { low: 1, medium: 2, high: 3, critical: 4 };
const stableString = (value: unknown) => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function calculateSeverity(category: AlertCategory, previousValue: unknown, currentValue: unknown): AlertSeverity {
  if (category === "provider_failure") return "high";
  if (category === "regulatory_event") return "critical";
  if (category === "identity" || category === "marketplace_status") return "high";
  if (category === "trust_score" && typeof previousValue === "number" && typeof currentValue === "number") {
    const drop = previousValue - currentValue;
    return drop >= 20 ? "critical" : drop >= 10 ? "high" : drop >= 5 ? "medium" : "low";
  }
  return category === "dns" || category === "ssl" || category === "email_authentication" ? "medium" : "low";
}

export function calculateRiskTrend(snapshots: readonly MonitoringSnapshot[]): RiskTrend {
  const ordered = [...snapshots].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  if (ordered.length < 2) return "stable";
  const change = ordered.at(-1)!.trustScore - ordered[0].trustScore;
  return change >= 3 ? "improving" : change <= -3 ? "declining" : "stable";
}

export function createMonitoring(input: { workspaceId: string; reportId: string; company: string; target: string; trustScore: number; frequency?: MonitoredEntity["frequency"]; now?: string }): MonitoredEntity {
  const now = input.now ?? new Date().toISOString();
  return { id: `monitor-${slug(input.reportId)}`, workspaceId: input.workspaceId, reportId: input.reportId, company: input.company, target: input.target, status: "paused", frequency: input.frequency ?? "daily", currentTrustScore: input.trustScore, lastScanAt: null, lastSuccessfulCycleAt: null, createdAt: now };
}
export const startMonitoring = (entity: MonitoredEntity): MonitoredEntity => ({ ...entity, status: "active" });
export const pauseMonitoring = (entity: MonitoredEntity): MonitoredEntity => ({ ...entity, status: "paused" });

export function alertFingerprint(alert: AlertCandidate): string {
  return [alert.monitoredEntityId, alert.provider, alert.category, stableString(alert.previousValue), stableString(alert.currentValue)].join("|");
}
export function addAlert(state: MonitoringState, candidate: AlertCandidate): { state: MonitoringState; alert: MonitoringAlert | null } {
  const fingerprint = alertFingerprint(candidate);
  if (state.alerts.some((alert) => !alert.resolved && alert.fingerprint === fingerprint)) return { state, alert: null };
  const alert: MonitoringAlert = { ...candidate, id: `alert-${state.alerts.length + 1}`, resolved: false, fingerprint };
  const channels: NotificationEvent["channel"][] = rank[alert.severity] >= rank.high ? ["email", "whatsapp", "webhook"] : ["email"];
  const notifications = channels.map((channel, index): NotificationEvent => ({ id: `notification-${state.notifications.length + index + 1}`, monitoringAlertId: alert.id, channel, status: "pending", createdAt: alert.detectedAt }));
  return { alert, state: { ...state, alerts: [...state.alerts, alert], notifications: [...state.notifications, ...notifications] } };
}
export const orderTimeline = (alerts: readonly MonitoringAlert[]) => [...alerts].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt) || b.id.localeCompare(a.id));

