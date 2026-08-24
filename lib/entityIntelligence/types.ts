export const RESOLVER_VERSION = "entity-resolver@1.0.0";

export type EntityType = "organization" | "person";
export type ObservationAttribute = "name" | "domain" | "address" | "phone" | "email" | "registration_id" | "director" | "parent" | "status";
export type ResolutionOutcome = "MATCH" | "POSSIBLE_MATCH" | "NO_MATCH" | "CONFLICT" | "REVIEW_REQUIRED" | "ABSTAIN";

export type Observation = {
  observationId: string;
  workspaceId: string;
  source: string;
  sourceRecordId: string;
  attribute: ObservationAttribute;
  observedValue: string;
  normalizedValue: string;
  observedAt: string;
  jurisdiction: string | null;
  evidenceReference: string;
  reliability: number;
};

export type Entity = {
  entityId: string;
  workspaceId: string;
  entityType: EntityType;
  canonicalName: string;
  aliases: string[];
  domains: string[];
  addresses: string[];
  phoneNumbers: string[];
  emailAddresses: string[];
  registrationIdentifiers: string[];
  peopleAndDirectors: string[];
  relationships: Array<{ entityId: string; type: "parent" | "subsidiary" | "acquired_by" }>;
  status: "active" | "inactive" | "acquired" | "unknown";
  jurisdiction: string | null;
  observationIds: string[];
};

export type ResolutionFeature = {
  attribute: ObservationAttribute;
  left: string;
  right: string;
  similarity: number;
  weight: number;
  contribution: number;
  evidenceReferences: string[];
};

export type ResolutionDecision = {
  decisionId: string;
  workspaceId: string;
  leftEntityId: string;
  rightEntityId: string;
  outcome: ResolutionOutcome;
  confidence: number;
  matchedAttributes: ResolutionFeature[];
  conflictingAttributes: ResolutionFeature[];
  sourceQuality: number;
  method: "deterministic_verified_identifier" | "deterministic_conflict" | "weighted_similarity" | "insufficient_evidence";
  reason: string;
  evidenceReferences: string[];
  decidedAt: string;
  resolverVersion: string;
  policyVersion: string;
  supersedesDecisionId: string | null;
  review: { status: "pending" | "approved" | "rejected" | "split" | "deferred"; actorId: string | null; reason: string | null; reviewedAt: string | null };
};

export type RankedResolutionCandidate = {
  entityId: string;
  rank: number;
  combinedEvidenceScore: number;
  decisions: ResolutionDecision[];
};

export type ResolverPolicy = {
  version: string;
  matchThreshold: number;
  possibleMatchThreshold: number;
  noMatchThreshold: number;
  minimumEvidence: number;
  weights: Record<ObservationAttribute, number>;
};

export type GoldenPair = { pairId: string; category: string; left: Entity; right: Entity; expectedMatch: boolean };
export type EvaluationMetrics = { precision: number; recall: number; f1: number; falseMergeRate: number; falseSplitRate: number; abstentionRate: number; calibrationError: number; reviewRate: number; samples: number };
