import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveBusinessIdentity } = require("../lib/businessIdentityResolver.js");

const observedAt = "2026-01-01T00:00:00.000Z";

const identifierOnly = resolveBusinessIdentity("bank-looking.example", { observedAt });
assert.equal(identifierOnly.entityClassification.beforeCanonicalResolution, "Identifier or evidence object only");
assert.deepEqual(identifierOnly.entityClassification.afterCanonicalResolution, []);
assert.equal(identifierOnly.unresolvedIdentityBehavior, "Returns unresolved identity, low confidence, and no inferred regulated or public-company class.");

const canonical = resolveBusinessIdentity("bank-looking.example", {
  providerEvidence: [{ id: "reg-evidence", domain: "bank-looking.example", legalName: "Bank Looking NA", licenseNumber: "BK-9", regulatorName: "National Bank Regulator", licenseCategory: "bank", verified: true, source: "bank_regulator", observedAt }],
  observedAt,
});
assert.ok(canonical.identityResolutionFlow.some((step) => step.includes("Classify from verified canonical relationships")));
assert.ok(canonical.relationshipProvenance.every((rel) => rel.source && rel.confidence >= 0 && rel.evidenceRefs.length && rel.observedAt && rel.verificationStatus));
assert.deepEqual(canonical.entityClassification.afterCanonicalResolution, ["Regulated Financial Institution"]);

console.log("entity validation passed");
