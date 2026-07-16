import type { ProviderEvidence, ProviderResult } from "../providers/types";
import type { BusinessIdentityEntityType, BusinessIdentityEvidence, BusinessIdentityFinding, BusinessIdentityIntelligenceInput, BusinessIdentityIntelligenceResult } from "./types";

export type { BusinessIdentityEntityType, BusinessIdentityEvidence, BusinessIdentityFinding, BusinessIdentityFindingCategory, BusinessIdentityIntelligenceInput, BusinessIdentityIntelligenceResult } from "./types";

export const BUSINESS_IDENTITY_INTELLIGENCE_VERSION = "business-identity-intelligence-v1";

const FIELD_MAP: Array<{ keys: string[]; labels: RegExp[]; type: BusinessIdentityEntityType }> = [
  { type: "business_name", keys: ["businessName", "name", "storeName", "sellerName", "brandName"], labels: [/business name/i, /store name/i, /seller/i, /brand/i] },
  { type: "legal_entity", keys: ["legalName", "legalEntity", "companyName", "entityName"], labels: [/legal entity/i, /legal name/i, /company name/i] },
  { type: "domain", keys: ["domain", "hostname", "website"], labels: [/domain/i, /website/i, /homepage/i] },
  { type: "email", keys: ["email", "contactEmail", "supportEmail", "legalEmail"], labels: [/email/i] },
  { type: "phone", keys: ["phone", "telephone", "contactPhone"], labels: [/phone/i, /telephone/i] },
  { type: "address", keys: ["address", "contactAddress", "registeredAddress"], labels: [/address/i] },
  { type: "policy_owner", keys: ["privacyPolicyEntity", "privacyOwner", "policyOwner"], labels: [/privacy.*(entity|owner|company)/i, /policy owner/i] },
  { type: "terms_entity", keys: ["termsEntity", "termsLegalEntity", "termsOwner"], labels: [/terms.*(entity|company|owner)/i] },
  { type: "copyright_owner", keys: ["copyrightOwner", "copyright"], labels: [/copyright/i] },
  { type: "official_claim", keys: ["officialClaim", "officialStatus"], labels: [/official claim/i, /official status/i] },
];

const DOCUMENT_TYPES: Record<string, BusinessIdentityEntityType> = { privacy_policy: "policy_owner", terms_of_service: "terms_entity", footer: "copyright_owner" };

function clean(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().toLowerCase() !== "unavailable" ? value.trim() : undefined;
}

function normalize(type: BusinessIdentityEntityType, value: string) {
  const lower = value.toLowerCase().trim();
  if (type === "domain") return lower.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  if (type === "email") return lower;
  if (type === "phone") return lower.replace(/[^0-9+]/g, "");
  return lower.replace(/\b(incorporated|inc\.?|llc|ltd\.?|limited|corp\.?|corporation|co\.?)\b/g, "").replace(/[^a-z0-9@.+]+/g, " ").trim();
}

function reliability(result: ProviderResult): BusinessIdentityEvidence["reliability"] {
  const text = `${result.providerId} ${result.metadata.evidenceCategory || ""} ${result.metadata.source || ""}`.toLowerCase();
  if (/government|regulator|official_exchange|registry/.test(text)) return "very_high";
  if (/privacy|terms|contact|marketplace|business-profile/.test(text)) return "high";
  if (/whois|dns|ssl|website|footer/.test(text)) return "medium";
  return "low";
}

function pushEvidence(out: BusinessIdentityEvidence[], result: ProviderResult, type: BusinessIdentityEntityType, value: string, source: string, label: string, evidenceId?: string) {
  const item: BusinessIdentityEvidence = {
    id: `${result.providerId}:${evidenceId || label}:${normalize(type, value)}`,
    entityType: type,
    value,
    normalizedValue: normalize(type, value),
    provenance: { providerId: result.providerId, providerVersion: result.providerVersion, evidenceId, source, label, observedAt: result.completedAt },
    reliability: reliability(result),
  };
  if (!out.some((existing) => existing.id === item.id)) out.push(item);
}

