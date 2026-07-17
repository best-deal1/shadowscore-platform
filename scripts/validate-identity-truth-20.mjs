import assert from "node:assert/strict";
import { resolveBusinessIdentity } from "../lib/businessIdentityResolver.ts";

const observedAt = "2026-01-01T00:00:00.000Z";
const organizations = [
  ["microsoft.com", "Microsoft Corporation"], ["stripe.com", "Stripe, Inc."], ["apple.com", "Apple Inc."], ["amazon.com", "Amazon.com, Inc."], ["google.com", "Google LLC"],
  ["meta.com", "Meta Platforms, Inc."], ["netflix.com", "Netflix, Inc."], ["shopify.com", "Shopify Inc."], ["salesforce.com", "Salesforce, Inc."], ["adobe.com", "Adobe Inc."],
  ["walmart.com", "Walmart Inc."], ["target.com", "Target Corporation"], ["nike.com", "NIKE, Inc."], ["paypal.com", "PayPal, Inc."], ["squareup.com", "Block, Inc."],
  ["uber.com", "Uber Technologies, Inc."], ["airbnb.com", "Airbnb, Inc."], ["spotify.com", "Spotify AB"], ["zoom.us", "Zoom Communications, Inc."], ["github.com", "GitHub, Inc."],
];

const rows = organizations.map(([domain, legalName]) => {
  const result = resolveBusinessIdentity(domain, {
    registryEvidence: [{ id: `${domain}:registry`, domain, legalName, verified: true, source: "official_business_registry", observedAt }],
    businessProfileEvidence: [{ id: `${domain}:profile`, domain, legalName, verified: true, source: "public_business_profile", observedAt }],
    observedAt,
  });
  assert.equal(result.primaryIdentity.displayName, legalName);
  assert.equal(result.attributeConfidence.domains.corroboratedByIndependentProviders, true);
  assert.equal(result.identityResolutionStatus, "resolved");
  assert.deepEqual(result.entityClassification.afterCanonicalResolution, []);
  return { domain, identity: result.primaryIdentity.displayName, domainConfidence: result.attributeConfidence.domains.confidence, sources: result.attributeConfidence.domains.sources.length, policyClassifications: result.entityClassification.afterCanonicalResolution.join(", ") || "None" };
});

const unknown = resolveBusinessIdentity("unknown-bank-looking.example", { observedAt });
assert.equal(unknown.primaryIdentity.displayName, "Unknown");
assert.equal(unknown.identityResolutionStatus, "unresolved");
assert.deepEqual(unknown.entityClassification.afterCanonicalResolution, []);

console.table(rows);
console.log("20-organization identity truth validation passed without regulated/public-company policy changes");
