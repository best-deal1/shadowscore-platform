import type { ProviderResult } from "../providers/types";

export type BusinessIdentityFindingCategory =
  | "Verified Identity"
  | "Identity Consistent"
  | "Identity Incomplete"
  | "Identity Conflict"
  | "Potential Identity Misrepresentation"
  | "Potential Impersonation"
  | "Conflicting Legal Entity"
  | "Conflicting Contact Information"
  | "Insufficient Ownership Evidence";

export type BusinessIdentityEntityType = "business_name" | "legal_entity" | "domain" | "email" | "phone" | "address" | "policy_owner" | "terms_entity" | "copyright_owner" | "official_claim";

export type BusinessIdentityEvidence = {
  id: string;
  entityType: BusinessIdentityEntityType;
  value: string;
  normalizedValue: string;
  provenance: {
    providerId: string;
    providerVersion?: string;
    evidenceId?: string;
    source: string;
    label: string;
    observedAt?: string;
  };
  reliability: "very_high" | "high" | "medium" | "low";
};

export type BusinessIdentityFinding = {
  id: string;
  category: BusinessIdentityFindingCategory;
  evidence: BusinessIdentityEvidence[];
  provenance: BusinessIdentityEvidence["provenance"][];
  confidence: number;
  explanation: string;
  affectedEntities: Array<{ type: BusinessIdentityEntityType; values: string[] }>;
};

export type BusinessIdentityIntelligenceInput = {
  target?: string;
  claimedBusinessName?: string;
  providerResults?: ProviderResult[];
  generatedAt?: string;
};

export type BusinessIdentityIntelligenceResult = {
  engineVersion: string;
  generatedAt: string;
  target: string;
  confidence: number;
  findings: BusinessIdentityFinding[];
  evidenceCoverage: {
    totalEvidence: number;
    coveredEntityTypes: BusinessIdentityEntityType[];
    providerCount: number;
  };
  validationNotice: string;
};