function extractEvidence(providerResults: ProviderResult[], target: string, claimedBusinessName?: string) {
  const out: BusinessIdentityEvidence[] = [];
  if (target) pushEvidence(out, { providerId: "intake", providerVersion: "input", status: "completed", startedAt: "", completedAt: "", duration: 0, findings: [], evidence: [], metadata: {}, errors: [] }, "domain", target, "intake", "Investigation target");
  if (claimedBusinessName) pushEvidence(out, { providerId: "intake", providerVersion: "input", status: "completed", startedAt: "", completedAt: "", duration: 0, findings: [], evidence: [], metadata: {}, errors: [] }, "business_name", claimedBusinessName, "intake", "Claimed business name");
  for (const result of providerResults.filter((r) => r.status === "completed")) {
    for (const map of FIELD_MAP) for (const key of map.keys) { const value = clean(result.metadata[key]); if (value) pushEvidence(out, result, map.type, value, String(result.metadata.source || result.providerId), key); }
    const category = clean(result.metadata.evidenceCategory);
    const legalName = clean(result.metadata.legalName);
    if (category && legalName && DOCUMENT_TYPES[category]) pushEvidence(out, result, DOCUMENT_TYPES[category], legalName, category, category);
    for (const evidence of result.evidence) addEvidenceItem(out, result, evidence);
  }
  return out;
}

function addEvidenceItem(out: BusinessIdentityEvidence[], result: ProviderResult, evidence: ProviderEvidence) {
  const value = clean(evidence.value);
  if (!value) return;
  for (const map of FIELD_MAP) if (map.labels.some((pattern) => pattern.test(evidence.label))) pushEvidence(out, result, map.type, value, evidence.source || result.providerId, evidence.label, evidence.id);
}

function compatibleName(a: string, b: string) {
  return a === b || a.includes(b) || b.includes(a);
}

function group(evidence: BusinessIdentityEvidence[], type: BusinessIdentityEntityType) {
  return evidence.filter((item) => item.entityType === type).reduce<Record<string, BusinessIdentityEvidence[]>>((acc, item) => ({ ...acc, [item.normalizedValue]: [...(acc[item.normalizedValue] || []), item] }), {});
}

function finding(id: string, category: BusinessIdentityFinding["category"], evidence: BusinessIdentityEvidence[], confidence: number, explanation: string): BusinessIdentityFinding {
  const affected = Array.from(new Set(evidence.map((item) => item.entityType))).map((type) => ({ type, values: Array.from(new Set(evidence.filter((item) => item.entityType === type).map((item) => item.value))) }));
  return { id, category, evidence, provenance: evidence.map((item) => item.provenance), confidence, explanation, affectedEntities: affected };
}

