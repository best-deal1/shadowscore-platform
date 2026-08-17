import assert from "node:assert/strict";
import { buildCanonicalDecision } from "../lib/canonicalDecision.ts";
import { cleanPageTitle } from "../lib/identity/canonical.ts";
import { resolveBusinessIdentity } from "../lib/businessIdentityResolver.ts";

const now = "2026-07-17T00:00:00.000Z";
const provider = (providerId, metadata = {}, evidence = []) => ({ providerId, providerVersion: "test", status: "completed", startedAt: now, completedAt: now, duration: 1, findings: [], evidence, metadata, errors: [] });

const green = buildCanonicalDecision({ status: "PASS", hasStrongCorroboratedIdentity: true, confidenceScore: 90 });
assert.equal(green.status, "PASS"); assert.equal(green.decisionLight, "GREEN"); assert.equal(green.decisionOutcome, "PROCEED");
const yellow = buildCanonicalDecision({ status: "PROCEED_WITH_VERIFICATION", missingEvidence: ["Legal business identity"], confidenceScore: 55 });
assert.equal(yellow.status, "PROCEED_WITH_VERIFICATION"); assert.equal(yellow.decisionLight, "YELLOW"); assert.equal(yellow.decisionOutcome, "PROCEED_WITH_VERIFICATION"); assert.ok(!/\bYES\b/.test(yellow.headline)); assert.ok(yellow.allowedActions.includes("continue preliminary discussions")); assert.ok(yellow.blockedActions.includes("large payment"));
const orange = buildCanonicalDecision({ status: "REVIEW", hasMaterialContradiction: true });
assert.equal(orange.decisionLight, "ORANGE"); assert.equal(orange.decisionOutcome, "PAUSE_AND_VERIFY");
const red = buildCanonicalDecision({ hasConfirmedSeriousNegative: true });
assert.equal(red.status, "STOP"); assert.equal(red.decisionLight, "RED"); assert.equal(red.decisionOutcome, "DO_NOT_PROCEED");
assert.notEqual(buildCanonicalDecision({ status: "REVIEW", hasMaterialContradiction: true }).decisionLight, "GREEN");
assert.notEqual(buildCanonicalDecision({ status: "REVIEW", missingEvidence: ["Core identity missing"] }).status, "PASS");

assert.equal(cleanPageTitle("Stripe | Financial Infrastructure to Grow Your Revenue"), "Stripe");
assert.equal(cleanPageTitle("Shopify: The All-in-One Commerce Platform for Businesses - Shopify"), "Shopify");
assert.equal(cleanPageTitle("The AI workspace that works for you. | Notion"), "Notion");
assert.equal(cleanPageTitle("BUG מחשבים וסלולר - מבצעים | BUG"), "BUG");
assert.equal(cleanPageTitle("AT&T &amp; Business Solutions"), "AT&T & Business");

for (const domain of ["microsoft.com", "apple.com", "stripe.com", "openai.com", "ksp.co.il", "leumi.co.il"]) {
  const result = resolveBusinessIdentity(domain, { observedAt: now, generatedAt: now });
  assert.equal(result.canonicalIdentity.canonicalDisplayName, "Unknown", domain);
  assert.equal(result.canonicalIdentity.legalName, undefined, domain);
  assert.equal(result.canonicalIdentity.country, undefined, domain);
  assert.equal(result.canonicalIdentity.companyType, "UNKNOWN", domain);
  assert.equal(result.canonicalIdentity.identityStatus, "UNRESOLVED", domain);
  assert.equal(result.canonicalIdentity.corroborationCount, 0, domain);
}

// A, B and C: historical curated values cannot establish legal name, country, or company type.
const curatedOnly = resolveBusinessIdentity("openai.com", { observedAt: now, generatedAt: now });
assert.equal(curatedOnly.canonicalOrganization, null);
assert.equal(curatedOnly.reviewStatus, "REVIEW");
assert.equal(curatedOnly.canonicalIdentity.legalName, undefined);
assert.equal(curatedOnly.canonicalIdentity.country, undefined);
assert.equal(curatedOnly.canonicalIdentity.companyType, "UNKNOWN");
assert.equal(curatedOnly.canonicalIdentity.hasAuthoritativeSource, false);

// D: an authoritative registry record wins over historical curated knowledge without a fake conflict.
const registryContradictsHistoricalMapping = resolveBusinessIdentity("openai.com", {
  registryEvidence: [{ id: "registry-openai-adversarial", domain: "openai.com", legalName: "Independent Example Registry Ltd", country: "Canada", verified: true, verificationStatus: "authoritative", source: "official_business_registry", evidenceCategory: "public_registry", observedAt: now }],
  observedAt: now,
  generatedAt: now,
});
assert.equal(registryContradictsHistoricalMapping.canonicalIdentity.legalName, "Independent Example Registry Ltd");
assert.equal(registryContradictsHistoricalMapping.canonicalIdentity.country, "Canada");
assert.equal(registryContradictsHistoricalMapping.canonicalIdentity.companyType, "PRIVATE_COMPANY");
assert.equal(registryContradictsHistoricalMapping.canonicalIdentity.hasAuthoritativeSource, true);
assert.equal(registryContradictsHistoricalMapping.contradictions.length, 0);
assert.equal(registryContradictsHistoricalMapping.canonicalIdentity.corroborationCount, 1);

// E: a matching website disclosure remains one external source and cannot verify identity by itself.
const oneMatchingExternalSource = resolveBusinessIdentity("openai.com", {
  businessProfileEvidence: [{ id: "openai-footer", domain: "openai.com", legalName: "OpenAI, L.L.C.", country: "United States", verified: true, verificationStatus: "verified", source: "website_footer", evidenceCategory: "footer", observedAt: now }],
  observedAt: now,
  generatedAt: now,
});
assert.equal(oneMatchingExternalSource.canonicalOrganization, null);
assert.equal(oneMatchingExternalSource.reviewStatus, "REVIEW");
assert.equal(oneMatchingExternalSource.canonicalIdentity.legalName, undefined);
assert.equal(oneMatchingExternalSource.canonicalIdentity.country, undefined);
assert.equal(oneMatchingExternalSource.canonicalIdentity.companyType, "UNKNOWN");
assert.equal(oneMatchingExternalSource.canonicalIdentity.corroborationCount, 1);

const conflict = resolveBusinessIdentity("example.com", { providerResults: [provider("registry", { resolverEvidence: { legalName: "Company A Ltd", domain: "example.com", source: "government_registry", verificationStatus: "authoritative", verified: true }}), provider("footer", { resolverEvidence: { legalName: "Company B Ltd", domain: "example.com", source: "website_footer", verificationStatus: "verified", verified: true }})], observedAt: now, generatedAt: now });
assert.ok(conflict.contradictions.length > 0);
assert.equal(conflict.canonicalIdentity.identityStatus, "CONFLICTED");
assert.ok(conflict.canonicalIdentity.contradictorySourceCount > 0);
console.log("canonical decision and identity validations passed");
