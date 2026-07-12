import type { ProviderResult } from "../providers/types";

export type BusinessProfileConfidence = "High" | "Medium" | "Low";
export type BusinessProfileCoverage = "Complete" | "Partial" | "Limited";
export type BusinessType = "Startup" | "Small business" | "Marketplace seller" | "Government" | "Regulated bank" | "Public company" | "Online business" | "Service business" | "Insufficient Public Evidence";

export type BusinessEvidenceType =
  | "government_registry"
  | "official_business_registry"
  | "marketplace_verification"
  | "business_website"
  | "whois"
  | "dns"
  | "ssl"
  | "email_authentication"
  | "provider_observation";

export type EvidenceReliability = "Very High" | "High" | "Medium" | "Low";
export type EvidenceFreshness = "Current" | "Recent" | "Stale" | "Insufficient Public Evidence";

export type BusinessProfileEngineInput = {
  providerResults?: ProviderResult[];
  target?: string;
  generatedAt?: string;
};

export type BusinessProfileEvidenceItem = {
  id: string;
  type: BusinessEvidenceType;
  label: string;
  value: string;
  source: string;
  reliability: EvidenceReliability;
  reliabilityWeight: number;
  confidence: BusinessProfileConfidence;
  freshness: EvidenceFreshness;
  observedAt?: string;
};

export type BusinessProfileContradictionSignal = {
  id: string;
  title: string;
  evidence: string[];
  interpretation: string;
  businessMeaning: string;
  severity: "low" | "medium" | "high";
};

export type BusinessProfileExplainabilityStep = {
  conclusion: string;
  evidence: string[];
  interpretation: string;
  businessMeaning: string;
};

export type BusinessProfile = {
  engineVersion: string;
  generatedAt: string;
  businessName: string;
  primaryDomain: string;
  businessType: BusinessType;
  country: string;
  identityConfidence: BusinessProfileConfidence;
  infrastructureConfidence: BusinessProfileConfidence;
  emailConfidence: BusinessProfileConfidence;
  investigationCoverage: BusinessProfileCoverage;
  investigationSummary: string;
  trustSignals: string[];
  warningSignals: string[];
  missingEvidence: string[];
  contradictionSignals: BusinessProfileContradictionSignal[];
  evidenceItems: BusinessProfileEvidenceItem[];
  explainabilityChain: BusinessProfileExplainabilityStep[];
  recommendedNextStep: string;
};

export type BusinessProfileEvidenceSnapshot = {
  completedProviderCount: number;
  attemptedProviderCount: number;
  domain: string;
  businessName?: string;
  country?: string;
  contactEmail?: string;
  hasDomainInfrastructure: boolean;
  hasNameServerRecords: boolean;
  hasBusinessEmail: boolean;
  hasEmailAuthentication: boolean;
  hasDomainRegistrationContext: boolean;
  hasPublicBusinessEvidence: boolean;
  hasProviderFailures: boolean;
  placeholderOnlyProviders: string[];
  evidenceItems: BusinessProfileEvidenceItem[];
};
