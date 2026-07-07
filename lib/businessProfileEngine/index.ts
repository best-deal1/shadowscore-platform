import type { ProviderEvidence, ProviderResult } from "../providers/types";
import type {
  BusinessEvidenceType,
  BusinessProfile,
  BusinessProfileConfidence,
  BusinessProfileContradictionSignal,
  BusinessProfileCoverage,
  BusinessProfileEngineInput,
  BusinessProfileEvidenceItem,
  BusinessProfileEvidenceSnapshot,
  BusinessProfileExplainabilityStep,
  BusinessType,
  EvidenceFreshness,
  EvidenceReliability,
} from "./types";

export type {
  BusinessEvidenceType,
  BusinessProfile,
  BusinessProfileConfidence,
  BusinessProfileContradictionSignal,
  BusinessProfileCoverage,
  BusinessProfileEngineInput,
  BusinessProfileEvidenceItem,
  BusinessProfileEvidenceSnapshot,
  BusinessProfileExplainabilityStep,
  BusinessType,
  EvidenceFreshness,
  EvidenceReliability,
} from "./types";

export const BUSINESS_PROFILE_ENGINE_VERSION = "business-profile-engine-v41";

const EVIDENCE_RELIABILITY: Record<BusinessEvidenceType, { reliability: EvidenceReliability; weight: number }> = {
  government_registry: { reliability: "Very High", weight: 0.98 },
  official_business_registry: { reliability: "Very High", weight: 0.95 },
  marketplace_verification: { reliability: "High", weight: 0.82 },
  business_website: { reliability: "Medium", weight: 0.66 },
  whois: { reliability: "Medium", weight: 0.58 },
  dns: { reliability: "Medium", weight: 0.55 },
  ssl: { reliability: "Medium", weight: 0.52 },
  email_authentication: { reliability: "High", weight: 0.78 },
  provider_observation: { reliability: "Low", weight: 0.35 },
};

const CONSUMER_EMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "icloud.com", "aol.com", "proton.me", "protonmail.com"]);

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

function evidenceTypeFor(providerId: string, evidence?: ProviderEvidence): BusinessEvidenceType {
  const source = `${providerId} ${evidence?.source || ""} ${evidence?.label || ""}`.toLowerCase();
  if (source.includes("government")) return "government_registry";
  if (source.includes("registry") || providerId === "business-profile") return "official_business_registry";
  if (providerId === "marketplace" || source.includes("marketplace") || source.includes("seller")) return "marketplace_verification";
  if (source.includes("website") || source.includes("homepage")) return "business_website";
  if (providerId === "whois" || source.includes("whois")) return "whois";
  if (providerId === "dns" || source.includes("dns")) return "dns";
  if (providerId === "ssl" || source.includes("ssl") || source.includes("certificate")) return "ssl";
  if (providerId === "email-authentication" || providerId === "email_authentication" || source.includes("spf") || source.includes("dmarc")) return "email_authentication";
  return "provider_observation";
}

function confidenceFromWeight(weight: number, status: ProviderResult["status"]): BusinessProfileConfidence {
  if (status !== "completed") return "Low";
  if (weight >= 0.78) return "High";
  if (weight >= 0.52) return "Medium";
  return "Low";
}

function freshness(result: ProviderResult): EvidenceFreshness {
  const completed = Date.parse(result.completedAt);
  if (Number.isNaN(completed)) return "Unknown";
  const ageDays = (Date.now() - completed) / 86_400_000;
  if (ageDays <= 30) return "Current";
  if (ageDays <= 180) return "Recent";
  return "Stale";
}

function makeEvidenceItem(result: ProviderResult, evidence: ProviderEvidence): BusinessProfileEvidenceItem | undefined {
  const value = clean(evidence.value);
  if (!value || value.toLowerCase() === "unavailable") return undefined;
  const type = evidenceTypeFor(result.providerId, evidence);
  const model = EVIDENCE_RELIABILITY[type];
  return {
    id: `${result.providerId}:${evidence.id}`,
    type,
    label: evidence.label,
    value,
    source: evidence.source || result.providerId,
    reliability: model.reliability,
    reliabilityWeight: model.weight,
    confidence: confidenceFromWeight(model.weight, result.status),
    freshness: freshness(result),
    observedAt: result.completedAt,
  };
}

