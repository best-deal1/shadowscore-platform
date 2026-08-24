import test from "node:test";
import assert from "node:assert/strict";
import { independentEvidenceSource, observedContactIdentifiers, rankExternalIdentityCandidates } from "../lib/providers/externalIdentityProvider.ts";
import { identityWorkflowReadiness, investigationObjective, productForInvestigation } from "../lib/identity/investigation.ts";

const candidate = (matchedIdentifiers, display = "Taylor Reed") => ({ platform: "GitHub", profileUrl: "https://github.com/taylor", observedDisplayName: display, matchedIdentifiers, matchType: "username", status: "Candidate", matchLevel: "unverified_candidate", matchBasis: "Evidence", confidence: 0, evidenceUrl: "https://github.com/taylor", evidenceQuery: "query", evidenceSnippet: "snippet", methods: ["search"], sourceProvider: "Brave Search", evidenceReference: "https://github.com/taylor", discoveryPath: [], supportingEvidence: [], candidateDiscoveryConfidence: 1, identityAttributionConfidence: null });

test("candidate evidence preserves a matching username and conflicting email", () => {
  assert.deepEqual(observedContactIdentifiers("@taylor contact other@example.net"), ["other@example.net"]);
  const [ranked] = rankExternalIdentityCandidates("taylor@example.com", [candidate(["taylor", "other@example.net"])]);
  assert.deepEqual(ranked.matchedIdentifiers, ["taylor", "other@example.net"]);
});

test("candidate evidence preserves a matching name and conflicting phone", () => {
  const identifiers = observedContactIdentifiers("Taylor Reed, call +1 (212) 555-0198");
  assert.deepEqual(identifiers, ["+1 (212) 555-0198"]);
  assert.deepEqual(rankExternalIdentityCandidates("taylor@example.com", [candidate(identifiers)])[0].matchedIdentifiers, identifiers);
});

test("all contradictory contact identifiers survive a matching identifier", () => {
  assert.deepEqual(observedContactIdentifiers("taylor@example.com, other@example.net, +44 20 7946 0958"), ["taylor@example.com", "other@example.net", "+44 20 7946 0958"]);
});

test("query variants pointing to one profile have one independent source", () => {
  const sources = new Set(["https://github.com/taylor?utm_source=brave", "https://www.github.com/taylor#profile"].map(independentEvidenceSource));
  assert.equal(sources.size, 1);
});

test("objectives describe each supported identity intake", () => {
  assert.match(investigationObjective({ email: "a@example.com" }), /email address/);
  assert.match(investigationObjective({ phone: "+12125550198" }), /phone number/);
  assert.match(investigationObjective({ name: "Taylor Reed" }), /submitted name/);
  assert.match(investigationObjective({ username: "taylor" }), /username/);
  assert.match(investigationObjective({ name: "Taylor Reed", phone: "+12125550198" }), /same person/);
});

test("checkout product labels distinguish identity and business workflows", () => {
  assert.equal(productForInvestigation("personal_identity").name, "Personal Identity Investigation");
  assert.equal(productForInvestigation("business").name, "Business Investigation");
});

test("identity workflow fails closed when schema, bucket, or policies are unavailable", () => {
  assert.equal(identityWorkflowReadiness({ PERSONAL_IDENTITY_WORKFLOW_ENABLED: "true" }).enabled, false);
  assert.equal(identityWorkflowReadiness({ PERSONAL_IDENTITY_WORKFLOW_ENABLED: "true", PERSONAL_IDENTITY_SCHEMA_READY: "true", PERSONAL_IDENTITY_STORAGE_READY: "true", PERSONAL_IDENTITY_STORAGE_POLICIES_READY: "true" }).enabled, true);
});

test("migration provisions the nullable intake column, private bucket, and owner policies", async () => {
  const sql = await (await import("node:fs/promises")).readFile(new URL("../supabase/migrations/20260824000000_personal_identity_intake_and_storage.sql", import.meta.url), "utf8");
  assert.match(sql, /add column if not exists identity_signals jsonb/);
  assert.match(sql, /'identity-evidence', 'identity-evidence', false/);
  for (const operation of ["select", "insert", "delete"]) assert.match(sql, new RegExp(`for ${operation} to authenticated`));
});
