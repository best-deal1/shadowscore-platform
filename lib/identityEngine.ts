import type { InsightEngineOutput, TrustInsight } from "./insightEngine";
import type { ProviderResult } from "./providers/types";

export const IDENTITY_ENGINE_VERSION = "identity-engine-v1";

export type BusinessIdentityStatus = "Verified" | "Partial" | "Unknown";
export type IdentityConfidence = "High" | "Medium" | "Low";

export type IdentityProfile = {
  engineVersion: string;
  generatedAt: string;
  businessIdentityStatus: BusinessIdentityStatus;
  domainOwnershipVisibility: string;
  businessEmailPresence: string;
  publicBusinessInformation: string;
  identityConfidence: IdentityConfidence;
  identitySummary: string;
  evidence: string[];
};

type IdentityEngineInput = {
  providerResults?: ProviderResult[];
  insights?: TrustInsight[] | InsightEngineOutput;
};

function provider(providerResults: ProviderResult[], id: string) {
  return providerResults.find((result) => result.providerId === id);
}

function records(result: ProviderResult | undefined, type: string) {
  const raw = result?.metadata.records;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const value = (raw as Record<string, unknown>)[type];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function insightList(insights?: TrustInsight[] | InsightEngineOutput) {
  if (!insights) return [];
  return Array.isArray(insights) ? insights : insights.insights;
}

function hasPublicBusinessProviderEvidence(result: ProviderResult | undefined) {
  if (!result || result.status !== "completed") return false;
  const connected = result.metadata.integrationStatus !== "not_connected" && result.metadata.lookupPerformed !== false;
  return connected && result.evidence.some((item) => item.type !== "placeholder" && item.value && item.value.toLowerCase() !== "unavailable");
}

export function buildIdentityProfile(input: IdentityEngineInput): IdentityProfile {
  const providerResults = input.providerResults || [];
  const insights = insightList(input.insights);
  const dns = provider(providerResults, "dns");
  const whois = provider(providerResults, "whois");
  const businessProfile = provider(providerResults, "business-profile");
  const marketplace = provider(providerResults, "marketplace");
  const mx = records(dns, "MX");
  const txt = records(dns, "TXT");
  const hasOwnership = whois?.status === "completed" && (typeof whois.metadata.registrationDate === "string" || typeof whois.metadata.ageDays === "number" || recordsFromStatuses(whois).length > 0);
  const hasBusinessEmail = dns?.status === "completed" && mx.length > 0;
  const hasEmailAuth = txt.some((record) => record.toLowerCase().includes("v=spf1") || record.toLowerCase().includes("v=dmarc1"));
  const hasBusinessInfo = hasPublicBusinessProviderEvidence(businessProfile) || hasPublicBusinessProviderEvidence(marketplace);
  const identityInsight = insights.find((insight) => insight.category === "Identity Insight");

  const businessIdentityStatus: BusinessIdentityStatus = hasOwnership && hasBusinessEmail && hasBusinessInfo
    ? "Verified"
    : hasOwnership || hasBusinessEmail || hasBusinessInfo || Boolean(identityInsight?.evidence.length)
      ? "Partial"
      : "Unknown";
  const identityConfidence: IdentityConfidence = businessIdentityStatus === "Verified" && hasEmailAuth
    ? "High"
    : businessIdentityStatus === "Verified" || (businessIdentityStatus === "Partial" && [hasOwnership, hasBusinessEmail, hasBusinessInfo].filter(Boolean).length >= 2)
      ? "Medium"
      : "Low";
  const domainOwnershipVisibility = hasOwnership ? "Ownership information publicly available." : "Ownership information unavailable.";
  const businessEmailPresence = hasBusinessEmail ? "Professional email infrastructure detected." : dns?.status === "completed" ? "No business email infrastructure detected." : "Unknown";
  const publicBusinessInformation = hasBusinessInfo ? "Public business information detected in provider evidence." : "Unknown";
  const evidence = [
    hasOwnership ? "WHOIS/RDAP ownership or registration context is available." : undefined,
    hasBusinessEmail ? "DNS MX records are available." : undefined,
    hasEmailAuth ? "DNS email authentication records are available." : undefined,
    hasBusinessInfo ? "Business profile or marketplace provider evidence is available." : undefined,
    ...(identityInsight?.evidence || []),
  ].filter((item): item is string => Boolean(item));
  const identitySummary = businessIdentityStatus === "Unknown"
    ? "Business identity could not be verified from the available provider evidence. Domain ownership, business email, and public business information remain Unknown unless provider evidence exists."
    : `Business identity is ${businessIdentityStatus.toLowerCase()} based on available provider evidence. ${domainOwnershipVisibility} ${businessEmailPresence} Public business information: ${publicBusinessInformation}`;

  return {
    engineVersion: IDENTITY_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    businessIdentityStatus,
    domainOwnershipVisibility,
    businessEmailPresence,
    publicBusinessInformation,
    identityConfidence,
    identitySummary,
    evidence,
  };
}

function recordsFromStatuses(result: ProviderResult | undefined) {
  const statuses = result?.metadata.statuses;
  return Array.isArray(statuses) ? statuses.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}
