import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  IDENTITY_EVIDENCE_BUCKET,
  identityObjective,
  identityReadinessIssues,
  independentSourceCount,
  normalizeIdentitySignals,
  normalizeIntakeIdentitySignals,
  preserveContradictoryContacts,
  scoreIdentityCandidate,
} from "../lib/personalIdentity.ts";
import { createIntake } from "../lib/workspace.ts";
import { ExternalIdentityProvider } from "../lib/providers/externalIdentityProvider.ts";

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

test("legacy personal targets recover identity signals only when structured signals are absent", () => {
  assert.deepEqual(normalizeIntakeIdentitySignals(undefined, { target: "Sivan.Efrat.Brandes@gmail.com", email: "customer@example.com" }).emails, ["sivan.efrat.brandes@gmail.com"]);
  assert.deepEqual(normalizeIntakeIdentitySignals({ usernames: ["@submitted"] }, { target: "legacy@example.com" }), { emails: [], phones: [], names: [], usernames: ["submitted"], referenceImages: [] });
});

test("email-only intake persists signals and completes discovery, resolver, and report presentation", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.BRAVE_SEARCH_API_KEY;
  process.env.BRAVE_SEARCH_API_KEY = "fixture-key";
  globalThis.fetch = async (input) => {
    const query = new URL(String(input)).searchParams.get("q") || "";
    return Response.json({ web: { results: query.includes("sivan.efrat.brandes@gmail.com") ? [{
      title: "Sivan Efrat Brandes | LinkedIn",
      url: "https://linkedin.com/in/sivan-efrat-brandes",
      description: "Sivan Efrat Brandes. Contact sivan.efrat.brandes@gmail.com.",
    }] : [] } });
  };
  try {
    const intake = await createIntake({ userId: "identity-e2e", email: "buyer@example.com", name: "Buyer", startedAt: "2026-08-24T00:00:00.000Z" }, {
      scanMode: "personal", target: "sivan.efrat.brandes@gmail.com", platform: "Personal Identity", email: "buyer@example.com",
      identitySignals: undefined, fileNames: [], visibleSignalCategories: [],
    });
    assert.deepEqual(intake.identitySignals?.emails, ["sivan.efrat.brandes@gmail.com"]);

    const external = await new ExternalIdentityProvider().execute({ intakeId: intake.intakeId, scanMode: intake.scanMode, target: intake.target, requestedTarget: intake.target, email: intake.identitySignals?.emails[0], identitySignals: intake.identitySignals, platform: intake.platform, fileNames: [], visibleSignalCategories: [] });
    const candidate = external.metadata.externalIdentityCandidates[0];
    assert.equal(external.metadata.submittedEmail, "sivan.efrat.brandes@gmail.com");
    assert.ok(Number(external.metadata.identityDiscoverySearches.length) > 0);
    assert.equal(candidate?.profileUrl, "https://linkedin.com/in/sivan-efrat-brandes");
    assert.equal(candidate?.resolutionOutcome, "MATCH");
    assert.ok(candidate?.resolverMatchedSignals?.some((signal) => signal.attribute === "email"));
    assert.equal(candidate?.sourceProvenance?.[0].family, "linkedin.com");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.BRAVE_SEARCH_API_KEY; else process.env.BRAVE_SEARCH_API_KEY = originalKey;
  }
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

test("production-shaped persisted personal email report uses only identity presentation", async () => {
  const [presentation, pipeline, migration, intake] = await Promise.all([
    readFile(new URL("../components/report/PersonalIdentityReport.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/reportPipeline.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260824010000_personal_identity_intake.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/intake/page.tsx", import.meta.url), "utf8"),
  ]);
  for (const label of ["Person Under Review", "Personal Identity Investigation", "Submitted Identity Signals", "Public Identity Candidates", "Identity Matching Evidence", "Contradictory Identifiers", "Source Provenance", "Independent source count", "Identity confidence", "Verification status", "Person-Specific Next Actions", "Unverified Candidate", "Discovery relevance", "Resolver-backed identity evidence score", "Matched signals", "Conflicting signals", "Resolver outcome", "Final ranking", "Evidence sources"]) assert.match(presentation, new RegExp(label, "i"));
  for (const forbidden of ["commercial trustworthiness", "DNS", "WHOIS", "SSL/TLS", "Hosting", "Domain registration", "Legal business records", "Company ownership", "Marketplace seller verification", "Business Under Review", "Business Identity"]) assert.doesNotMatch(presentation, new RegExp(forbidden, "i"));
  assert.match(pipeline, /intake\.scanMode === "personal"[\s\S]*email-intelligence[\s\S]*external-identity/);
  assert.match(pipeline, /Personal scan mode is authoritative/);
  assert.match(pipeline, /businessNarrative: intake\.scanMode === "personal" \? undefined/);
  assert.match(pipeline, /decision: intake\.scanMode === "personal" \? undefined/);
  assert.match(pipeline, /scorecard: intake\.scanMode === "personal" \? undefined/);
  assert.match(migration, /drop constraint if exists intakes_scan_mode_check/);
  assert.match(migration, /scan_mode in \('website', 'marketplace', 'evidence', 'personal'\)/);
  assert.match(migration, /validate constraint intakes_scan_mode_check/);
  assert.match(intake, /Personal Identity Investigation \| ShadowScore/);
});

test("candidate presentation cannot promote discovery relevance without resolver matches", async () => {
  const presentation = await readFile(new URL("../components/report/PersonalIdentityReport.tsx", import.meta.url), "utf8");
  assert.match(presentation, /const evidenceScore = matched\.length \? candidate\.resolutionEvidenceScore \|\| 0 : 0/);
  assert.match(presentation, /const verified = candidate\.resolutionOutcome === "MATCH" && matched\.length > 0/);
  assert.match(presentation, /No positive resolver evidence/);
  assert.match(presentation, /Not returned by the source/);
});
