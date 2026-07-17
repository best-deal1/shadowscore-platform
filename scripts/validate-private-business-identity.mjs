import assert from "node:assert/strict";
import { resolveBusinessIdentity } from "../lib/businessIdentityResolver.ts";

const observedAt = "2026-01-01T00:00:00.000Z";
const source = (domain, legalName, kind, extra = {}) => ({ id: `${domain}:${kind}`, domain, legalName, verified: true, source: kind, evidenceCategory: kind, observedAt, ...extra });
const benchmark = [
  { domain: "microsoft.com", expected: "Microsoft Corporation", before: "PASS", evidence: [source("microsoft.com", "Microsoft Corporation", "official_exchange", { ticker: "MSFT", exchange: "Nasdaq" })] },
  { domain: "apple.com", expected: "Apple Inc.", before: "PASS", evidence: [source("apple.com", "Apple Inc.", "official_exchange", { ticker: "AAPL", exchange: "Nasdaq" })] },
  { domain: "cloudflare.com", expected: "Cloudflare, Inc.", before: "PASS", evidence: [source("cloudflare.com", "Cloudflare, Inc.", "official_exchange", { ticker: "NET", exchange: "NYSE" })] },
  { domain: "stripe.com", expected: "Stripe, Inc.", before: "PASS", evidence: [source("stripe.com", "Stripe, Inc.", "privacy_policy"), source("stripe.com", "Stripe, Inc.", "terms_of_service")] },
  { domain: "github.com", expected: "GitHub, Inc.", before: "PASS", evidence: [source("github.com", "GitHub, Inc.", "privacy_policy"), source("github.com", "GitHub, Inc.", "contact_page")] },
  { domain: "bankhapoalim.co.il", expected: "Bank Hapoalim B.M.", before: "REVIEW", evidence: [source("bankhapoalim.co.il", "Bank Hapoalim B.M.", "official_regulator", { regulatorName: "Bank of Israel", licenseCategory: "bank" })] },
  { domain: "ksp.co.il", expected: "KSP Group Ltd", before: "REVIEW", evidence: [source("ksp.co.il", "KSP Group Ltd", "privacy_policy", { brandName: "KSP" }), source("ksp.co.il", "KSP Group Ltd", "terms_of_service", { address: "Israel" })] },
  { domain: "bug.co.il", expected: "Bug Multisystem Ltd", before: "REVIEW", evidence: [source("bug.co.il", "Bug Multisystem Ltd", "footer", { brandName: "Bug" }), source("bug.co.il", "Bug Multisystem Ltd", "privacy_policy")] },
  { domain: "ivory.co.il", expected: "Ivory Computers Ltd", before: "REVIEW", evidence: [source("ivory.co.il", "Ivory Computers Ltd", "contact_page", { brandName: "Ivory" }), source("ivory.co.il", "Ivory Computers Ltd", "terms_of_service")] },
  { domain: "gadgetdeals.co.il", expected: "Unknown", before: "REVIEW", evidence: [source("gadgetdeals.co.il", "Gadget Deals", "footer", { verified: false, legalName: undefined, businessName: "Gadget Deals" })] },
  { domain: "shopify-store.example", expected: "Unknown", before: "REVIEW", evidence: [source("shopify-store.example", "Example Store", "schema_org", { verified: false, legalName: undefined, businessName: "Example Store" })] },
  { domain: "woocommerce-store.example", expected: "Example Commerce LLC", before: "REVIEW", evidence: [source("woocommerce-store.example", "Example Commerce LLC", "privacy_policy"), source("woocommerce-store.example", "Example Commerce LLC", "contact_page", { email: "support@woocommerce-store.example" })] },
  { domain: "saas-private.example", expected: "Private SaaS Inc.", before: "REVIEW", evidence: [source("saas-private.example", "Private SaaS Inc.", "about_page"), source("saas-private.example", "Private SaaS Inc.", "terms_of_service", { email: "legal@saas-private.example" })] },
];

const rows = benchmark.map((entry) => {
  const result = resolveBusinessIdentity(entry.domain, { businessProfileEvidence: entry.evidence, observedAt });
  const expectedReview = entry.expected === "Unknown";
  assert.equal(result.reviewStatus, expectedReview ? "REVIEW" : "PASS", `${entry.domain} review status`);
  assert.equal(result.primaryIdentity.displayName, entry.expected, `${entry.domain} identity`);
  if (expectedReview) assert.ok(result.missingEvidence.length > 0, `${entry.domain} must explain missing evidence`);
  else assert.ok(result.relationshipProvenance.every((rel) => rel.source && rel.evidenceRefs.length && rel.observedAt && rel.verificationStatus), `${entry.domain} relationship provenance`);
  return { target: entry.domain, before: entry.before, after: result.reviewStatus, resolved: result.identityResolutionStatus === "resolved", evidenceCoverage: result.relationshipProvenance.length, unresolvedIdentity: result.primaryIdentity.displayName === "Unknown", falsePositive: entry.expected === "Unknown" && result.primaryIdentity.displayName !== "Unknown" };
});

const comparison = {
  organizationResolutionRate: `${rows.filter((r)=>r.resolved).length}/${rows.length}`,
  evidenceCoverage: rows.reduce((n,r)=>n+r.evidenceCoverage,0),
  passReviewChanges: rows.filter((r)=>r.before !== r.after).map((r)=>`${r.target}: ${r.before}->${r.after}`),
  unresolvedIdentities: rows.filter((r)=>r.unresolvedIdentity).map((r)=>r.target),
  falsePositiveCount: rows.filter((r)=>r.falsePositive).length,
};
assert.equal(comparison.falsePositiveCount, 0);
console.table(rows);
console.log("Private business identity benchmark comparison:", JSON.stringify(comparison, null, 2));
