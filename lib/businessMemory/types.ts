export type BusinessMemoryPrimitive = string | number | boolean | null;

export type BusinessIdentity = {
  id?: string;
  name?: string;
  legalName?: string;
  domain?: string;
  emails?: string[];
  phones?: string[];
  identifiers?: Record<string, string>;
};

export type BusinessMemoryEntity = {
  id?: string;
  type: string;
  value: string;
  label?: string;
  attributes?: Record<string, BusinessMemoryPrimitive>;
};

export type BusinessMemoryRelationship = {
  id?: string;
  type: string;
  from: string;
  to: string;
  context?: string;
};

export type BusinessMemoryEvidence = {
  id?: string;
  type?: string;
  label: string;
  value?: string;
  source?: string;
  observedAt?: string;
};

export type BusinessMemoryDecision = {
  decision: string;
  confidence?: string;
  riskLevel?: string;
  recommendation?: string;
};

export type BusinessSnapshotInput = {
  scanId?: string;
  identity: BusinessIdentity;
  entities?: BusinessMemoryEntity[];
  relationships?: BusinessMemoryRelationship[];
  evidence?: BusinessMemoryEvidence[];
  decision?: BusinessMemoryDecision | string;
  timestamp?: string;
};

export type BusinessSnapshot = Required<Pick<BusinessSnapshotInput, "identity" | "entities" | "relationships" | "evidence">> & {
  id: string;
  businessKey: string;
  scanId: string;
  decision?: BusinessMemoryDecision;
  timestamp: string;
};

export type BusinessChangeType =
  | "new_email"
  | "removed_email"
  | "new_phone"
  | "removed_phone"
  | "new_domain"
  | "removed_domain"
  | "ownership_change"
  | "provider_change"
  | "decision_change"
  | "evidence_change";

export type BusinessChange = {
  type: BusinessChangeType;
  field: string;
  previousValue?: string;
  latestValue?: string;
  summary: string;
};

export type StabilityLevel = "stable" | "low_change" | "moderate_change" | "high_change" | "first_scan";

export type BusinessHistory = {
  businessKey: string;
  snapshots: BusinessSnapshot[];
};

export type BusinessMemoryResult = {
  businessHistory: BusinessHistory;
  latestSnapshot: BusinessSnapshot;
  previousSnapshot?: BusinessSnapshot;
  detectedChanges: BusinessChange[];
  stabilityLevel: StabilityLevel;
  changeSummary: string;
};
