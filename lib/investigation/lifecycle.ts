import { classifyTarget } from "../targetClassifier";
import { EMPTY_TECHNICAL_STATUS, defaultOutcomeForStatus } from "./status";
import type { Investigation, InvestigationPatch, InvestigationSeed, InvestigationStatus } from "./types";

const EMPTY_ONTOLOGY = { entities: [], relationships: [] } as const;

function stableHash(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

export function createInvestigationId(seed: Pick<InvestigationSeed, "target" | "userId" | "intakeId" | "createdAt">) {
  return `inv-${stableHash([seed.userId || "anon", seed.intakeId || "no-intake", seed.target.trim().toLowerCase(), seed.createdAt || "no-date"].join("|"))}`;
}

function nowOr(value?: string) {
  return value || new Date().toISOString();
}

function buildInvestigation(seed: InvestigationSeed, status: InvestigationStatus): Investigation {
  const createdAt = nowOr(seed.createdAt);
  const classification = classifyTarget(seed.target);

  return {
    investigationId: seed.investigationId || createInvestigationId({ ...seed, createdAt }),
    target: seed.target,
    normalizedTarget: seed.normalizedTarget || classification.normalizedTarget,
    targetType: seed.targetType || classification.targetType,
    status,
    createdAt,
    updatedAt: createdAt,
    userId: seed.userId,
    intakeId: seed.intakeId,
    reportId: seed.reportId,
    paymentIntentId: seed.paymentIntentId,
    ontologyGraph: { entities: [...EMPTY_ONTOLOGY.entities], relationships: [...EMPTY_ONTOLOGY.relationships] },
    evidenceRefs: [],
    decision: null,
    technicalStatus: { ...EMPTY_TECHNICAL_STATUS },
    outcome: defaultOutcomeForStatus(status),
  };
}

function transition(investigation: Investigation, status: InvestigationStatus, patch: InvestigationPatch = {}, updatedAt = new Date().toISOString()): Investigation {
  return {
    ...investigation,
    ...patch,
    status,
    updatedAt,
    outcome: patch.outcome || defaultOutcomeForStatus(status),
    completedAt: patch.completedAt ?? (status === "ready" || status === "failed" ? updatedAt : investigation.completedAt),
  };
}

export function createDraftInvestigation(seed: InvestigationSeed) {
  return buildInvestigation(seed, "draft");
}

export function createPreviewInvestigation(seed: InvestigationSeed) {
  return buildInvestigation(seed, "preview");
}

export function saveInvestigation(investigation: Investigation, updatedAt?: string) {
  return transition(investigation, "saved", {}, updatedAt);
}

export function attachPaymentIntent(investigation: Investigation, paymentIntentId: string, updatedAt?: string) {
  return transition(investigation, "payment_pending", { paymentIntentId }, updatedAt);
}

export function markGenerating(investigation: Investigation, updatedAt?: string) {
  return transition(investigation, "generating", {}, updatedAt);
}

export function markReady(investigation: Investigation, patch: InvestigationPatch = {}, updatedAt?: string) {
  return transition(investigation, "ready", patch, updatedAt);
}

export function markFailed(investigation: Investigation, patch: InvestigationPatch = {}, updatedAt?: string) {
  return transition(investigation, "failed", patch, updatedAt);
}

export function archiveInvestigation(investigation: Investigation, updatedAt?: string) {
  return transition(investigation, "archived", {}, updatedAt);
}
