export const monitoringStatuses = ["active", "paused", "attention_required", "archived"] as const;
export type MonitoringStatus = (typeof monitoringStatuses)[number];
export type MonitoringFrequency = "daily" | "weekly" | "manual";
export type RiskTrend = "improving" | "stable" | "declining";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertCategory = "identity" | "website" | "dns" | "ssl" | "email_authentication" | "security_headers" | "whois" | "sec_filing" | "regulatory_event" | "marketplace_status" | "trust_score" | "provider_failure";

export type MonitoredEntity = {
  id: string; workspaceId: string; reportId: string; company: string; target: string;
  status: MonitoringStatus; frequency: MonitoringFrequency; currentTrustScore: number;
  lastScanAt: string | null; lastSuccessfulCycleAt: string | null; createdAt: string;
};
export type MonitoringSnapshot = { id: string; monitoredEntityId: string; trustScore: number; capturedAt: string; values: Partial<Record<AlertCategory, unknown>> };
export type MonitoringAlert = { id: string; monitoredEntityId: string; company: string; provider: string; category: AlertCategory; severity: AlertSeverity; title: string; description: string; detectedAt: string; previousValue: unknown; currentValue: unknown; resolved: boolean; fingerprint: string };
export type NotificationEvent = { id: string; monitoringAlertId: string; channel: "email" | "whatsapp" | "webhook"; status: "pending" | "cancelled"; createdAt: string };
export type MonitoringState = { entities: MonitoredEntity[]; snapshots: MonitoringSnapshot[]; alerts: MonitoringAlert[]; notifications: NotificationEvent[] };
export type AlertCandidate = Omit<MonitoringAlert, "id" | "fingerprint" | "resolved">;

