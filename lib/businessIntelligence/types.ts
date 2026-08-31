import type { ProviderEvidence } from "../providers/types";

export type BusinessFindingCategory =
  | "identity_mismatch"
  | "ownership_inconsistency"
  | "payment_inconsistency"
  | "operational_contradiction"
  | "suspicious_infrastructure_reuse"
  | "conflicting_business_claim"
  | "credibility_support"
  | "credibility_weakening";

export type BusinessFindingDirection = "supports_credibility" | "weakens_credibility" | "needs_review";

export type BusinessEvidenceReference = Pick<ProviderEvidence, "id" | "label" | "value" | "source" | "sourceFamily"> & {
  providerId: string;
  observedAt: string;
  field: string;
};

export type BusinessFinding = {
  id: string;
  category: BusinessFindingCategory;
  direction: BusinessFindingDirection;
  title: string;
  statement: string;
  evidence: BusinessEvidenceReference[];
  affectedFields: string[];
};

export type BusinessIntelligenceResult = {
  engineVersion: string;
  generatedAt: string;
  findings: BusinessFinding[];
  evidenceCount: number;
  providersCorrelated: string[];
};
