import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveBusinessIdentity } = require("../lib/businessIdentityResolver.js");

const fixtureSeeds = [
  { id: "fixture-registry-alpha", domain: "fixture-alpha.example", legalName: "Fixture Alpha LLC", name: "Fixture Alpha", verified: true },
  { id: "fixture-alias-alpha", domain: "fixture-alpha.example", alias: "Alpha Store" },
];

const withSeeds = resolveBusinessIdentity("fixture-alpha.example", { seeds: fixtureSeeds });
assert.equal(withSeeds.primaryIdentity.legalName, "Fixture Alpha LLC");
assert.equal(withSeeds.primaryIdentity.kind, "externally_verified");
assert.ok(withSeeds.primaryIdentity.aliases.includes("Alpha Store"));

const noSeed = resolveBusinessIdentity("fixture-alpha.example");
assert.equal(noSeed.primaryIdentity.kind, "temporary");
assert.equal(noSeed.primaryIdentity.legalName, undefined);
assert.equal(noSeed.primaryIdentity.verified, false);

const unknownDomain = resolveBusinessIdentity("unknown.example");
assert.deepEqual(unknownDomain.primaryIdentity.domains, ["unknown.example"]);
assert.equal(unknownDomain.primaryIdentity.temporary, true);
assert.equal(unknownDomain.primaryIdentity.emails.length, 0);

const emailTarget = resolveBusinessIdentity("owner@fixture-alpha.example");
assert.equal(emailTarget.normalizedInput.domain, "fixture-alpha.example");
assert.deepEqual(emailTarget.primaryIdentity.emails, ["owner@fixture-alpha.example"]);

const aliasMerge = resolveBusinessIdentity("fixture-beta.example", {
  businessProfile: { domain: "fixture-beta.example", name: "Fixture Beta" },
  marketplaceEvidence: [{ domain: "fixture-beta.example", sellerName: "Beta Outlet" }],
});
assert.ok(aliasMerge.primaryIdentity.aliases.includes("Fixture Beta"));
assert.ok(aliasMerge.primaryIdentity.aliases.includes("Beta Outlet"));

const conflicting = resolveBusinessIdentity("fixture-conflict.example", {
  providerEvidence: [
    { domain: "fixture-conflict.example", legalName: "Fixture Conflict LLC", verified: true },
    { domain: "fixture-conflict.example", legalName: "Different Fixture Ltd", verified: true },
  ],
});
assert.equal(conflicting.primaryIdentity.conflicts[0].field, "legalName");

const cDataNoEvidence = resolveBusinessIdentity("c-data.co.il");
assert.equal(cDataNoEvidence.primaryIdentity.kind, "temporary");
assert.deepEqual(cDataNoEvidence.primaryIdentity.domains, ["c-data.co.il"]);
assert.equal(cDataNoEvidence.primaryIdentity.legalName, undefined);
assert.equal(cDataNoEvidence.primaryIdentity.verified, false);

console.log("identity validation passed");
