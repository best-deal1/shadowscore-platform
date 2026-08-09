export type InvestigationInputKind = "email" | "phone" | "person" | "company" | "registration_number" | "domain" | "marketplace_identity";
export type EntityKind = "person" | "company" | "email" | "phone" | "domain" | "marketplace_account" | "address";
export type ResolutionStatus = "confirmed" | "probable" | "possible" | "conflicting" | "unresolved";

export type SourceReference = {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  observedAt: string;
  retrievedAt: string;
  reliability: number;
};

export type EntityIdentifier = {
  kind: InvestigationInputKind | "address";
  value: string;
};

export type EntityCandidate = {
  candidateId: string;
  kind: EntityKind;
  label: string;
  identifiers: EntityIdentifier[];
  evidenceIds: string[];
};

export type EvidenceAssertion = {
  evidenceId: string;
  subjectCandidateId: string;
  objectCandidateId?: string;
  relationship: string;
  value: string;
  source: SourceReference;
  confidence: number;
  evidenceType: "registry" | "website" | "marketplace" | "contact" | "complaint" | "ownership" | "historical" | "other";
};

export type ResolvedEntity = {
  entityId: string;
  kind: EntityKind;
  label: string;
  aliases: string[];
  candidateIds: string[];
  identifiers: EntityIdentifier[];
  resolution: ResolutionStatus;
  confidence: number;
  evidenceIds: string[];
};

export type EvidenceEdge = {
  edgeId: string;
  fromEntityId: string;
  toEntityId?: string;
  relationship: string;
  value: string;
  confidence: number;
  status: ResolutionStatus;
  contradictionIds: string[];
  source: SourceReference;
  evidenceId: string;
  freshness: "current" | "aging" | "stale";
};

export type InvestigationContradiction = {
  contradictionId: string;
  type: "conflicting_value" | "identifier_reuse" | "identity_change";
  title: string;
  explanation: string;
  severity: "medium" | "high" | "critical";
  entityIds: string[];
  evidenceIds: string[];
};

export type InvestigationDecision = {
  outcome: "proceed" | "proceed_with_conditions" | "investigate" | "stop";
  confidence: number;
  summary: string;
  nextActions: string[];
};

export type InvestigationGraph = {
  engineVersion: string;
  generatedAt: string;
  seed: { kind: InvestigationInputKind; value: string };
  entities: ResolvedEntity[];
  evidence: EvidenceEdge[];
  contradictions: InvestigationContradiction[];
  marketplace: { entityIds: string[]; evidenceIds: string[]; connectedEntityIds: string[] };
  decision: InvestigationDecision;
};

export type InvestigationEngineInput = {
  seed: { kind: InvestigationInputKind; value: string };
  candidates: EntityCandidate[];
  evidence: EvidenceAssertion[];
  now?: string;
  logger?: Pick<Console, "info" | "warn">;
};
