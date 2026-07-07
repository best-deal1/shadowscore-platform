import type { ProviderResult } from "../providers/types";

export type BusinessProfileConfidence = "High" | "Medium" | "Low";
export type BusinessProfileCoverage = "Complete" | "Partial" | "Limited";
export type BusinessType = "Marketplace seller" | "Online business" | "Service business" | "Unknown";

export type BusinessProfileEngineInput = {
  providerResults?: ProviderResult[];
  target?: string;
  generatedAt?: string;
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
  recommendedNextStep: string;
};

export type BusinessProfileEvidenceSnapshot = {
  completedProviderCount: number;
  attemptedProviderCount: number;
  domain: string;
  businessName?: string;
  country?: string;
  hasDomainInfrastructure: boolean;
  hasNameServerRecords: boolean;
  hasBusinessEmail: boolean;
  hasEmailAuthentication: boolean;
  hasDomainRegistrationContext: boolean;
  hasPublicBusinessEvidence: boolean;
  hasProviderFailures: boolean;
  placeholderOnlyProviders: string[];
};