export function buildBusinessIdentityIntelligence(input: BusinessIdentityIntelligenceInput): BusinessIdentityIntelligenceResult {
  const target = input.target || "unknown target";
  const evidence = extractEvidence(input.providerResults || [], target, input.claimedBusinessName);
  const findings: BusinessIdentityFinding[] = [];
  const primaryTypes: BusinessIdentityEntityType[] = ["business_name", "legal_entity", "domain", "email", "phone", "address", "policy_owner", "terms_entity", "copyright_owner"];
  for (const type of primaryTypes) {
    const groups = Object.values(group(evidence, type)).filter((items) => items.length > 0);
    if (groups.length > 1 && !(type === "business_name" && Object.keys(group(evidence, type)).every((a, _, arr) => arr.some((b) => a !== b && compatibleName(a, b)) || arr.length === 1))) findings.push(finding(`conflict-${type}`, type === "legal_entity" || type === "policy_owner" || type === "terms_entity" || type === "copyright_owner" ? "Conflicting Legal Entity" : type === "email" || type === "phone" || type === "address" ? "Conflicting Contact Information" : "Identity Conflict", groups.flat(), 0.86, `Multiple distinct ${type.replace(/_/g, " ")} values were observed across sources. This is an evidence conflict and not a wrongdoing conclusion.`));
  }

  const legalLikeTypes: BusinessIdentityEntityType[] = ["legal_entity", "policy_owner", "terms_entity", "copyright_owner"];
  const legalLikeValues = legalLikeTypes.flatMap((type) => Object.keys(group(evidence, type)).map((value) => ({ type, value })));
  const incompatibleLegal = legalLikeValues.some((left, index) => legalLikeValues.slice(index + 1).some((right) => !compatibleName(left.value, right.value)));
  if (incompatibleLegal) findings.push(finding("document-legal-entity-conflict", "Conflicting Legal Entity", evidence.filter((item) => legalLikeTypes.includes(item.entityType)), 0.88, "Legal, policy, terms or copyright evidence references different organization names across collected documents."));
  const domainEvidence = evidence.filter((item) => item.entityType === "domain");
  const ownerEvidence = evidence.filter((item) => ["business_name", "legal_entity", "policy_owner", "terms_entity", "copyright_owner"].includes(item.entityType));
  const officialClaims = evidence.filter((item) => item.entityType === "official_claim");
  if (ownerEvidence.length >= 3 && !findings.some((f) => f.category.includes("Conflict"))) findings.push(finding("identity-consistent", "Identity Consistent", ownerEvidence, 0.82, "Business name, legal-document and ownership evidence are internally consistent across the collected sources."));
  if (ownerEvidence.some((item) => item.reliability === "very_high") && domainEvidence.length > 0 && !findings.some((f) => f.id === "conflict-business_name" || f.id === "conflict-legal_entity")) findings.push(finding("verified-identity", "Verified Identity", [...ownerEvidence.filter((item) => item.reliability === "very_high"), ...domainEvidence], 0.9, "Authoritative identity evidence is present and no collected evidence contradicts the primary identity."));
  if (ownerEvidence.length === 0 || domainEvidence.length === 0) findings.push(finding("identity-incomplete", "Identity Incomplete", evidence, 0.72, "Collected evidence does not include enough business identity and domain ownership context to establish a complete identity picture."));
  if (domainEvidence.length > 0 && ownerEvidence.length > 0 && !ownerEvidence.some((item) => item.reliability === "very_high" || item.reliability === "high")) findings.push(finding("ownership-evidence-insufficient", "Insufficient Ownership Evidence", [...domainEvidence, ...ownerEvidence], 0.74, "The domain is observable, but ownership evidence comes only from lower-reliability observations."));
  if (officialClaims.length > 0 && !ownerEvidence.some((item) => item.reliability === "very_high")) findings.push(finding("unsupported-official-claim", "Potential Identity Misrepresentation", officialClaims, 0.78, "An official-status claim was observed without authoritative supporting evidence in the collected data."));
  const names = Object.keys(group(evidence, "business_name")); const legal = Object.keys(group(evidence, "legal_entity"));
  if (names.length > 0 && legal.length > 0 && !names.some((name) => legal.some((entity) => compatibleName(name, entity)))) {
    const mismatchEvidence = evidence.filter((item) => item.entityType === "business_name" || item.entityType === "legal_entity");
    findings.push(finding("public-legal-identity-conflict", "Identity Conflict", mismatchEvidence, 0.82, "The public business name and legal entity evidence point to different names and require reconciliation."));
    findings.push(finding("public-legal-name-mismatch", "Potential Impersonation", mismatchEvidence, 0.8, "The public business name and legal entity evidence point to different names. Review is needed to determine whether this is an alias, subsidiary or unrelated identity."));
  }
  const confidence = findings.length ? Math.round(findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length * 100) / 100 : 0.5;
  return { engineVersion: BUSINESS_IDENTITY_INTELLIGENCE_VERSION, generatedAt: input.generatedAt || new Date().toISOString(), target, confidence, findings, evidenceCoverage: { totalEvidence: evidence.length, coveredEntityTypes: Array.from(new Set(evidence.map((item) => item.entityType))), providerCount: new Set(evidence.map((item) => item.provenance.providerId)).size }, validationNotice: "Findings describe observable identity evidence only and must not be read as wrongdoing accusations." };
}
