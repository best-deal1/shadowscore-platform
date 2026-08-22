import assert from "node:assert/strict";
import test from "node:test";
import { discoverExternalIdentityCandidates, EmailIntelligenceProvider, ExternalIdentityProvider } from "../lib/providers/externalIdentityProvider.ts";
import { resolveFirstPartyEntities } from "../lib/entityResolution/firstParty.ts";
import { createExecutionPlan } from "../lib/orchestrator/planner.ts";
import { buildEvidenceItems } from "../lib/evidence/index.ts";
import { buildIdentityProfile } from "../lib/identityEngine.ts";
import { buildBusinessIntelligence } from "../lib/businessIntelligence/index.ts";
import { correlateEvidence } from "../lib/correlation/index.ts";
import { buildInvestigationIntelligence } from "../lib/investigationIntelligence/index.ts";
import { readFile } from "node:fs/promises";

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
    assert.equal(candidates[0].status, "Candidate");
    assert.deepEqual(candidates[0].matchedIdentifiers, [EMAIL]);
    assert.equal(candidates[0].sourceProvider, "Brave Search");
    assert.equal(candidates[0].confidence, 75);
    assert.match(candidates[0].matchBasis, /exact submitted email/i);
    assert.match(candidates[0].evidenceQuery, /nastikmastik358@gmail\.com/);
    assert.match(candidates[0].evidenceSnippet, /nastikmastik358@gmail\.com/);
    assert.match(candidates[0].evidenceUrl, /^https:\/\/search\.brave\.com\/search\?/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a longer different email token cannot become an exact submitted-email match", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ web: { results: [{ title: "Different person", url: "https://facebook.com/notalice", description: "Contact notalice@example.com" }] } });
  try {
    const candidates = await discoverExternalIdentityCandidates("alice@example.com", "test-key", new AbortController().signal);
    assert.ok(candidates.length > 0);
    assert.ok(candidates.every((candidate) => candidate.matchLevel === "unverified_candidate"));
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

test("unverified candidates stay out of verified evidence and identity social facts", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.BRAVE_SEARCH_API_KEY;
  process.env.BRAVE_SEARCH_API_KEY = "test-key";
  globalThis.fetch = async () => Response.json({ web: { results: [{ title: "candidate", url: "https://instagram.com/nastikmastik358", description: "Public profile" }] } });
  try {
    const result = await new ExternalIdentityProvider().execute({ intakeId: "i-1", scanMode: "website", target: EMAIL, requestedTarget: EMAIL, platform: "website", fileNames: [], visibleSignalCategories: [] });
    assert.equal(result.status, "completed");
    assert.equal(result.evidence[0].type, "search_result");
    assert.match(result.evidence[0].value, /https:\/\/instagram\.com\/nastikmastik358/);
    assert.equal(result.findings.length, 0);
    const items = buildEvidenceItems([result]);
    assert.ok(items.every((item) => item.category !== "Verified"));
    const profile = buildIdentityProfile({ providerResults: [result], target: EMAIL, generatedAt: new Date().toISOString() });
    assert.equal(profile.businessIdentity.socialPresence.confidence, "Not Found");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.BRAVE_SEARCH_API_KEY; else process.env.BRAVE_SEARCH_API_KEY = originalKey;
  }
});

test("production email candidate remains visible without creating a false identity conflict", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.BRAVE_SEARCH_API_KEY;
  process.env.BRAVE_SEARCH_API_KEY = "test-key";
  globalThis.fetch = async (input) => {
    const query = new URL(String(input)).searchParams.get("q") || "";
    return Response.json({ web: { results: responseFor(query) } });
  };
  try {
    const emailResult = await new EmailIntelligenceProvider().execute({ intakeId: "acceptance", scanMode: "website", target: EMAIL, requestedTarget: EMAIL, platform: "website", fileNames: [], visibleSignalCategories: [] });
    const identityResult = await new ExternalIdentityProvider().execute({ intakeId: "acceptance", scanMode: "website", target: EMAIL, requestedTarget: EMAIL, platform: "website", fileNames: [], visibleSignalCategories: [] });
    const candidate = identityResult.metadata.externalIdentityCandidates[0];
    assert.equal(candidate.profileUrl, "https://www.facebook.com/nastikmastik");
    assert.equal(candidate.status, "Candidate");
    assert.notEqual(candidate.status, "Verified");
    assert.equal(candidate.observedDisplayName, "Public profile");
    assert.notEqual(candidate.observedDisplayName, "nastikmastik358");
    const providerResults = [emailResult, identityResult];
    const businessIntelligence = buildBusinessIntelligence(providerResults);
    assert.equal(businessIntelligence.findings.some((finding) => /Conflicting identity records/i.test(finding.title)), false);
    const evidenceItems = buildEvidenceItems(providerResults);
    const correlationSummary = correlateEvidence({ evidenceItems, targetType: "email" });
    const intelligence = buildInvestigationIntelligence({ evidenceItems, correlationSummary, businessFindings: businessIntelligence.findings, knowledgeGraph: { entities: [], relationships: [] } });
    assert.equal(intelligence.contradictions.length, 0);
    assert.notEqual(intelligence.decisionSupport.outcome, "Do Not Proceed");
    const reportSource = await readFile(new URL("../components/report/ExecutiveIntelligenceReport.tsx", import.meta.url), "utf8");
    assert.match(reportSource, /Public Identity Candidates/);
    assert.match(reportSource, /candidate\.profileUrl/);
    assert.match(reportSource, /candidate\.evidenceReference/);
    assert.match(reportSource, /candidate\.status/);
    const pipelineSource = await readFile(new URL("../lib/reportPipeline.ts", import.meta.url), "utf8");
    assert.match(pipelineSource, /investigationType: emailInvestigation \? "EMAIL"/);
    assert.match(pipelineSource, /intake\.scanMode === "website" && !emailInvestigation/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.BRAVE_SEARCH_API_KEY; else process.env.BRAVE_SEARCH_API_KEY = originalKey;
  }
});

test("free mailbox email and common aliases are not crawled as first-party business evidence", async () => {
  for (const email of [EMAIL, "user@me.com", "user@yahoo.co.uk", "user@yahoo.com.br", "user@hotmail.fr", "user@msn.com"]) {
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

test("Anastasia golden path discovers kuki_nesti_ch without increasing attribution confidence", async () => {
  const queries = [];
  const search = async (query) => {
    queries.push(query);
    if (query.includes("kuki_nesti_ch")) return [{ title: "@kuki_nesti_ch • Instagram", url: "https://www.instagram.com/kuki_nesti_ch/", description: "kuki_nesti_ch profile" }];
    if (query.includes("Nastik") && !query.includes("nastikmastik358")) return [{ title: "Kuki Nesti | Instagram", url: "https://www.instagram.com/kuki_nesti_ch/", description: "Public profile for Nastik" }];
    if (query.includes("nastikmastik358")) return [{ title: "Facebook profile A", url: "https://www.facebook.com/nastikmastik", description: "Alias: Nastik" }];
    return [];
  };
  const { discoverExternalIdentityGraph } = await import("../lib/providers/externalIdentityProvider.ts");
  const graph = await discoverExternalIdentityGraph(EMAIL, "test-key", new AbortController().signal, { search, limits: { maxSearches: 10, maxIdentifiers: 8 } });
  const instagram = graph.allCandidates.find((candidate) => candidate.profileUrl === "https://www.instagram.com/kuki_nesti_ch");
  assert.ok(instagram);
  assert.equal(instagram.matchType, "alias");
  assert.notEqual(instagram.status, "Verified");
  assert.equal(instagram.confidence, 25);
  assert.deepEqual(instagram.matchedIdentifiers, ["nastik"]);
  assert.match(instagram.discoveryPath.join(" -> "), /Facebook profile A.*Nastik.*Instagram/s);
  assert.equal(queries.some((query) => query.includes("kuki_nesti_ch")), true);
  const handleEdge = graph.edges.find((edge) => edge.to === "kuki_nesti_ch" && edge.evidence.derivation === "social_url");
  assert.ok(handleEdge);
  assert.equal(handleEdge.relation, "discovery_lead");
  assert.match(handleEdge.evidence.snippet, /Kuki Nesti/);
  assert.ok(graph.edges.every((edge) => edge.evidence.query && edge.evidence.url && edge.evidence.snippet));
  assert.ok(graph.metrics.searchCount <= 10);
  assert.ok(graph.metrics.maxHopReached <= 3);
});

test("submitted email echoes cannot create credibility support", () => {
  const echoed = (providerId) => ({ providerId, providerName: providerId, providerVersion: "1", status: "completed", startedAt: "2026-01-01", completedAt: "2026-01-01", durationMs: 1, errors: [], findings: [], evidence: [], metadata: { submittedEmail: EMAIL } });
  const result = buildBusinessIntelligence([echoed("email-intelligence"), echoed("external-identity")]);
  assert.equal(result.findings.some((finding) => finding.direction === "supports_credibility"), false);
  assert.equal(result.evidenceCount, 0);
});


test("URL and title handles are discovery leads, not corroborated or verified identity evidence", async () => {
  const queries = [];
  const { discoverExternalIdentityGraph } = await import("../lib/providers/externalIdentityProvider.ts");
  const graph = await discoverExternalIdentityGraph("john.smith@example.com", "key", new AbortController().signal, {
    search: async (query) => {
      queries.push(query);
      if (query.includes("john.smith")) return [{ title: "John Smith - Facebook", url: "https://facebook.com/johnsmith", description: "Public profile" }];
      return [{ title: "Unrelated profile", url: "https://instagram.com/unrelated", description: "John Smith" }];
    },
  });
  assert.equal(queries.some((query) => /"John Smith"|"johnsmith"/i.test(query)), true);
  const leadEdges = graph.edges.filter((edge) => edge.relation === "discovery_lead");
  assert.ok(leadEdges.some((edge) => edge.to === "johnsmith" && edge.evidence.derivation === "social_url"));
  assert.equal(graph.edges.some((edge) => edge.relation === "verified_identifier"), false);
  assert.equal(graph.edges.some((edge) => edge.to === "johnsmith" && edge.relation === "corroborated_identifier"), false);
  assert.ok(graph.allCandidates.every((candidate) => candidate.matchedIdentifiers.length === 0));
  assert.ok(graph.allCandidates.every((candidate) => candidate.status === "Candidate" && candidate.confidence <= 30));
});

test("Brave query variants do not corroborate or inflate the same candidate", async () => {
  const { discoverExternalIdentityGraph } = await import("../lib/providers/externalIdentityProvider.ts");
  const graph = await discoverExternalIdentityGraph(EMAIL, "key", new AbortController().signal, {
    search: async () => [{ title: "Public profile", url: "https://facebook.com/repeated", description: `Contact ${EMAIL}` }],
  });
  const candidate = graph.allCandidates[0];
  assert.ok(candidate.supportingEvidence.length > 1);
  assert.equal(candidate.status, "Candidate");
  assert.equal(candidate.confidence, 75);
  assert.deepEqual(candidate.matchedIdentifiers, [EMAIL]);
  assert.equal(candidate.evidenceReference, candidate.evidenceUrl);
});

test("login and search result pages are rejected as social-profile candidates", async () => {
  const { discoverExternalIdentityGraph } = await import("../lib/providers/externalIdentityProvider.ts");
  const graph = await discoverExternalIdentityGraph("subject@example.com", "key", new AbortController().signal, {
    search: async () => [
      { title: "Sign in", url: "https://instagram.com/accounts/login", description: "subject@example.com" },
      { title: "Search", url: "https://facebook.com/search/people", description: "subject@example.com" },
      { title: "Profile", url: "https://instagram.com/valid_profile", description: "subject@example.com" },
    ],
  });
  assert.deepEqual(graph.allCandidates.map((candidate) => candidate.profileUrl), ["https://instagram.com/valid_profile"]);
});

test("identifier provenance is preserved while its follow-up search is deduplicated", async () => {
  const queries = [];
  const { discoverExternalIdentityGraph } = await import("../lib/providers/externalIdentityProvider.ts");
  const graph = await discoverExternalIdentityGraph(EMAIL, "key", new AbortController().signal, {
    search: async (query) => {
      queries.push(query);
      if (query.includes("SharedAlias")) return [];
      return [
        { title: "Profile one", url: "https://facebook.com/one", description: "Alias: SharedAlias" },
        { title: "Profile two", url: "https://instagram.com/two", description: `Alias: SharedAlias, contact ${EMAIL}` },
      ];
    },
    limits: { maxSearches: 8, maxIdentifiers: 4 },
  });
  const aliasEdges = graph.edges.filter((edge) => edge.relation === "corroborated_identifier" && edge.to.toLowerCase() === "sharedalias");
  assert.ok(aliasEdges.some((edge) => edge.from === "https://facebook.com/one"));
  assert.ok(aliasEdges.some((edge) => edge.from === "https://instagram.com/two"));
  assert.equal(queries.filter((query) => query.includes("SharedAlias")).length, 1);
});

test("an aborted late search returns the partial graph", async () => {
  const controller = new AbortController();
  let calls = 0;
  const { discoverExternalIdentityGraph } = await import("../lib/providers/externalIdentityProvider.ts");
  const graph = await discoverExternalIdentityGraph(EMAIL, "key", controller.signal, {
    search: async () => {
      calls += 1;
      if (calls === 1) return [{ title: "Exact result", url: "https://facebook.com/exact", description: EMAIL }];
      controller.abort();
      throw new DOMException("Aborted", "AbortError");
    },
  });
  assert.equal(graph.allCandidates.length, 1);
  assert.equal(graph.metrics.partial, true);
});
