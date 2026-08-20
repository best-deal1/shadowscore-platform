import assert from "node:assert/strict";
import test from "node:test";
import { discoverExternalIdentityCandidates, EmailIntelligenceProvider, ExternalIdentityProvider } from "../lib/providers/externalIdentityProvider.ts";
import { resolveFirstPartyEntities } from "../lib/entityResolution/firstParty.ts";
import { createExecutionPlan } from "../lib/orchestrator/planner.ts";
import { buildEvidenceItems } from "../lib/evidence/index.ts";

const EMAIL = "nastikmastik358@gmail.com";

function responseFor(query) {
  if (query.includes(`\"${EMAIL}\"`)) return [{ title: "Public profile", url: "https://www.facebook.com/nastikmastik", description: `Contact ${EMAIL}` }];
  if (query.includes("nastikmastik358")) return [{ title: "nastikmastik", url: "https://www.facebook.com/nastikmastik", description: "Public profile" }];
  return [];
}

test("public search preserves the query and snippet supporting an exact-email profile match", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const query = url.searchParams.get("q") || "";
    return Response.json({ web: { results: responseFor(query) } });
  };
  try {
    const candidates = await discoverExternalIdentityCandidates(EMAIL, "test-key", new AbortController().signal);
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].platform, "Facebook");
    assert.equal(candidates[0].profileUrl, "https://www.facebook.com/nastikmastik");
    assert.equal(candidates[0].matchLevel, "exact_match");
    assert.ok(candidates[0].confidence >= 90);
    assert.match(candidates[0].matchBasis, /exact submitted email/i);
    assert.match(candidates[0].evidenceQuery, /nastikmastik358@gmail\.com/);
    assert.match(candidates[0].evidenceSnippet, /nastikmastik358@gmail\.com/);
    assert.match(candidates[0].evidenceUrl, /^https:\/\/search\.brave\.com\/search\?/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("repeated username searches do not upgrade an unverified candidate", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const query = new URL(String(input)).searchParams.get("q") || "";
    return Response.json({ web: { results: query.includes("nastikmastik358") && !query.includes(EMAIL) ? [{ title: "candidate", url: "https://instagram.com/nastikmastik358", description: "Public profile" }] : [] } });
  };
  try {
    const candidates = await discoverExternalIdentityCandidates(EMAIL, "test-key", new AbortController().signal);
    assert.equal(candidates[0].matchLevel, "unverified_candidate");
    assert.equal(candidates[0].confidence, 30);
    assert.match(candidates[0].matchBasis, /candidate only/i);
    assert.ok(candidates[0].methods.length >= 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("unverified candidates are placeholder evidence and cannot enter verified evidence scoring", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.BRAVE_SEARCH_API_KEY;
  process.env.BRAVE_SEARCH_API_KEY = "test-key";
  globalThis.fetch = async () => Response.json({ web: { results: [{ title: "candidate", url: "https://instagram.com/nastikmastik358", description: "Public profile" }] } });
  try {
    const result = await new ExternalIdentityProvider().execute({ intakeId: "i-1", scanMode: "website", target: EMAIL, requestedTarget: EMAIL, platform: "website", fileNames: [], visibleSignalCategories: [] });
    assert.equal(result.status, "completed");
    assert.equal(result.evidence[0].type, "placeholder");
    assert.equal(result.findings.length, 0);
    const items = buildEvidenceItems([result]);
    assert.ok(items.every((item) => item.category !== "Verified"));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.BRAVE_SEARCH_API_KEY; else process.env.BRAVE_SEARCH_API_KEY = originalKey;
  }
});

test("free mailbox email and common aliases are not crawled as first-party business evidence", async () => {
  for (const email of [EMAIL, "user@me.com", "user@yahoo.co.uk", "user@hotmail.fr", "user@msn.com"]) {
    let fetches = 0;
    const result = await resolveFirstPartyEntities(email, { fetch: async () => { fetches += 1; return new Response("unexpected"); } });
    assert.equal(result.inputType, "email");
    assert.equal(result.discovery.totalUrlsFetched, 0, email);
    assert.equal(result.discovery.failures.length, 0, email);
    assert.equal(fetches, 0, email);
  }
});

test("public mailbox plan runs email intelligence and external discovery without domain infrastructure", () => {
  const plan = createExecutionPlan({ targetType: "Email", normalizedTarget: EMAIL, confidence: 1, reasoning: "email", detectedPlatform: null });
  assert.deepEqual(plan.executionPlan.map((step) => step.engineId), ["email-intelligence", "external-identity"]);
});

test("corporate email preserves runnable domain fallback alongside identity discovery", () => {
  const plan = createExecutionPlan({ targetType: "Email", normalizedTarget: "moshez@s-horowitz.com", confidence: 1, reasoning: "email", detectedPlatform: null });
  assert.deepEqual(plan.executionPlan.map((step) => step.engineId), ["email-intelligence", "external-identity", "domain"]);
});

test("email intelligence is always runnable without external credentials", async () => {
  const result = await new EmailIntelligenceProvider().execute({ intakeId: "i-1", scanMode: "website", target: EMAIL, requestedTarget: EMAIL, platform: "website", fileNames: [], visibleSignalCategories: [] });
  assert.equal(result.status, "completed");
  assert.equal(result.metadata.publicMailbox, true);
  assert.equal(result.evidence[0].type, "placeholder");
});

test("missing search credentials is explicit technical unavailability and does not fabricate identity evidence", async () => {
  const original = process.env.BRAVE_SEARCH_API_KEY;
  delete process.env.BRAVE_SEARCH_API_KEY;
  try {
    const result = await new ExternalIdentityProvider().execute({ intakeId: "i-1", scanMode: "website", target: EMAIL, requestedTarget: EMAIL, platform: "website", fileNames: [], visibleSignalCategories: [] });
    assert.equal(result.status, "skipped");
    assert.equal(result.findings.length, 0);
    assert.equal(result.evidence.length, 1);
    assert.equal(result.metadata.failureReason, "Unavailable");
    assert.match(result.errors[0], /BRAVE_SEARCH_API_KEY/);
    assert.match(result.errors[0], /unavailable/i);
  } finally {
    if (original === undefined) delete process.env.BRAVE_SEARCH_API_KEY; else process.env.BRAVE_SEARCH_API_KEY = original;
  }
});
