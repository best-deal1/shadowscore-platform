import type { InvestigationOutcome, InvestigationStatus, InvestigationTechnicalStatus } from "./types";

export const INVESTIGATION_STATUSES: readonly InvestigationStatus[] = [
  "draft",
  "preview",
  "saved",
  "payment_pending",
  "generating",
  "ready",
  "monitoring",
  "failed",
  "archived",
] as const;

export const INVESTIGATION_OUTCOMES: readonly InvestigationOutcome[] = [
  "unresolved",
  "verified",
  "rejected",
  "escalated",
  "monitored",
  "resolved",
] as const;

export const EMPTY_TECHNICAL_STATUS: InvestigationTechnicalStatus = {
  executed: [],
  skipped: [],
  pending: [],
  failed: [],
};

export function isTerminalInvestigationStatus(status: InvestigationStatus) {
  return status === "ready" || status === "failed" || status === "archived";
}

export function defaultOutcomeForStatus(status: InvestigationStatus): InvestigationOutcome {
  if (status === "ready") return "verified";
  if (status === "monitoring") return "monitored";
  if (status === "failed") return "escalated";
  if (status === "archived") return "resolved";
  return "unresolved";
}
