import type { EvidenceItem, EvidenceRef } from "../evidence/types";

export type IdentityConfidence = "Confirmed" | "Likely" | "Possible" | "Unknown";

export type IdentitySignalType =
  | "business_name"
  | "domain"
  | "email"
  | "phone"
  | "website"
  | "organization_schema"
  | "social_profile"
  | "marketplace_account"
  | "payment_account";

export type IdentitySignal = {
  type: IdentitySignalType;
  value: string;
  normalizedValue: string;
  evidenceRef: string;
  evidenceItemId: string;
  source: string;
};

export type IdentityContradictionType =
  | "Business names differ"
  | "Phone belongs elsewhere"
  | "Email mismatch"
  | "Social profile mismatch"
  | "Domain mismatch"
  | "Marketplace alias mismatch"
  | "Payment account mismatch";

export type IdentityContradiction = {
  id: string;
  type: IdentityContradictionType;
  severity: "low" | "medium" | "high";
  message: string;
  evidenceRefs: string[];
  values: string[];
};

export type IdentityObject = {
  identityId: string;
  displayName: string;
  confidence: IdentityConfidence;
  aliases: string[];
  domains: string[];
  emails: string[];
  phones: string[];
  socialProfiles: string[];
  marketplaceAccounts: string[];
  paymentAccounts: string[];
  evidenceRefs: string[];
  contradictions: IdentityContradiction[];
  confidenceScore: number;
};

export type IdentityResolutionInput = {
  evidenceItems: EvidenceItem[];
};

export type IdentityGraphNode = { id: string; type: "Identity" | IdentitySignalType | "Evidence"; label: string };
export type IdentityGraphEdge = { from: string; to: string; type: "SUPPORTED_BY" | "HAS_SIGNAL" | "CONTRADICTS" };
export type IdentityGraph = { nodes: IdentityGraphNode[]; edges: IdentityGraphEdge[] };

export type IdentityResolutionResult = {
  identities: IdentityObject[];
  contradictions: IdentityContradiction[];
  graph: IdentityGraph;
  examples: IdentityObject[];
  confidenceCalculations: string[];
  knownLimitations: string[];
};

export type NormalizedIdentityEvidenceRef = EvidenceRef & { identityType?: IdentitySignalType };
