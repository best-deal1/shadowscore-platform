import type { ProviderResult } from "../providers/types";
import type { BusinessProfile, BusinessProfileConfidence, BusinessProfileCoverage, BusinessProfileEngineInput, BusinessProfileEvidenceSnapshot, BusinessType } from "./types";

export type { BusinessProfile, BusinessProfileConfidence, BusinessProfileCoverage, BusinessProfileEngineInput, BusinessProfileEvidenceSnapshot, BusinessType } from "./types";

export const BUSINESS_PROFILE_ENGINE_VERSION = "business-profile-engine-v40";

function provider(providerResults: ProviderResult[], id: string) {
  return providerResults.find((result) => result.providerId === id);
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function metadataString(result: ProviderResult | undefined, keys: string[]) {
  if (!result) return undefined;
  for (const key of keys) {
    const value = clean(result.metadata[key]);
    if (value) return value;
  }
  return undefined;
}

function records(result: ProviderResult | undefined, type: string) {
  const raw = result?.metadata.records;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const value = (raw as Record<string, unknown>)[type];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function normalizeDomain(input?: string) {
  const value = clean(input);
  if (!value) return "Unknown";

  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return value.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase() || "Unknown";
  }
}

function hasNonPlaceholderEvidence(result: ProviderResult | undefined) {
  if (!result || result.status !== "completed") return false;
  return result.evidence.some((item) => item.type !== "placeholder" && clean(item.value) && item.value?.toLowerCase() !== "unavailable");
}

function isPlaceholderOnly(result: ProviderResult) {
  return result.evidence.length > 0 && result.evidence.every((item) => item.type === "placeholder");
}

export function buildBusinessProfileEvidenceSnapshot(input: BusinessProfileEngineInput): BusinessProfileEvidenceSnapshot {
  const providerResults = input.providerResults || [];
  const dns = provider(providerResults, "dns");
  const whois = provider(providerResults, "whois");
  const businessProfile = provider(providerResults, "business-profile");
  const marketplace = provider(providerResults, "marketplace");
  const a = records(dns, "A");
  const aaaa = records(dns, "AAAA");
  const ns = records(dns, "NS");
  const mx = records(dns, "MX");
  const txt = records(dns, "TXT");
  const statuses = Array.isArray(whois?.metadata.statuses) ? whois.metadata.statuses : [];

  return {
    completedProviderCount: providerResults.filter((result) => result.status === "completed").length,
    attemptedProviderCount: providerResults.length,
    domain: normalizeDomain(input.target || metadataString(dns, ["domain", "target", "hostname"]) || metadataString(whois, ["domain", "target", "hostname"])),
    businessName: metadataString(businessProfile, ["businessName", "name", "legalName"]) || metadataString(marketplace, ["businessName", "sellerName", "storeName"]),
    country: metadataString(businessProfile, ["country", "countryCode"]) || metadataString(whois, ["country", "registrantCountry"]),
    hasDomainInfrastructure: dns?.status === "completed" && (a.length > 0 || aaaa.length > 0 || ns.length > 0),
    hasNameServerRecords: dns?.status === "completed" && ns.length > 0,
    hasBusinessEmail: dns?.status === "completed" && mx.length > 0,
    hasEmailAuthentication: txt.some((record) => {
      const lower = record.toLowerCase();
      return lower.includes("v=spf1") || lower.includes("v=dmarc1");
    }),
    hasDomainRegistrationContext: whois?.status === "completed" && (typeof whois.metadata.registrationDate === "string" || typeof whois.metadata.ageDays === "number" || statuses.length > 0),
    hasPublicBusinessEvidence: hasNonPlaceholderEvidence(businessProfile) || hasNonPlaceholderEvidence(marketplace),
    hasProviderFailures: providerResults.some((result) => result.status === "failed"),
    placeholderOnlyProviders: providerResults.filter(isPlaceholderOnly).map((result) => result.providerId),
  };
}

function confidence(positiveSignals: number, availableSignals: number): BusinessProfileConfidence {
  if (availableSignals <= 0 || positiveSignals <= 0) return "Low";
  if (positiveSignals >= 2 && positiveSignals >= availableSignals - 1) return "High";
  if (positiveSignals >= 1) return "Medium";
  return "Low";
}

function coverage(snapshot: BusinessProfileEvidenceSnapshot): BusinessProfileCoverage {
  const signalCount = [snapshot.hasDomainInfrastructure, snapshot.hasDomainRegistrationContext, snapshot.hasBusinessEmail, snapshot.hasEmailAuthentication, snapshot.hasPublicBusinessEvidence].filter(Boolean).length;
  if (snapshot.completedProviderCount >= 4 && signalCount >= 4) return "Complete";
  if (snapshot.completedProviderCount >= 2 || signalCount >= 2) return "Partial";
  return "Limited";
}

function businessType(snapshot: BusinessProfileEvidenceSnapshot): BusinessType {
  if (snapshot.hasPublicBusinessEvidence) return "Online business";
  if (snapshot.hasBusinessEmail || snapshot.hasDomainInfrastructure) return "Online business";
  return "Unknown";
}

function unique(items: Array<string | undefined>) {
  return Array.from(new Set(items.filter((item): item is string => Boolean(item))));
}

export function buildBusinessProfile(input: BusinessProfileEngineInput): BusinessProfile {
  const snapshot = buildBusinessProfileEvidenceSnapshot(input);
  const identityConfidence = confidence([snapshot.hasDomainRegistrationContext, snapshot.hasPublicBusinessEvidence, Boolean(snapshot.businessName)].filter(Boolean).length, 3);
  const infrastructureConfidence = confidence([snapshot.hasDomainInfrastructure, snapshot.hasNameServerRecords].filter(Boolean).length, 2);
  const emailConfidence = confidence([snapshot.hasBusinessEmail, snapshot.hasEmailAuthentication].filter(Boolean).length, 2);
  const investigationCoverage = coverage(snapshot);
  const trustSignals = unique([
    snapshot.hasDomainInfrastructure ? "Domain infrastructure is visible in DNS evidence." : undefined,
    snapshot.hasNameServerRecords ? "Name server records are present." : undefined,
    snapshot.hasBusinessEmail ? "Business email routing is configured." : undefined,
    snapshot.hasEmailAuthentication ? "Email authentication evidence is present." : undefined,
    snapshot.hasDomainRegistrationContext ? "Domain registration context is available." : undefined,
    snapshot.hasPublicBusinessEvidence ? "Public business evidence is available." : undefined,
  ]);
  const warningSignals = unique([
    snapshot.hasProviderFailures ? "One or more providers failed during investigation." : undefined,
    snapshot.placeholderOnlyProviders.length > 0 ? `Placeholder-only evidence returned by: ${snapshot.placeholderOnlyProviders.join(", ")}.` : undefined,
    !snapshot.hasDomainInfrastructure ? "Domain infrastructure was not confirmed from provider evidence." : undefined,
    !snapshot.hasBusinessEmail ? "Business email routing was not confirmed from provider evidence." : undefined,
  ]);
  const missingEvidence = unique([
    snapshot.businessName ? undefined : "Business name evidence is missing.",
    snapshot.country ? undefined : "Business country evidence is missing.",
    snapshot.hasDomainRegistrationContext ? undefined : "Domain registration or ownership context is missing.",
    snapshot.hasPublicBusinessEvidence ? undefined : "Public business profile evidence is missing.",
    snapshot.hasEmailAuthentication ? undefined : "Email authentication evidence is missing.",
  ]);

  const investigationSummary = investigationCoverage === "Complete"
    ? "Provider evidence gives a broad business profile with identity, infrastructure and email signals available."
    : investigationCoverage === "Partial"
      ? "Provider evidence gives a partial business profile; some business-readable facts are available, but important evidence is still missing."
      : "Provider evidence is limited, so the business profile should be treated as an initial evidence summary rather than a verification result.";

  const recommendedNextStep = missingEvidence.length === 0 && warningSignals.length === 0
    ? "Proceed with normal business verification and keep source evidence documented."
    : "Collect the missing business identity, domain control and email authentication evidence before relying on this profile for high-value decisions.";

  return {
    engineVersion: BUSINESS_PROFILE_ENGINE_VERSION,
    generatedAt: input.generatedAt || "Unknown",
    businessName: snapshot.businessName || "Unknown",
    primaryDomain: snapshot.domain,
    businessType: businessType(snapshot),
    country: snapshot.country || "Unknown",
    identityConfidence,
    infrastructureConfidence,
    emailConfidence,
    investigationCoverage,
    investigationSummary,
    trustSignals,
    warningSignals,
    missingEvidence,
    recommendedNextStep,
  };
}
