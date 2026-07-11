import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveBusinessIdentity, CANONICAL_IDENTITY_TYPES, VERIFIED_RELATIONSHIP_TYPES } = require("../lib/businessIdentityResolver.js");

const observedAt = "2026-01-01T00:00:00.000Z";
const fixtureSeeds = [
  { id: "registry-alpha", domain: "fixture-alpha.example", legalName: "Fixture Alpha LLC", brandName: "Alpha Store", verified: true, source: "official_business_registry", observedAt },
];

const domainLinked = resolveBusinessIdentity("fixture-alpha.example", { seeds: fixtureSeeds, observedAt });
assert.ok(CANONICAL_IDENTITY_TYPES.includes("LegalEntity"));
assert.ok(VERIFIED_RELATIONSHIP_TYPES.includes("USES_DOMAIN"));
assert.equal(domainLinked.canonicalOrganization.label, "Fixture Alpha LLC");
assert.equal(domainLinked.primaryIdentity.legalName, "Fixture Alpha LLC");
assert.equal(domainLinked.primaryIdentity.kind, "externally_verified");
assert.ok(domainLinked.primaryIdentity.aliases.includes("Alpha Store"));
assert.ok(domainLinked.canonicalIdentityGraph.relationships.some((rel) => rel.type === "USES_DOMAIN" && rel.source && rel.evidenceRefs.length && rel.observedAt && rel.verificationStatus === "verified"));

const brandDifferentLegal = resolveBusinessIdentity("Alpha Outlet", {
  relationshipEvidence: [{ id: "brand-owner", brandName: "Alpha Outlet", legalName: "Different Fixture Ltd", verified: true, source: "official_business_registry", observedAt }],
  observedAt,
});
assert.equal(brandDifferentLegal.canonicalOrganization.label, "Different Fixture Ltd");
assert.ok(brandDifferentLegal.canonicalIdentityGraph.relationships.some((rel) => rel.type === "REPRESENTS"));

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
assert.equal(marketplace.canonicalOrganization.label, "Fixture Merchant LLC");
assert.ok(marketplace.canonicalIdentityGraph.relationships.some((rel) => rel.type === "OPERATES_ACCOUNT"));

const unresolvedSmallBusiness = resolveBusinessIdentity("Tiny Corner Shop", { observedAt });
assert.equal(unresolvedSmallBusiness.identityResolutionStatus, "unresolved");
assert.equal(unresolvedSmallBusiness.identityConfidence, "Low");
assert.deepEqual(unresolvedSmallBusiness.entityClassification.afterCanonicalResolution, []);

const conflictingOwnership = resolveBusinessIdentity("fixture-conflict.example", {
  providerEvidence: [
    { id: "ownership-a", domain: "fixture-conflict.example", legalName: "Fixture Conflict LLC", ownerName: "Owner A Holdings", verified: true, source: "official_business_registry", observedAt },
    { id: "ownership-b", domain: "fixture-conflict.example", legalName: "Fixture Conflict LLC", ownerName: "Owner B Holdings", verified: true, source: "official_business_registry", observedAt },
  ],
  observedAt,
});
assert.equal(conflictingOwnership.identityResolutionStatus, "resolved_with_conflicts");
assert.equal(conflictingOwnership.primaryIdentity.conflicts[0].field, "ownership");

console.log("canonical identity validation passed");