function buildEvidenceItems(providerResults: ProviderResult[]): BusinessProfileEvidenceItem[] {
  return providerResults.flatMap((result) => result.evidence.map((item) => makeEvidenceItem(result, item)).filter((item): item is BusinessProfileEvidenceItem => Boolean(item)));
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
    contactEmail: metadataString(businessProfile, ["email", "contactEmail"]) || metadataString(marketplace, ["email", "contactEmail"]),
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
    evidenceItems: buildEvidenceItems(providerResults),
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
  if (snapshot.evidenceItems.some((item) => item.type === "marketplace_verification")) return "Marketplace seller";
  if (snapshot.hasPublicBusinessEvidence) return "Online business";
  if (snapshot.hasBusinessEmail || snapshot.hasDomainInfrastructure) return "Online business";
  return "Unknown";
}

function unique(items: Array<string | undefined>) {
  return Array.from(new Set(items.filter((item): item is string => Boolean(item))));
}

function emailDomain(email?: string) {
  const [, domain] = (email || "").toLowerCase().split("@");
  return domain;
}

function detectContradictions(snapshot: BusinessProfileEvidenceSnapshot, providerResults: ProviderResult[]): BusinessProfileContradictionSignal[] {
  const providerNames = unique(providerResults.map((result) => metadataString(result, ["businessName", "name", "legalName", "sellerName", "storeName"])));
  const signals: BusinessProfileContradictionSignal[] = [];

  if (providerNames.length > 1) {
    signals.push({
      id: "conflicting-business-names",
      title: "Business claims conflict across provider evidence.",
      evidence: providerNames,
      interpretation: "Multiple provider sources expose different business names for the same target.",
      businessMeaning: "The profile needs manual reconciliation before the identity can be treated as consistent.",
      severity: "high",
    });
  }

  if (snapshot.hasPublicBusinessEvidence && Boolean(snapshot.businessName) && !snapshot.hasDomainRegistrationContext) {
    signals.push({
      id: "missing-ownership-high-confidence",
      title: "High identity confidence lacks ownership context.",
      evidence: ["Public business evidence exists", "Domain ownership or registration context is missing"],
      interpretation: "Business identity evidence is present, but domain ownership evidence is absent.",
      businessMeaning: "The business may be real while control of the investigated domain remains unproven.",
      severity: "medium",
    });
  }

  const contactDomain = emailDomain(snapshot.contactEmail);
  if (contactDomain && CONSUMER_EMAIL_DOMAINS.has(contactDomain)) {
    signals.push({
      id: "consumer-email-business-contact",
      title: "Consumer email is used as business contact.",
      evidence: [snapshot.contactEmail || "Consumer email contact"],
      interpretation: "The contact address uses a consumer mailbox instead of the investigated business domain.",
      businessMeaning: "This weakens business identity continuity and should be verified with domain-controlled contact evidence.",
      severity: "medium",
    });
  }

  if (snapshot.hasDomainInfrastructure && !snapshot.businessName && !snapshot.hasPublicBusinessEvidence) {
    signals.push({
      id: "active-domain-no-business-identity",
      title: "Domain is active but business identity is absent.",
      evidence: ["DNS infrastructure is active", "No business name or public business evidence was found"],
      interpretation: "The domain appears technically operational without matching business identity evidence.",
      businessMeaning: "The profile can describe infrastructure, but cannot attribute it to a business entity.",
      severity: "high",
    });
  }

  return signals;
}

