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
  recommendationImpact?: string;
  resolutionImpact?: string;
};

export type HistoricalBusinessEvent = {
  id: string;
  category: "bankruptcy" | "criminal_proceeding" | "fraud" | "dissolution" | "regulatory_action";
  summary: string;
  occurredAt?: string;
  severity: "material" | "high" | "medium";
  source: string;
};

export type BusinessTrustProfile = {
  company: string;
  legalEntity?: string;
  parentCompany?: string;
  companyType: "public" | "private" | "unknown";
  country?: string;
  industry?: string;
  marketplacePresence?: string;
  yearsActive?: number;
  identityBasis: "canonical_resolution" | "known_business_profile" | "collected_evidence" | "unresolved";
};

export type BusinessIdentityIntelligenceInput = {
  target?: string;
  claimedBusinessName?: string;
  providerResults?: ProviderResult[];
  canonicalIdentity?: { canonicalDisplayName?: string; legalName?: string; parentOrganization?: string; companyType?: string; country?: string; identityStatus?: string };
  generatedAt?: string;
};

export type BusinessIdentityIntelligenceResult = {
  engineVersion: string;
  generatedAt: string;
  target: string;
  confidence: number;
  businessProfile: BusinessTrustProfile;
  historicalEvents: HistoricalBusinessEvent[];
  recommendationSignal: "proceed" | "verify" | "do_not_proceed" | "unknown";
  executiveSummary: string;
  findings: BusinessIdentityFinding[];
  evidenceCoverage: {
    totalEvidence: number;
    coveredEntityTypes: BusinessIdentityEntityType[];
    providerCount: number;
  };
  validationNotice: string;
};
