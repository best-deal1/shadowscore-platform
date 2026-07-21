export type TrustGraphEntityType =
  | "Business"
  | "Organization"
  | "Individual"
  | "Domain"
  | "Email"
  | "Phone"
  | "Address"
  | "PaymentIdentity"
  | "MarketplaceIdentity"
  | "GovernmentRegistration"
  | "Evidence"
  | "Relationship"
  | "Finding"
  | "Decision"
  | "MonitoringEvent";

export type TrustGraphRelationshipType =
  | "owns"
  | "controls"
  | "registered_at"
  | "uses"
  | "operates"
  | "linked_to"
  | "verified_by"
  | "observed_in"
  | "connected_to"
  | "shares_with";

export type TrustGraphEventType =
  | "entity_created"
  | "entity_updated"
  | "relationship_created"
  | "evidence_added"
  | "finding_recorded"
  | "decision_recorded"
  | "monitoring_event_recorded"
  | "trust_changed";

export type Provenance = {
  source: string;
  sourceRecordId?: string;
  engine: string;
  engineVersion?: string;
  observedAt: string;
  ingestedAt: string;
};

export type TrustGraphEntity = {
  id: string;
  type: TrustGraphEntityType;
  canonicalName: string;
  attributes: Record<string, unknown>;
  provenance: Provenance;
  confidence: number;
  createdAt: string;
  updatedAt: string;
};

export type TrustGraphRelationship = {
  id: string;
  type: TrustGraphRelationshipType;
  fromEntityId: string;
  toEntityId: string;
  provenance: Provenance;
  confidence: number;
  validFrom: string;
  validTo?: string;
  evidenceIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type TrustGraphTimelineEvent = {
  id: string;
  entityId: string;
  type: TrustGraphEventType;
  occurredAt: string;
  recordedAt: string;
  actor: { type: "engine" | "analyst" | "system"; id: string };
  reason: string;
  evidenceIds: string[];
  provenance: Provenance;
  details: Record<string, unknown>;
};

export type TrustGraphDecision = {
  id: string;
  entityId: string;
  recommendation: string;
  confidence: number;
  evidenceIds: string[];
  analyst: string;
  policyVersion: string;
  businessImpact: string;
  previousDecisionIds: string[];
  decidedAt: string;
  provenance: Provenance;
};

export type TrustGraphTrust = {
  entityId: string;
  score: number;
  confidence: number;
  calculatedAt: string;
  engineVersion: string;
  evidenceIds: string[];
  explanation: string;
};

export type UpsertEntityInput = Omit<TrustGraphEntity, "createdAt" | "updatedAt">;
export type CreateRelationshipInput = Omit<TrustGraphRelationship, "createdAt" | "updatedAt">;
export type RecordDecisionInput = TrustGraphDecision;
