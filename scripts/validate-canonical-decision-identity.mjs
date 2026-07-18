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

for (const [domain, brand, legal] of [["microsoft.com", "Microsoft", "Microsoft Corporation"], ["apple.com", "Apple", "Apple Inc."], ["amazon.com", "Amazon", "Amazon.com, Inc."], ["cloudflare.com", "Cloudflare", "Cloudflare, Inc."], ["shopify.com", "Shopify", "Shopify Inc."], ["monday.com", "monday.com", "monday.com Ltd."], ["checkpoint.com", "Check Point Software Technologies", "Check Point Software Technologies Ltd."]]) {
  const result = resolveBusinessIdentity(domain, { observedAt: now, generatedAt: now });
  assert.equal(result.canonicalIdentity.brandName, brand, domain);
  assert.equal(result.canonicalIdentity.legalName, legal, domain);
  assert.equal(result.canonicalIdentity.companyType, "PUBLIC_COMPANY", domain);
}
assert.equal(resolveBusinessIdentity("stripe.com", { observedAt: now, generatedAt: now }).canonicalIdentity.companyType, "PRIVATE_COMPANY");
assert.equal(resolveBusinessIdentity("ksp.co.il", { observedAt: now, generatedAt: now }).canonicalIdentity.companyType, "UNKNOWN");
assert.equal(resolveBusinessIdentity("leumi.co.il", { observedAt: now, generatedAt: now }).canonicalIdentity.companyType, "BANK");
assert.equal(resolveBusinessIdentity("hapoalim.co.il", { observedAt: now, generatedAt: now }).canonicalIdentity.companyType, "BANK");

const conflict = resolveBusinessIdentity("example.com", { providerResults: [provider("registry", { resolverEvidence: { legalName: "Company A Ltd", domain: "example.com", source: "government_registry", verificationStatus: "authoritative", verified: true }}), provider("footer", { resolverEvidence: { legalName: "Company B Ltd", domain: "example.com", source: "website_footer", verificationStatus: "verified", verified: true }})], observedAt: now, generatedAt: now });
assert.ok(conflict.contradictions.length > 0);
assert.equal(conflict.canonicalIdentity.identityStatus, "CONFLICTED");
assert.ok(conflict.canonicalIdentity.contradictorySourceCount > 0);
console.log("canonical decision and identity validations passed");
