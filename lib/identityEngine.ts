import type { InsightEngineOutput, TrustInsight } from "./insightEngine";
import type { ProviderResult } from "./providers/types";

export const IDENTITY_ENGINE_VERSION = "business-identity-resolver-v1";

export type BusinessIdentityStatus = "Detected" | "Likely" | "Not Found" | "Insufficient Public Evidence";
export type IdentityConfidence = "High" | "Medium" | "Low";
export type IdentityFieldName = "Business Name" | "Country" | "Industry" | "Business Type" | "Known Domains" | "Known Emails" | "Known Phones" | "Marketplace Presence" | "Social Presence";
export type IdentityEvidenceSource = "Input" | "Website title" | "Meta tags" | "Structured data" | "Public business profile" | "Registry" | "Marketplace" | "DNS" | "WHOIS" | "Email infrastructure" | "Phone pattern" | "Deterministic pattern";

export type IdentityField = {
  value: string;
  confidence: BusinessIdentityStatus;
  evidenceSource: IdentityEvidenceSource[];
  evidence: string[];
  lastVerified: string;
};

export type EvidenceConfidenceMatrixRow = {
  field: IdentityFieldName;
  value: string;
  confidence: BusinessIdentityStatus;
  detectedFrom: IdentityEvidenceSource[];
  evidence: string[];
  lastVerified: string;
};

export type BusinessIdentity = {
  businessName: IdentityField;
  country: IdentityField;
  industry: IdentityField;
  businessType: IdentityField;
  knownDomains: IdentityField;
  knownEmails: IdentityField;
  knownPhones: IdentityField;
  marketplacePresence: IdentityField;
  socialPresence: IdentityField;
  confidence: IdentityConfidence;
  evidenceCoverage: { found: number; total: number; label: string };
  evidenceConfidenceMatrix: EvidenceConfidenceMatrixRow[];
};

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
  businessIdentity: BusinessIdentity;
};

type IdentityEngineInput = {
  providerResults?: ProviderResult[];
  insights?: TrustInsight[] | InsightEngineOutput;
  target?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  marketplaceSeller?: string;
  generatedAt?: string;
};

const COUNTRY_TLDS: Record<string, string> = { il: "Israel", gov: "United States", edu: "United States", uk: "United Kingdom", ca: "Canada", au: "Australia", de: "Germany", fr: "France", in: "India", jp: "Japan", br: "Brazil" };
const MARKETPLACES = ["amazon", "ebay", "etsy", "walmart", "shopify", "tiktok", "mercari", "aliexpress"];
const SOCIAL_DOMAINS = ["facebook.com", "instagram.com", "linkedin.com", "x.com", "twitter.com", "youtube.com", "tiktok.com"];

function provider(providerResults: ProviderResult[], id: string) {
  return providerResults.find((result) => result.providerId === id);
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeDomain(input?: string) {
  const value = clean(input);
  if (!value || value.includes("@") || /^\+?[0-9][0-9 .()\-]{6,}$/.test(value)) return undefined;
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return value.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase();
  }
}

function records(result: ProviderResult | undefined, type: string) {
  const raw = result?.metadata.records;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const value = (raw as Record<string, unknown>)[type];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function metadataString(result: ProviderResult | undefined, keys: string[]) {
  if (!result) return undefined;
  for (const key of keys) {
    const value = clean(result.metadata[key]);
    if (value) return value;
  }
  return undefined;
}

function titleCaseFromDomain(domain?: string) {
  if (!domain) return undefined;
  const stem = domain.split(".")[0]?.replace(/[-_]+/g, " ");
  if (!stem || stem.length < 2) return undefined;
  return stem.split(" ").map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part).join(" ");
}

function field(value: string | undefined, confidence: BusinessIdentityStatus, evidenceSource: IdentityEvidenceSource[], evidence: string[], lastVerified: string): IdentityField {
  return { value: value || (confidence === "Not Found" ? "Not Found" : "Insufficient Public Evidence"), confidence, evidenceSource, evidence, lastVerified };
}

function publicEvidence(result: ProviderResult | undefined) {
  if (!result || result.status !== "completed") return [];
  return result.evidence.filter((item) => item.type !== "placeholder" && clean(item.value) && item.value?.toLowerCase() !== "unavailable").map((item) => `${item.label}: ${item.value}`);
}

