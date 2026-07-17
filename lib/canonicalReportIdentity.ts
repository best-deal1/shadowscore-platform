import type { BusinessProfile } from "./businessProfileEngine";
import type { IdentityProfile, IdentityFieldName, BusinessIdentityStatus } from "./identityEngine";

type CanonicalIdentity = {
  canonicalDisplayName?: string;
  brandName?: string;
  legalName?: string;
  companyType?: string;
  country?: string;
  parentOrganization?: string;
  primaryDomain?: string;
  identityStatus?: string;
  identityConfidence?: { label?: string; score?: number };
};

function resolved(canonical?: CanonicalIdentity) {
  return Boolean(canonical?.canonicalDisplayName && canonical.canonicalDisplayName !== "Unknown" && canonical.identityStatus !== "UNRESOLVED");
}

export function displayCompanyType(canonical?: CanonicalIdentity, fallback = "Online business") {
  if (!resolved(canonical)) return fallback;
  if (canonical?.companyType === "PUBLIC_COMPANY") return "Public company";
  if (canonical?.companyType === "BANK" || canonical?.companyType === "REGULATED_FINANCIAL_INSTITUTION") return "Regulated bank";
  if (canonical?.companyType === "PRIVATE_COMPANY") return "Private company";
  return "Online business";
}

function canonicalConfidence(canonical?: CanonicalIdentity, fallback: "High" | "Medium" | "Low" = "Low") {
  return canonical?.identityConfidence?.label === "High" ? "High" : canonical?.identityConfidence?.label === "Medium" ? "Medium" : fallback;
}

function stripResolvedIdentityFallbacks(items: string[], canonical?: CanonicalIdentity) {
  if (!resolved(canonical)) return items;
  return items.filter((item) => !/business name evidence is missing|business profile title missing|public business identity evidence was not found|domain is active, but public business identity evidence was not found|public business profile evidence is missing/i.test(item));
}

export function applyCanonicalIdentityToBusinessProfile(profile: BusinessProfile, canonical?: CanonicalIdentity): BusinessProfile {
  if (!resolved(canonical)) return profile;
  const businessName = canonical?.canonicalDisplayName || profile.businessName;
  const primaryDomain = canonical?.primaryDomain || profile.primaryDomain;
  const businessType = displayCompanyType(canonical, profile.businessType) as BusinessProfile["businessType"];
  const country = canonical?.country || profile.country;
  const identityConfidence = canonicalConfidence(canonical, profile.identityConfidence);
  return {
    ...profile,
    businessName,
    primaryDomain,
    businessType,
    country,
    identityConfidence,
    missingEvidence: stripResolvedIdentityFallbacks(profile.missingEvidence, canonical),
    warningSignals: stripResolvedIdentityFallbacks(profile.warningSignals, canonical),
    trustSignals: Array.from(new Set([
      `${businessName} is the canonical identity used by all report sections.`,
      canonical?.legalName ? `Legal entity: ${canonical.legalName}.` : undefined,
      canonical?.parentOrganization ? `Parent company: ${canonical.parentOrganization}.` : undefined,
      primaryDomain ? `Primary domain: ${primaryDomain}.` : undefined,
      ...profile.trustSignals,
    ].filter((item): item is string => Boolean(item)))),
  };
}

function field(value: string, generatedAt: string, evidence: string[]) {
  return { value, confidence: "Detected" as BusinessIdentityStatus, evidenceSource: ["Registry" as const], evidence, lastVerified: generatedAt };
}

export function applyCanonicalIdentityToIdentityProfile(profile: IdentityProfile, canonical?: CanonicalIdentity): IdentityProfile {
  if (!resolved(canonical)) return profile;
  const generatedAt = profile.generatedAt;
  const businessName = canonical?.canonicalDisplayName || profile.businessIdentity.businessName.value;
  const country = canonical?.country || profile.businessIdentity.country.value;
  const businessType = displayCompanyType(canonical, profile.businessIdentity.businessType.value);
  const domain = canonical?.primaryDomain || profile.businessIdentity.knownDomains.value;
  const evidence = [
    `Canonical brand: ${businessName}`,
    canonical?.legalName ? `Canonical legal entity: ${canonical.legalName}` : undefined,
    `Canonical company type: ${businessType}`,
    country ? `Canonical country: ${country}` : undefined,
    canonical?.parentOrganization ? `Canonical parent company: ${canonical.parentOrganization}` : undefined,
    domain ? `Canonical primary domain: ${domain}` : undefined,
  ].filter((item): item is string => Boolean(item));
  const updates: Partial<Record<IdentityFieldName, string>> = { "Business Name": businessName, Country: country, "Business Type": businessType, "Known Domains": domain };
  const matrix = profile.businessIdentity.evidenceConfidenceMatrix.map((row) => updates[row.field] ? { ...row, value: updates[row.field]!, confidence: "Detected" as BusinessIdentityStatus, detectedFrom: ["Registry" as const], evidence, lastVerified: generatedAt } : row);
  return {
    ...profile,
    businessIdentityStatus: "Detected",
    publicBusinessInformation: "Detected",
    identityConfidence: canonicalConfidence(canonical, profile.identityConfidence),
    identitySummary: `${businessName} is the canonical identity for this report${domain ? ` and is associated with ${domain}` : ""}.`,
    evidence: Array.from(new Set([...evidence, ...profile.evidence])),
    businessIdentity: {
      ...profile.businessIdentity,
      businessName: field(businessName, generatedAt, evidence),
      country: field(country, generatedAt, evidence),
      businessType: field(businessType, generatedAt, evidence),
      knownDomains: field(domain, generatedAt, evidence),
      confidence: canonicalConfidence(canonical, profile.businessIdentity.confidence),
      evidenceConfidenceMatrix: matrix,
    },
  };
}