function explainability(snapshot: BusinessProfileEvidenceSnapshot, conclusions: { identityConfidence: BusinessProfileConfidence; infrastructureConfidence: BusinessProfileConfidence; emailConfidence: BusinessProfileConfidence; investigationCoverage: BusinessProfileCoverage; businessType: BusinessType }): BusinessProfileExplainabilityStep[] {
  return [
    {
      conclusion: `Identity confidence is ${conclusions.identityConfidence}.`,
      evidence: unique([snapshot.businessName ? `Business name: ${snapshot.businessName}` : undefined, snapshot.country ? `Country: ${snapshot.country}` : undefined, snapshot.hasDomainRegistrationContext ? "Domain registration context is available" : undefined, snapshot.hasPublicBusinessEvidence ? "Public business evidence is available" : undefined]),
      interpretation: "Identity confidence is based on named business evidence, jurisdiction context, registry/domain context and public business evidence.",
      businessMeaning: "The profile states how strongly provider evidence connects the investigated target to a business identity without assigning a trust or risk score.",
    },
    {
      conclusion: `Infrastructure confidence is ${conclusions.infrastructureConfidence}.`,
      evidence: unique([snapshot.hasDomainInfrastructure ? "DNS address or name-server evidence is present" : undefined, snapshot.hasNameServerRecords ? "Name-server records are present" : undefined]),
      interpretation: "Infrastructure confidence reflects whether provider evidence shows an operational domain footprint.",
      businessMeaning: "Operational infrastructure supports reachability, but does not prove business ownership by itself.",
    },
    {
      conclusion: `Email confidence is ${conclusions.emailConfidence}.`,
      evidence: unique([snapshot.hasBusinessEmail ? "MX records are present" : undefined, snapshot.hasEmailAuthentication ? "SPF or DMARC evidence is present" : undefined, snapshot.contactEmail ? `Contact email: ${snapshot.contactEmail}` : undefined]),
      interpretation: "Email confidence combines routing and authentication evidence for domain-controlled communications.",
      businessMeaning: "Stronger email evidence helps establish that the business can receive and authenticate domain email.",
    },
    {
      conclusion: `Business type is ${conclusions.businessType}; investigation coverage is ${conclusions.investigationCoverage}.`,
      evidence: unique([`Completed providers: ${snapshot.completedProviderCount}/${snapshot.attemptedProviderCount}`, snapshot.hasPublicBusinessEvidence ? "Business or marketplace evidence is present" : undefined, snapshot.hasDomainInfrastructure ? "Domain infrastructure is present" : undefined]),
      interpretation: "Coverage measures breadth of completed evidence categories, while business type is inferred from marketplace, public profile and infrastructure signals.",
      businessMeaning: "This explains the practical business profile produced from evidence instead of a copyable trust-score formula.",
    },
  ];
}

export function buildBusinessProfile(input: BusinessProfileEngineInput): BusinessProfile {
  const snapshot = buildBusinessProfileEvidenceSnapshot(input);
  const identityConfidence = confidence([snapshot.hasDomainRegistrationContext, snapshot.hasPublicBusinessEvidence, Boolean(snapshot.businessName)].filter(Boolean).length, 3);
  const infrastructureConfidence = confidence([snapshot.hasDomainInfrastructure, snapshot.hasNameServerRecords].filter(Boolean).length, 2);
  const emailConfidence = confidence([snapshot.hasBusinessEmail, snapshot.hasEmailAuthentication].filter(Boolean).length, 2);
  const investigationCoverage = coverage(snapshot);
  const inferredBusinessType = businessType(snapshot);
  const contradictionSignals = detectContradictions(snapshot, input.providerResults || []);
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
    contradictionSignals.length > 0 ? `${contradictionSignals.length} contradiction signal(s) require review.` : undefined,
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
    businessType: inferredBusinessType,
    country: snapshot.country || "Unknown",
    identityConfidence,
    infrastructureConfidence,
    emailConfidence,
    investigationCoverage,
    investigationSummary,
    trustSignals,
    warningSignals,
    missingEvidence,
    contradictionSignals,
    evidenceItems: snapshot.evidenceItems,
    explainabilityChain: explainability(snapshot, { identityConfidence, infrastructureConfidence, emailConfidence, investigationCoverage, businessType: inferredBusinessType }),
    recommendedNextStep,
  };
}