function inferIndustry(domain?: string, businessName?: string, marketplaceSeller?: string) {
  const text = `${domain || ""} ${businessName || ""} ${marketplaceSeller || ""}`.toLowerCase();
  if (/bank|capital|credit|finance|pay/.test(text)) return "Financial Services";
  if (/edu|university|college|school/.test(text)) return "Education";
  if (/gov|agency|ministry|municipal/.test(text)) return "Government";
  if (/cell|mobile|phone|device|electronics/.test(text)) return "Mobile Devices";
  if (/shop|store|seller|market|deals/.test(text)) return "Retail / Marketplace";
  if (/health|clinic|medical/.test(text)) return "Healthcare";
  return undefined;
}

function inferBusinessType(domain?: string, marketplaceSeller?: string, businessName?: string) {
  const text = `${domain || ""} ${marketplaceSeller || ""} ${businessName || ""}`.toLowerCase();
  if (marketplaceSeller || MARKETPLACES.some((item) => text.includes(item))) return "Marketplace seller";
  if (domain?.endsWith(".gov")) return "Government organization";
  if (domain?.endsWith(".edu")) return "University / education";
  if (/bank|credit union/.test(text)) return "Bank / financial institution";
  if (domain) return "Online business";
  return undefined;
}

export function buildIdentityProfile(input: IdentityEngineInput): IdentityProfile {
  const providerResults = input.providerResults || [];
  const generatedAt = input.generatedAt || new Date().toISOString();
  const dns = provider(providerResults, "dns");
  const whois = provider(providerResults, "whois");
  const businessProfile = provider(providerResults, "business-profile");
  const marketplace = provider(providerResults, "marketplace");
  const domain = normalizeDomain(input.target) || normalizeDomain(input.email?.split("@")[1]);
  const email = clean(input.email) || metadataString(businessProfile, ["email", "contactEmail"]) || metadataString(marketplace, ["email", "contactEmail"]);
  const name = clean(input.businessName) || metadataString(businessProfile, ["businessName", "name", "legalName"]) || metadataString(marketplace, ["businessName", "sellerName", "storeName"]) || titleCaseFromDomain(domain);
  const mx = records(dns, "MX");
  const txt = records(dns, "TXT");
  const hasOwnership = whois?.status === "completed" && (typeof whois.metadata.registrationDate === "string" || typeof whois.metadata.ageDays === "number");
  const hasEmail = Boolean(email) || mx.length > 0;
  const hasEmailAuth = txt.some((record) => /v=spf1|v=dmarc1/i.test(record));
  const businessEvidence = [...publicEvidence(businessProfile), ...publicEvidence(marketplace)];
  const country = metadataString(businessProfile, ["country", "countryCode"]) || metadataString(whois, ["country", "registrantCountry"]) || (domain ? COUNTRY_TLDS[domain.split(".").pop() || ""] : undefined);
  const marketplaceValue = input.marketplaceSeller || metadataString(marketplace, ["sellerName", "storeName", "marketplace"]);
  const socialEvidence = providerResults.flatMap((result) => result.evidence).filter((item) => item.type !== "search_result" && SOCIAL_DOMAINS.some((social) => `${item.value || ""} ${item.source}`.toLowerCase().includes(social))).map((item) => `${item.label}: ${item.value || item.source}`);
  const foundSignals = [name, country, domain, hasEmail, hasEmailAuth, hasOwnership, businessEvidence.length > 0, marketplaceValue, socialEvidence.length > 0].filter(Boolean).length;
  const confidence: IdentityConfidence = foundSignals >= 6 ? "High" : foundSignals >= 3 ? "Medium" : "Low";
  const status: BusinessIdentityStatus = foundSignals >= 6 ? "Detected" : foundSignals >= 3 ? "Likely" : foundSignals > 0 ? "Insufficient Public Evidence" : "Not Found";
  const knownDomains = field(domain, domain ? "Detected" : "Not Found", domain ? ["Input", "DNS"] : [], domain ? [`Domain resolved as ${domain}`] : [], generatedAt);
  const fields: Record<IdentityFieldName, IdentityField> = {
    "Business Name": field(name, name ? (businessEvidence.length || input.businessName ? "Detected" : "Likely") : "Insufficient Public Evidence", name ? [input.businessName ? "Input" : "Deterministic pattern", ...(businessEvidence.length ? ["Public business profile" as const] : [])] : [], name ? [`Business name resolved as ${name}`] : [], generatedAt),
    Country: field(country, country ? "Likely" : "Insufficient Public Evidence", country ? ["WHOIS", "Registry", "Deterministic pattern"] : [], country ? [`Country resolved as ${country}`] : [], generatedAt),
    Industry: field(inferIndustry(domain, name, marketplaceValue), inferIndustry(domain, name, marketplaceValue) ? "Likely" : "Insufficient Public Evidence", inferIndustry(domain, name, marketplaceValue) ? ["Deterministic pattern"] : [], inferIndustry(domain, name, marketplaceValue) ? ["Industry inferred from public identifier patterns"] : [], generatedAt),
    "Business Type": field(inferBusinessType(domain, marketplaceValue, name), inferBusinessType(domain, marketplaceValue, name) ? "Likely" : "Insufficient Public Evidence", inferBusinessType(domain, marketplaceValue, name) ? ["Deterministic pattern", ...(marketplaceValue ? ["Marketplace" as const] : [])] : [], inferBusinessType(domain, marketplaceValue, name) ? ["Business type inferred from input and domain patterns"] : [], generatedAt),
    "Known Domains": knownDomains,
    "Known Emails": field(email, hasEmail ? "Detected" : "Not Found", hasEmail ? [email ? "Input" : "Email infrastructure"] : [], [email ? `Email provided: ${email}` : undefined, mx.length ? `MX records detected: ${mx.join(", ")}` : undefined, hasEmailAuth ? "SPF or DMARC records detected" : undefined].filter((item): item is string => Boolean(item)), generatedAt),
    "Known Phones": field(clean(input.phone), input.phone ? "Detected" : "Not Found", input.phone ? ["Input", "Phone pattern"] : [], input.phone ? [`Phone provided: ${input.phone}`] : [], generatedAt),
    "Marketplace Presence": field(marketplaceValue, marketplaceValue ? "Detected" : "Not Found", marketplaceValue ? ["Marketplace", "Input"] : [], marketplaceValue ? [`Marketplace seller resolved as ${marketplaceValue}`] : [], generatedAt),
    "Social Presence": field(socialEvidence.join(", "), socialEvidence.length ? "Detected" : "Not Found", socialEvidence.length ? ["Public business profile"] : [], socialEvidence, generatedAt),
  };
  const matrix = (Object.entries(fields) as Array<[IdentityFieldName, IdentityField]>).map(([fieldName, item]) => ({ field: fieldName, value: item.value, confidence: item.confidence, detectedFrom: item.evidenceSource, evidence: item.evidence, lastVerified: item.lastVerified }));
  const coverageFound = matrix.filter((row) => row.confidence === "Detected" || row.confidence === "Likely").length + (hasOwnership ? 1 : 0) + (businessEvidence.length ? 1 : 0);
  const identitySummary = `${fields["Business Name"].value} appears to operate ${domain ? `${domain} ` : ""}with ${hasEmail ? "professional business email infrastructure" : "limited public email evidence"}. Additional public ownership evidence is recommended before relying on the profile for high-value transactions.`;

  return {
    engineVersion: IDENTITY_ENGINE_VERSION,
    generatedAt,
    businessIdentityStatus: status,
    domainOwnershipVisibility: hasOwnership ? "Detected from WHOIS/RDAP registration context." : "Insufficient Public Evidence",
    businessEmailPresence: hasEmail ? "Detected" : "Not Found",
    publicBusinessInformation: businessEvidence.length ? "Detected" : status,
    identityConfidence: confidence,
    identitySummary,
    evidence: matrix.flatMap((row) => row.evidence),
    businessIdentity: {
      businessName: fields["Business Name"], country: fields.Country, industry: fields.Industry, businessType: fields["Business Type"], knownDomains: fields["Known Domains"], knownEmails: fields["Known Emails"], knownPhones: fields["Known Phones"], marketplacePresence: fields["Marketplace Presence"], socialPresence: fields["Social Presence"], confidence,
      evidenceCoverage: { found: Math.min(coverageFound, 11), total: 11, label: `${Math.min(coverageFound, 11)} of 11 sources` },
      evidenceConfidenceMatrix: matrix,
    },
  };
}
