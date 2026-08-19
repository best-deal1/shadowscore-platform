import assert from "node:assert/strict";
import test from "node:test";
import { discoverExternalIdentityCandidates, ExternalIdentityProvider } from "../lib/providers/externalIdentityProvider.ts";
import { resolveFirstPartyEntities } from "../lib/entityResolution/firstParty.ts";
import { createExecutionPlan } from "../lib/orchestrator/planner.ts";

const EMAIL = "nastikmastik358@gmail.com";

function responseFor(query) {
  if (query.includes(`\"${EMAIL}\"`)) return [{ title: "Public profile", url: "https://www.facebook.com/nastikmastik", description: `Contact ${EMAIL}` }];
  if (query.includes("nastikmastik358")) return [{ title: "nastikmastik", url: "https://www.facebook.com/nastikmastik", description: "Public profile" }];
  return [];
}

test("public search can surface an evidence-backed social profile without hardcoding identity", async () => {
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
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("username-only discovery stays an unverified candidate", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const query = new URL(String(input)).searchParams.get("q") || "";
    return Response.json({ web: { results: query.includes("profile") ? [{ title: "candidate", url: "https://instagram.com/nastikmastik358", description: "Public profile" }] : [] } });
  };
  try {
    const candidates = await discoverExternalIdentityCandidates(EMAIL, "test-key", new AbortController().signal);
    assert.equal(candidates[0].matchLevel, "unverified_candidate");
    assert.equal(candidates[0].confidence, 30);
    assert.match(candidates[0].matchBasis, /candidate only/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("free mailbox email does not crawl the mailbox provider as first-party business evidence", async () => {
  let fetches = 0;
  const result = await resolveFirstPartyEntities(EMAIL, { fetch: async () => { fetches += 1; return new Response("unexpected"); } });
  assert.equal(result.inputType, "email");
  assert.equal(result.resolvedDomain, "gmail.com");
  assert.equal(result.discovery.totalUrlsFetched, 0);
  assert.equal(result.discovery.failures.length, 0);
  assert.equal(fetches, 0);
});

test("email execution plan prioritizes external identity discovery and does not run domain infrastructure against mailbox provider", () => {
  const plan = createExecutionPlan({ targetType: "Email", normalizedTarget: EMAIL, confidence: 1, reasoning: "email", detectedPlatform: null });
  assert.deepEqual(plan.executionPlan.map((step) => step.engineId), ["external-identity", "email-intelligence"]);
});

test("missing search credentials is explicit and does not fabricate evidence", async () => {
  const original = process.env.BRAVE_SEARCH_API_KEY;
  delete process.env.BRAVE_SEARCH_API_KEY;
  try {
    const result = await new ExternalIdentityProvider().execute({ intakeId: "i-1", scanMode: "website", target: EMAIL, requestedTarget: EMAIL, platform: "website", fileNames: [], visibleSignalCategories: [] });
    assert.equal(result.status, "skipped");
    assert.equal(result.findings.length, 0);
    assert.equal(result.evidence.length, 1);
    assert.match(result.errors[0], /BRAVE_SEARCH_API_KEY/);
  } finally {
    if (original === undefined) delete process.env.BRAVE_SEARCH_API_KEY; else process.env.BRAVE_SEARCH_API_KEY = original;
  }
});
