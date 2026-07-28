import type { MonitoredEntity, MonitoringFrequency } from "./types";
export type MonitoringJob = { monitoredEntityId: string; trigger: MonitoringFrequency; requestedAt: string };
export const createMonitoringJob = (entity: MonitoredEntity, trigger: MonitoringFrequency, requestedAt = new Date().toISOString()): MonitoringJob => ({ monitoredEntityId: entity.id, trigger, requestedAt });
export function isMonitorDue(entity: MonitoredEntity, at = new Date()): boolean {
  if (entity.status !== "active" || entity.frequency === "manual") return false;
  if (!entity.lastScanAt) return true;
  const interval = entity.frequency === "daily" ? 86_400_000 : 604_800_000;
  return at.getTime() - new Date(entity.lastScanAt).getTime() >= interval;
}

