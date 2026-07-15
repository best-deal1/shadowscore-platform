import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveBusinessIdentity } = require("../lib/businessIdentityResolver.js");

const observedAt = "2026-01-01T00:00:00.000Z";
const benchmark = JSON.parse(readFileSync(new URL("../trust-certification-benchmark.json", import.meta.url), "utf8"));
const requiredCategories = ["Global enterprise", "Public company", "Israeli", "Banks", "SaaS", "Government", "University", "Nonprofit", "Small business", "Personal website"];

function evidenceFor(entry) {
  const fixture = entry.fixtureEvidence;
  if (!fixture) return {};
  if (fixture.contradictoryLegalNames) {
    const [registryName, metadataName] = fixture.contradictoryLegalNames;
    return {
      registryEvidence: [{ id: `${entry.domain}:registry`, domain: entry.domain, legalName: registryName, verified: true, source: "official_business_registry", observedAt }],
      structuredMetadataEvidence: [{ id: `${entry.domain}:metadata`, domain: entry.domain, legalName: metadataName, verified: true, source: "website_metadata", observedAt }],
    };
  }
  const base = { id: `${entry.domain}:registry`, domain: entry.domain, legalName: fixture.legalName, verified: true, source: fixture.source || "official_business_registry", observedAt };
  return {
    registryEvidence: [base],
    businessProfileEvidence: [{ ...base, id: `${entry.domain}:profile`, source: "public_business_profile" }],
    regulatoryEvidence: fixture.regulatorName ? [{ ...base, id: `${entry.domain}:regulator`, source: "official_regulator", regulatorName: fixture.regulatorName, licenseCategory: fixture.licenseCategory }] : [],
    providerEvidence: fixture.exchange ? [{ ...base, id: `${entry.domain}:exchange`, source: "official_exchange", exchange: fixture.exchange, ticker: fixture.ticker }] : [],
  };
}

for (const category of requiredCategories) assert.ok(benchmark.some((entry) => entry.category.toLowerCase().includes(category.toLowerCase().replace(/s$/, ""))), `missing benchmark category: ${category}`);

const rows = benchmark.map((entry) => {
  for (const field of ["expectedIdentity", "expectedOrganizationClass", "expectedTrustOutcome", "expectedEvidenceAvailability", "expectedProviderAvailability", "knownInfrastructureLimitations", "knownProviderLimitations"]) assert.ok(Object.hasOwn(entry, field), `${entry.domain} missing ${field}`);
  const result = resolveBusinessIdentity(entry.domain, { ...evidenceFor(entry), observedAt });
  const expectedUnknown = entry.expectedIdentity === "Unknown";
  if (expectedUnknown) assert.equal(result.primaryIdentity.displayName, "Unknown", `${entry.domain} should remain Unknown`);
  else assert.equal(result.primaryIdentity.displayName, entry.expectedIdentity, `${entry.domain} identity mismatch`);

  if (entry.expectedOrganizationClass === "Unknown") assert.deepEqual(result.entityClassification.afterCanonicalResolution, [], `${entry.domain} must not invent class`);
  else assert.ok(result.entityClassification.afterCanonicalResolution.includes(entry.expectedOrganizationClass), `${entry.domain} missing class ${entry.expectedOrganizationClass}`);

  assert.ok(result.evidenceExplainability, `${entry.domain} missing evidence explainability`);
  assert.ok(result.identityResolutionFlow.some((step) => /do not consult curated|No canonical|Classify/.test(step)), `${entry.domain} missing trust-first flow`);
  assert.ok(result.limitations.some((item) => /hostnames are not converted into organization names/i.test(item)), `${entry.domain} missing no-invention limitation`);
  if (entry.domain === "contradiction.example") {
    assert.equal(result.identityResolutionStatus, "resolved_with_conflicts");
    assert.ok(result.contradictions.length > 0, "contradiction benchmark must raise contradictions");
    assert.notEqual(result.primaryIdentity.displayName, "Google LLC", "must not silently choose conflicting metadata");
  }
  return { domain: entry.domain, expected: entry.expectedIdentity, actual: result.primaryIdentity.displayName, status: result.identityResolutionStatus, class: result.entityClassification.afterCanonicalResolution.join(", ") || "Unknown" };
});

console.table(rows);
console.log("Trust Certification benchmark passed: identity, classification, unknown, confidence explainability, and contradiction controls are enforced.");
