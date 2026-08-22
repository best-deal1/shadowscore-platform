import assert from "node:assert/strict";
import { resolveBusinessIdentity, CANONICAL_IDENTITY_TYPES, VERIFIED_RELATIONSHIP_TYPES } from "../lib/businessIdentityResolver.ts";

const observedAt = "2026-01-01T00:00:00.000Z";
const discoveredRegistryEvidence = [
  { id: "registry-alpha", domain: "fixture-alpha.example", legalName: "Fixture Alpha LLC", brandName: "Alpha Store", verified: true, source: "official_business_registry", observedAt },
];

const seedOnly = resolveBusinessIdentity("fixture-alpha.example", {
  seeds: discoveredRegistryEvidence,
  observedAt,
});
assert.equal(seedOnly.identityResolutionStatus, "unresolved");
assert.ok(seedOnly.limitations.some((item) => item.includes("seeds are intentionally ignored")));

const domainLinked = resolveBusinessIdentity("fixture-alpha.example", { registryEvidence: discoveredRegistryEvidence, observedAt });
assert.ok(CANONICAL_IDENTITY_TYPES.includes("LegalEntity"));
assert.ok(VERIFIED_RELATIONSHIP_TYPES.includes("USES_DOMAIN"));
assert.equal(domainLinked.identityResolutionStatus, "resolved");
assert.equal(domainLinked.reviewStatus, "PASS");
assert.equal(domainLinked.canonicalOrganization?.label, "Fixture Alpha LLC");
assert.equal(domainLinked.canonicalIdentity.hasAuthoritativeSource, true);
assert.deepEqual(domainLinked.missingEvidence, []);
assert.ok(domainLinked.canonicalIdentityGraph.relationships.some((relationship) =>
  relationship.type === "USES_DOMAIN"
  && relationship.source === "official_business_registry"
  && relationship.verificationStatus === "verified"
  && relationship.attributes.evidenceCategory === "public_registry"
  && relationship.evidenceRefs.includes("registry-alpha")
));

const unverifiedRegistryEvidence = resolveBusinessIdentity("fixture-alpha.example", {
  registryEvidence: discoveredRegistryEvidence.map((evidence) => ({ ...evidence, verified: false })),
  observedAt,
});
assert.equal(unverifiedRegistryEvidence.identityResolutionStatus, "unresolved");
assert.equal(unverifiedRegistryEvidence.reviewStatus, "REVIEW");
assert.ok(unverifiedRegistryEvidence.missingEvidence.some((item) => /verified\/corroborated identity relationships/i.test(item)));

const brandDifferentLegal = resolveBusinessIdentity("Alpha Outlet", {
  relationshipEvidence: [{ id: "brand-owner", brandName: "Alpha Outlet", legalName: "Different Fixture Ltd", verified: true, source: "official_business_registry", observedAt }],
  observedAt,
});
assert.equal(brandDifferentLegal.identityResolutionStatus, "resolved");
assert.equal(brandDifferentLegal.reviewStatus, "PASS");
assert.ok(brandDifferentLegal.canonicalIdentityGraph.relationships.some((relationship) =>
  relationship.type === "REPRESENTS"
  && relationship.source === "official_business_registry"
  && relationship.verificationStatus === "verified"
  && relationship.attributes.evidenceCategory === "public_registry"
));

const regulated = resolveBusinessIdentity("secure-bank.example", {
  providerEvidence: [{ id: "bank-license", domain: "secure-bank.example", legalName: "Secure Bank NA", licenseNumber: "BANK-123", regulatorName: "Bank Regulator", licenseCategory: "bank financial services", ticker: "SBNK", exchange: "NYSE", verified: true, source: "bank_regulator", observedAt }],
  observedAt,
});
assert.deepEqual(regulated.entityClassification.afterCanonicalResolution.sort(), ["Public Company", "Regulated Financial Institution"].sort());
assert.equal(regulated.entityClassification.confidence, "High");

const lookalike = resolveBusinessIdentity("secure-bank-login.example", { observedAt });
assert.equal(lookalike.identityResolutionStatus, "unresolved");
assert.equal(lookalike.identityConfidence, "Low");
assert.deepEqual(lookalike.entityClassification.afterCanonicalResolution, []);
assert.equal(lookalike.primaryIdentity.verified, false);

const marketplace = resolveBusinessIdentity("https://amazon.com/sp?seller=A1FIXTURE", {
  marketplaceEvidence: [{ id: "marketplace-kyb", legalName: "Fixture Merchant LLC", marketplaceAccount: "amazon:A1FIXTURE", sellerName: "Fixture Deals", verified: true, source: "verified_marketplace", observedAt }],
  observedAt,
});
assert.equal(marketplace.identityResolutionStatus, "unresolved");
assert.ok(marketplace.canonicalIdentityGraph.relationships.some((rel) => rel.type === "OPERATES_ACCOUNT"));

const unresolvedSmallBusiness = resolveBusinessIdentity("Tiny Corner Shop", { observedAt });
assert.equal(unresolvedSmallBusiness.identityResolutionStatus, "unresolved");
assert.equal(unresolvedSmallBusiness.identityConfidence, "Low");
assert.deepEqual(unresolvedSmallBusiness.entityClassification.afterCanonicalResolution, []);

const conflictingOwnership = resolveBusinessIdentity("fixture-conflict.example", {
  providerEvidence: [
    { id: "ownership-a", domain: "fixture-conflict.example", legalName: "Fixture Conflict LLC", ownerName: "Owner A Holdings", verified: true, source: "official_business_registry", observedAt },
    { id: "ownership-b", domain: "fixture-conflict.example", legalName: "Fixture Conflict LLC", ownerName: "Owner B Holdings", verified: true, source: "public_business_profile", observedAt },
  ],
  observedAt,
});
assert.equal(conflictingOwnership.identityResolutionStatus, "resolved_with_conflicts");
assert.equal(conflictingOwnership.primaryIdentity.conflicts[0].field, "ownership");

const unresolvedDomainOnly = resolveBusinessIdentity("shopify-looking.example", { observedAt });
assert.equal(unresolvedDomainOnly.primaryIdentity.displayName, "Unknown");
assert.equal(unresolvedDomainOnly.primaryIdentity.kind, "unknown");
assert.equal(unresolvedDomainOnly.attributeConfidence.domains.confidence, "Low");

const corroborated = resolveBusinessIdentity("fixture-alpha.example", {
  registryEvidence: discoveredRegistryEvidence,
  businessProfileEvidence: [{ id: "profile-alpha", domain: "fixture-alpha.example", legalName: "Fixture Alpha LLC", verified: true, source: "public_business_profile", observedAt }],
  observedAt,
});
assert.equal(corroborated.attributeConfidence.domains.corroboratedByIndependentProviders, true);
assert.ok(corroborated.attributeConfidence.domains.sources.includes("official_business_registry"));
assert.ok(corroborated.attributeConfidence.domains.sources.includes("public_business_profile"));
assert.notEqual(corroborated.attributeConfidence.legalName.confidence, corroborated.attributeConfidence.emails.confidence);

console.log("canonical identity validation passed");
