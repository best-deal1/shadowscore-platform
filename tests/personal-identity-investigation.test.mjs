import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  IDENTITY_EVIDENCE_BUCKET,
  identityObjective,
  identityReadinessIssues,
  independentSourceCount,
  normalizeIdentitySignals,
  preserveContradictoryContacts,
  scoreIdentityCandidate,
} from "../lib/personalIdentity.ts";

const signals = (input) => normalizeIdentitySignals(input);

for (const [label, input, expected] of [
  ["email-only", { emails: ["Person@Example.com"] }, "submitted email address"],
  ["phone-only", { phones: ["+1 (212) 555-0100"] }, "submitted phone number"],
  ["name-only", { names: ["Ada Lovelace"] }, "submitted name"],
  ["username-only", { usernames: ["@ada"] }, "submitted username"],
]) test(`${label} personal investigation has an accurate objective`, () => assert.match(identityObjective(signals(input)), new RegExp(expected)));

test("combined investigation retains every normalized signal", () => {
  const result = signals({ emails: ["A@Example.com"], phones: ["+1 212-555-0100"], names: ["Ada Lovelace"], usernames: ["@Ada"] });
  assert.deepEqual(result, { emails: ["a@example.com"], phones: ["+12125550100"], names: ["Ada Lovelace"], usernames: ["ada"], referenceImages: [] });
  assert.match(identityObjective(result), /same person/);
});

test("contradictory email and phone identifiers are preserved", () => {
  const evidence = preserveContradictoryContacts([
    { type: "email", value: "first@example.com", sourceUrl: "https://a.example/1", sourceFamily: "registry" },
    { type: "email", value: "other@example.com", sourceUrl: "https://a.example/1", sourceFamily: "registry" },
    { type: "phone", value: "+12125550100", sourceUrl: "https://b.example/2", sourceFamily: "profile" },
    { type: "phone", value: "+12125550199", sourceUrl: "https://b.example/2", sourceFamily: "profile" },
  ]);
  assert.equal(evidence.length, 4);
});

test("independent sources deduplicate by source family, not result count", () => {
  const evidence = [{ sourceUrl: "https://a.example/1", sourceFamily: "registry" }, { sourceUrl: "https://a.example/2", sourceFamily: "registry" }, { sourceUrl: "https://b.example/x", sourceFamily: "social" }];
  assert.equal(independentSourceCount(evidence), 2);
  assert.equal(scoreIdentityCandidate({ matchedSignalTypes: ["email", "username"], evidence, contradictions: 0 }), 68);
});

test("personal identity workflow fails closed until every readiness control is verified", () => {
  assert.equal(identityReadinessIssues({}).length, 5);
  assert.deepEqual(identityReadinessIssues({ NEXT_PUBLIC_PERSONAL_IDENTITY_ENABLED: "true", PERSONAL_IDENTITY_ENABLED: "true", IDENTITY_MIGRATION_APPLIED: "true", IDENTITY_EVIDENCE_BUCKET_READY: "true", IDENTITY_STORAGE_POLICIES_VERIFIED: "true" }), []);
});

test("canonical migration and upload route use only identity-evidence with owner policies", async () => {
  const [migration, route, intake, checkout] = await Promise.all([
    readFile(new URL("../supabase/migrations/20260824010000_personal_identity_intake.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/api/identity-evidence/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/intake/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/investigationCheckout.ts", import.meta.url), "utf8"),
  ]);
  assert.equal(IDENTITY_EVIDENCE_BUCKET, "identity-evidence");
  assert.match(migration, /add column if not exists identity_signals/);
  assert.match(migration, /storage\.foldername\(name\).*auth\.uid/s);
  assert.equal(`${migration}${route}${intake}`.includes(["identity", "references"].join("-")), false);
  assert.match(route, /authenticated\.user\.id/);
  assert.match(intake, /Person&apos;s email/);
  assert.match(intake, /"Personal Identity"/);
  assert.match(checkout, /authenticatedEmail/);
});

test("legacy email and business scan modes remain accepted", async () => {
  const route = await readFile(new URL("../app/api/intakes/route.ts", import.meta.url), "utf8");
  assert.match(route, /"website", "marketplace", "evidence", "personal"/);
  assert.match(route, /body\.scanMode === "personal"/);
});
