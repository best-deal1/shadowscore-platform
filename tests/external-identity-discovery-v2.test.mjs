import assert from "node:assert/strict";
import test from "node:test";
import { discoverExternalIdentityCandidates, discoverExternalIdentityGraph, investigateEntityClues, EmailIntelligenceProvider, ExternalIdentityProvider } from "../lib/providers/externalIdentityProvider.ts";
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
    assert.equal(candidates.length, 0);
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

test("production-realistic Anastasia results require contextual expansion to discover kuki_nesti_ch", async () => {
  const queries = [];
  const noisyFirstHop = [
    { title: "nastik707 | Instagram", url: "https://instagram.com/nastik707", description: "Public profile" },
    { title: "thenastikedit | Instagram", url: "https://instagram.com/thenastikedit", description: "Creator profile" },
    { title: "c_nastik • TikTok profile", url: "https://www.tiktok.com/@c_nastik", description: "Creator videos" },
    { title: "🧡 NASTIK | Anastasia - A Bunch of Color and Coolness", url: "https://www.tiktok.com/@nastikss/video/741111", description: "Creator profile" },
    { title: "CMMS pharaon and more social results", url: "https://example.com/search-result", description: "Generic title boilerplate" },
    { title: "nastik on TikTok", url: "https://www.tiktok.com/discover/nastik", description: "Discover popular videos" },
  ];
  const search = async (query) => {
    queries.push(query);
    if (query.toLowerCase() === `"anastasia" "nastik"`) {
      return [{ title: "Kuki Nesti (@kuki_nesti_ch) | Instagram", url: "https://www.instagram.com/kuki_nesti_ch/", description: "Anastasia, known as Nastik" }];
    }
    if (query.includes("nastikmastik358")) return noisyFirstHop;
    return [];
  };
  const { discoverExternalIdentityGraph } = await import("../lib/providers/externalIdentityProvider.ts");
  const graph = await discoverExternalIdentityGraph(EMAIL, "test-key", new AbortController().signal, { search, limits: { maxSearches: 12, maxIdentifiers: 10 } });
  const instagram = graph.allCandidates.find((candidate) => candidate.profileUrl === "https://www.instagram.com/kuki_nesti_ch");
  assert.ok(instagram);
  assert.equal(instagram.matchType, "alias");
  assert.equal(instagram.status, "Candidate");
  assert.equal(instagram.confidence, 25);
  assert.deepEqual(instagram.matchedIdentifiers, []);
  assert.deepEqual(instagram.discoveryPath, [EMAIL, "NASTIK", "Anastasia", "Instagram Kuki Nesti (@kuki_nesti_ch) | Instagram"]);
  const anastasiaNastikQuery = queries.find((query) => query.toLowerCase() === `"anastasia" "nastik"`);
  assert.ok(anastasiaNastikQuery);
  const rejectedNoise = ["and", "open", "cmms", "short", "video", "with", "100k", "pharaon"];
  assert.equal(queries.some((query) => rejectedNoise.some((noise) => query === `"${noise}" "nastikmastik358"`)), false);
  const anastasiaClue = graph.clues.find((clue) => clue.normalizedValue === "anastasia");
  assert.equal(anastasiaClue.type, "person_name");
  assert.ok(anastasiaClue.qualityScore >= 80);
  assert.ok(graph.clues.some((clue) => clue.type === "username" && clue.qualityScore >= 80));
  assert.ok(anastasiaClue.queriesExecuted.includes(anastasiaNastikQuery));
  assert.equal(graph.clues.some((clue) => rejectedNoise.includes(clue.normalizedValue)), false);
  assert.equal(queries.some((query, index) => index < 4 && query.includes("kuki_nesti_ch")), false);
  assert.equal(graph.allCandidates.some((candidate) => candidate.profileUrl.includes("/discover/")), false);
  assert.ok(graph.searches.every((entry) => entry.query && Number.isInteger(entry.hop) && entry.pivot && entry.originalTargetContext.localPart === "nastikmastik358" && typeof entry.resultCount === "number" && typeof entry.producedNewIdentifiers === "boolean" && typeof entry.clueQualityScore === "number" && typeof entry.remainingBudget === "number"));
  assert.ok(graph.metrics.searchCount <= 12);
  const rankedSeed = graph.searches.find((entry) => entry.results.some((result) => result.url.includes("nastikss"))).results;
  const rich = rankedSeed.find((result) => result.url.includes("nastikss"));
  const weakResults = rankedSeed.filter((result) => /nastik707|thenastikedit|c_nastik/.test(result.url));
  const displaced = weakResults.find((result) => result.beamDecision === "OUTSIDE_BEAM");
  assert.ok(displaced);
  assert.equal(rich.canonicalDisplayName, "NASTIK");
  assert.ok(rich.previewIdentitySignals.some((signal) => signal.type === "person_name" && signal.value === "Anastasia"));
  assert.ok(rich.identityInformationValue > displaced.identityInformationValue);
  assert.ok(rich.beamRank <= 3);
  assert.equal(rich.beamDecision, "ADMITTED");
  assert.ok(rich.beamDecisionReason);
});

test("social title canonicalization tolerates platform boilerplate, emoji, bullets, particles, and non-Latin names", async () => {
  const graph = await discoverExternalIdentityGraph("signal.person@example.com", "key", new AbortController().signal, {
    search: async (query) => query.includes("signal.person") ? [
      { title: "💡 Jane Doe (@jane_d) / Posts / X", url: "https://x.com/jane_d", description: "signal.person profile" },
      { title: "Nastik🧡 (@example_handle) • Instagram photos and videos", url: "https://instagram.com/example_handle", description: "signal.person profile" },
      { title: "Ludwig van Beethoven (@ludwig_vb) • TikTok profile", url: "https://tiktok.com/@ludwig_vb", description: "signal.person profile" },
      { title: "山田 太郎 (@taro_y) • Instagram photos and videos", url: "https://instagram.com/taro_y", description: "signal.person profile" },
    ] : [],
    limits: { maxSearches: 4, maxIdentifiers: 10 },
  });
  const results = graph.searches[0].results;
  for (const [handle, name] of [["jane_d", "Jane Doe"], ["example_handle", "Nastik"], ["ludwig_vb", "Ludwig van Beethoven"], ["taro_y", "山田 太郎"]]) {
    const result = results.find((item) => item.canonicalHandle === handle);
    assert.equal(result.canonicalDisplayName, name);
    assert.ok(result.previewIdentitySignals.some((signal) => signal.value === name));
    assert.ok(Number.isFinite(result.identityInformationValue));
    assert.ok(Number.isInteger(result.beamRank));
    assert.ok(result.beamDecisionReason);
  }
});

test("company identity value displaces name-only directory siblings", async () => {
  const graph = await investigateEntityClues({ type: "unknown", value: "merchant-9021" }, async (_query, clue) => clue.hop === 0 ? [
    { title: "Northstar Works", url: "https://directory.example/company/northstar-1", description: "Company: Northstar Works" },
    { title: "Northstar Workshop", url: "https://directory.example/company/northstar-2", description: "Company: Northstar Workshop" },
    { title: "Northstar Work Ltd", url: "https://directory.example/company/northstar-3", description: "Company: Northstar Work Ltd" },
    { title: "Northstar Signal Ltd company profile", url: "https://registry.example/northstar-signal", description: "Company: Northstar Signal Ltd | Domain: northstar-signal.example | Director: Mira Vale" },
  ] : [], { maxHops: 2, maxIdentifiers: 10, maxSearches: 2 });
  const results = graph.diagnostics[0].results;
  const rich = results.at(-1);
  assert.ok(rich.previewIdentitySignals.some((signal) => signal.type === "company_name"));
  assert.ok(rich.previewIdentitySignals.some((signal) => signal.type === "domain"));
  assert.ok(rich.previewIdentitySignals.some((signal) => signal.type === "director"));
  assert.ok(rich.beamRank <= 3);
  assert.equal(rich.beamDecision, "ADMITTED");
  assert.ok(results.slice(0, 3).some((result) => result.beamDecision === "OUTSIDE_BEAM"));
  assert.ok(graph.clues.some((clue) => clue.type === "company_name" && clue.displayValue === "Northstar Signal Ltd"));
});

test("production exact result admission rejects noise and reserves a diverse beam for identity clues", async () => {
  const queries = [];
  const graph = await discoverExternalIdentityGraph(EMAIL, "key", new AbortController().signal, {
    search: async (query) => {
      queries.push(query);
      if (query === `"${EMAIL}"`) return [
        { title: "Footprints outdoors", url: "https://unrelated.example/footprints", description: "Edited version of the address and unrelated accounts @nnikass._ @c_nastik" },
        { title: "NASTIK | Anastasia", url: "https://profiles.example/nastik", description: `${EMAIL}. Person: Anastasia. Username: thenastikedit` },
        { title: "nastikss478", url: "https://instagram.com/nastikss478", description: "Unrelated public profile" },
      ];
      if (query.toLowerCase().includes('"anastasia"')) return [{ title: "Anastasia Cherevko profile", url: "https://journal.example/people/anastasia", description: "Anastasia. Instagram: kuki_nesti_ch" }];
      if (query.includes("kuki_nesti_ch")) return [{ title: "Anastasia (@kuki_nesti_ch) | Instagram", url: "https://instagram.com/kuki_nesti_ch", description: "Anastasia profile" }];
      return [];
    },
    limits: { maxSearches: 10, maxIdentifiers: 12 },
  });
  assert.equal(graph.clues.some((clue) => /footprints|edited version|nnikass|c_nastik|nastikss478/i.test(clue.displayValue)), false);
  assert.ok(graph.clues.some((clue) => clue.normalizedValue === "anastasia" && clue.type === "person_name"));
  assert.ok(queries.some((query) => query.toLowerCase().includes('"anastasia"')));
  assert.ok(graph.allCandidates.some((candidate) => candidate.profileUrl === "https://instagram.com/kuki_nesti_ch" && candidate.status === "Candidate"));
  assert.ok(graph.metrics.searchCount <= 10);
  const rejected = graph.searches.flatMap((search) => search.results).find((result) => result.url.includes("footprints"));
  assert.equal(rejected.admissionDecision, "rejected");
  assert.equal(rejected.extractedClues.length, 0);
  assert.ok(graph.searches.flatMap((search) => search.results).every((result) => Number.isFinite(result.admissionScore) && result.admissionReason && Array.isArray(result.matchedAnchors) && Number.isInteger(result.siblingRank)));
});

test("a discovered person name retains a budgeted site-restricted social search", async () => {
  const queries = [];
  const socialQuery = 'site:instagram.com OR site:tiktok.com OR site:linkedin.com "Mira Vale"';
  const graph = await discoverExternalIdentityGraph("quiet.person@example.com", "key", new AbortController().signal, {
    search: async (query) => {
      queries.push(query);
      if (query === '"quiet.person@example.com"') return [{ title: "Quiet Person directory", url: "https://directory.example/quiet-person", description: "quiet.person@example.com. Person: Mira Vale." }];
      if (query === socialQuery) return [{ title: "Mira Vale | Instagram", url: "https://instagram.com/mira_v_public", description: "Mira Vale profile" }];
      return [];
    },
    limits: { maxSearches: 6, maxIdentifiers: 8, reservedExpansionSearches: 2 },
  });

  const person = graph.clues.find((clue) => clue.type === "person_name" && clue.displayValue === "Mira Vale");
  assert.ok(person);
  assert.deepEqual(person.queriesPlanned, ['"Mira Vale" "quiet.person"', socialQuery]);
  assert.deepEqual(person.queriesExecuted, ['"Mira Vale" "quiet.person"', socialQuery]);
  assert.ok(queries.includes(socialQuery));
  assert.ok(graph.allCandidates.some((candidate) => candidate.profileUrl === "https://instagram.com/mira_v_public"));
  assert.equal(graph.metrics.searchCount, queries.length);
  assert.ok(graph.metrics.searchCount <= 6);
});

test("production seed discovery quarantines a structured first hop before later evidence finds the target handle", async () => {
  const graph = await discoverExternalIdentityGraph("nastikmastik358@gmail.com", "key", new AbortController().signal, {
    search: async (query) => {
      if (query.includes("nastikmastik358") && query.includes("profile OR social")) return [
        { title: "Anastasia (@thenastikedit) | Instagram", url: "https://instagram.com/thenastikedit", description: "Creator profile" },
        { title: "Different person", url: "https://instagram.com/random_account", description: "Unrelated public profile" },
        { title: "Footprints from the coast", url: "https://notes.example/footprints", description: "Edited prose and travel notes" },
      ];
      if (query.includes("thenastikedit")) return [{ title: "Anastasia uses @thenastikedit", url: "https://journal.example/interviews/anastasia", description: "Person: Anastasia. Instagram: nastik707" }];
      if (query.includes("nastik707")) return [{ title: "Anastasia (@nastik707) | Instagram", url: "https://instagram.com/nastik707", description: "Anastasia and @thenastikedit" }];
      return [];
    },
    limits: { maxSearches: 12, maxIdentifiers: 12 },
  });

  const seedResults = graph.searches.find((search) => search.query.includes("profile OR social")).results;
  const lead = seedResults.find((result) => result.url.includes("thenastikedit"));
  assert.equal(lead.discoveryAdmissionDecision, "DISCOVERY_ADMITTED");
  assert.equal(lead.evidenceAdmissionDecision, "REJECTED");
  assert.ok(lead.queryProvenanceContribution > 0);
  assert.deepEqual(lead.extractedEvidenceClues, []);
  assert.ok(lead.extractedDiscoveryClues.some((clue) => /Anastasia|thenastikedit/i.test(clue)));
  assert.ok(seedResults.filter((result) => result.discoveryAdmissionDecision === "DISCOVERY_ADMITTED").length <= 3);
  assert.ok(seedResults.filter((result) => /random_account|footprints/.test(result.url)).every((result) => result.discoveryAdmissionDecision === "REJECTED"));
  assert.ok(graph.searches.some((search) => search.searchIntent === "open_web_identity"));
  assert.ok(graph.searches.some((search) => search.hop > 0 && search.searchIntent === "social_profile_discovery"));
  assert.ok(graph.allCandidates.some((candidate) => candidate.profileUrl === "https://instagram.com/nastik707" && candidate.status === "Candidate"));
  assert.ok(graph.clues.filter((clue) => /anastasia|thenastikedit/i.test(clue.displayValue)).every((clue) => clue.attributionState === "discovery"));
});

test("PERSON seed discovery stays unattributed until graph-neighbor evidence", async () => {
  const graph = await investigateEntityClues({ type: "username", value: "signal_1042" }, async (_query, clue) => {
    if (clue.displayValue === "signal_1042") return [
      { title: "Mira Vale | Instagram", url: "https://instagram.com/mira_field", description: "Person: Mira Vale" },
      { title: "Unrelated profile", url: "https://instagram.com/random", description: "Unrelated public profile" },
    ];
    return [{ title: `${clue.displayValue} and signal_1042`, url: "https://directory.example/connection", description: `Person: ${clue.displayValue}` }];
  }, { maxHops: 2, maxIdentifiers: 6, maxSearches: 3 });
  const person = graph.clues.find((clue) => clue.displayValue === "Mira Vale");
  assert.equal(person.attributionState, "discovery");
  assert.equal(graph.diagnostics[0].results[0].discoveryAdmissionDecision, "DISCOVERY_ADMITTED");
  assert.equal(graph.diagnostics[0].results[0].evidenceAdmissionDecision, "REJECTED");
  assert.equal(graph.clues.some((clue) => clue.normalizedValue === "random"), false);
});

test("COMPANY seed discovery does not resolve a legal entity before registry evidence", async () => {
  const graph = await investigateEntityClues({ type: "unknown", value: "merchant-1042" }, async (_query, clue) => {
    if (clue.displayValue === "merchant-1042") return [{ title: "Northstar Lantern company profile", url: "https://directory.example/company/northstar", description: "Company: Northstar Lantern Ltd" }];
    return [{ title: `${clue.displayValue} registry record for merchant-1042`, url: "https://registry.example/northstar", description: `Company: ${clue.displayValue}. Domain: northstar.example` }];
  }, { maxHops: 2, maxIdentifiers: 6, maxSearches: 3 });
  const company = graph.clues.find((clue) => clue.displayValue === "Northstar Lantern Ltd");
  assert.equal(company.attributionState, "discovery");
  assert.equal(graph.diagnostics[0].results[0].discoveryAdmissionDecision, "DISCOVERY_ADMITTED");
  assert.equal(graph.diagnostics[0].results[0].evidenceAdmissionDecision, "REJECTED");
  assert.ok(graph.relationships.some((relationship) => relationship.from === company.id && relationship.relationship === "domain"));
});

test("PERSON and COMPANY result admission blocks similarly named unanchored pages", async () => {
  for (const seed of [{ type: "person_name", value: "Avery Rowan" }, { type: "company_name", value: "Northstar Labs" }]) {
    const graph = await investigateEntityClues(seed, async () => [
      { title: "Similar listing", url: "https://unrelated.example/listing", description: "Company: Footprint Holdings. Director: Robin Else" },
      { title: `${seed.value} record`, url: "https://registry.example/record", description: seed.type === "person_name" ? "Company: Rowan Signal Studio" : "Domain: northstar.example. Director: Mira Vale" },
    ], { maxHops: 2, maxIdentifiers: 8, maxSearches: 4 });
    assert.equal(graph.clues.some((clue) => /footprint holdings|robin else/i.test(clue.displayValue)), false);
    assert.ok(graph.diagnostics[0].results.some((result) => result.admissionDecision === "rejected" && result.extractedClues.length === 0));
    assert.ok(graph.diagnostics[0].results.some((result) => result.admissionDecision === "admitted"));
  }
});

test("unused expansion capacity falls back to omitted seed queries", async () => {
  const queries = [];
  const graph = await discoverExternalIdentityGraph("quiet.person@example.com", "key", new AbortController().signal, {
    search: async (query) => { queries.push(query); return []; },
    limits: { maxSearches: 4 },
  });
  assert.equal(graph.metrics.searchCount, 4);
  assert.deepEqual(queries, [
    '"quiet.person@example.com"',
    '"quiet.person@example.com" profile OR social',
    '"quiet.person" profile',
    '"quiet.person" site:facebook.com OR site:instagram.com OR site:linkedin.com OR site:x.com OR site:tiktok.com',
  ]);
});

test("open-web editorial evidence bridges an alias to a fuller name, handle, and later social profile", async () => {
  const queries = [];
  const graph = await discoverExternalIdentityGraph("fieldnote77@example.com", "key", new AbortController().signal, {
    search: async (query) => {
      queries.push(query);
      if (query === '"fieldnote77" profile') return [{ title: "Nora Vale | contributor", url: "https://writers.example/people/nora", description: "fieldnote77, Alias: Fieldnote" }];
      if (query.includes('\"Nora Vale\"') && (query.includes('\"fieldnote77\"') || query.includes('\"Fieldnote\"'))) return [{ title: "Nora Elise Vale | Interview", url: "https://journal.example/article/nora-vale", description: "Nora Vale, Instagram: vale_field_notes" }];
      if (query.includes("vale_field_notes") && query.includes("site:instagram.com")) return [{ title: "Nora Elise Vale (@vale_field_notes) | Instagram", url: "https://instagram.com/vale_field_notes", description: "Public profile" }];
      return [];
    },
    limits: { maxSearches: 12, maxIdentifiers: 12 },
  });
  const candidate = graph.allCandidates.find((item) => item.profileUrl === "https://instagram.com/vale_field_notes");
  assert.ok(candidate);
  assert.equal(candidate.status, "Candidate");
  assert.ok(graph.clues.some((clue) => clue.displayValue === "Nora Elise Vale" && clue.source === "https://journal.example/article/nora-vale"));
  assert.ok(graph.edges.some((edge) => edge.relation === "uses_handle_candidate" && edge.to === "vale_field_notes" && edge.evidence.sourceClass === "editorial"));
  assert.ok(graph.searches.some((entry) => entry.searchIntent === "open_web_identity"));
  assert.ok(graph.searches.some((entry) => entry.searchIntent === "graph_neighbor_expansion"));
  assert.ok(graph.searches.every((entry) => entry.prioritizationReason && Array.isArray(entry.sourceClasses) && Array.isArray(entry.extractedEntityClues)));
  assert.equal(queries.slice(0, 4).some((query) => query.includes("vale_field_notes")), false);
});

test("title names accept lowercase particles and scripts without case while rejecting noise", async () => {
  const queries = [];
  const graph = await discoverExternalIdentityGraph("composer@example.com", "key", new AbortController().signal, {
    search: async (query) => {
      queries.push(query);
      if (query === '"composer@example.com"') return [
        { title: "Ludwig van Beethoven | Facebook", url: "https://facebook.com/beethoven", description: "Composer profile" },
        { title: "山田 太郎 | Instagram", url: "https://instagram.com/yamada", description: "composer profile" },
        { title: "Open popular videos | TikTok", url: "https://tiktok.com/@noise/video/1", description: "composer" },
      ];
      return [];
    },
  });
  assert.ok(graph.clues.some((clue) => clue.type === "person_name" && clue.displayValue === "Ludwig van Beethoven"));
  assert.ok(graph.clues.some((clue) => clue.type === "person_name" && clue.displayValue === "山田 太郎"));
  assert.ok(queries.some((query) => query.includes('"Ludwig van Beethoven"')));
  assert.ok(queries.some((query) => query.includes('"山田 太郎"')));
  assert.equal(graph.clues.some((clue) => clue.normalizedValue === "open popular videos"), false);
});

test("COMPANY open-web pages bridge legal company, director, and domain graph nodes", async () => {
  const { investigateEntityClues } = await import("../lib/providers/externalIdentityProvider.ts");
  const queries = [];
  const graph = await investigateEntityClues({ type: "unknown", value: "VAT-ZZ-1042" }, async (query, clue) => {
    queries.push(query);
    if (clue.displayValue === "VAT-ZZ-1042") return [{ title: "VAT-ZZ-1042 | Legal company: Northstar Lantern Labs Ltd", url: "https://registry.example/ZZ-1042", description: "Director: Mira Vale | Domain: northstar-lantern.example | Open short video with 100k views" }];
    if (clue.displayValue === "Mira Vale" && query.includes("VAT-ZZ-1042")) return [{ title: "Related entity: Vale Signal Works Ltd", url: "https://directory.example/mira-vale", description: "Director: Mira Vale" }];
    return [];
  }, { maxHops: 3, maxIdentifiers: 10, maxSearches: 10 });
  assert.ok(graph.clues.some((clue) => clue.type === "company_name" && clue.displayValue === "Northstar Lantern Labs Ltd"));
  assert.ok(graph.clues.some((clue) => clue.type === "person_name" && clue.displayValue === "Mira Vale"));
  assert.ok(graph.clues.some((clue) => clue.type === "domain" && clue.displayValue === "northstar-lantern.example"));
  assert.ok(graph.clues.some((clue) => clue.displayValue === "Vale Signal Works Ltd"));
  assert.deepEqual(graph.relationships.find((edge) => edge.to === "company_name:vale signal works ltd")?.discoveryPath, ["VAT-ZZ-1042", "Mira Vale", "Vale Signal Works Ltd"]);
  assert.ok(queries.some((query) => query.includes('"Mira Vale"') && query.includes('"VAT-ZZ-1042"')));
  assert.ok(graph.clues.filter((clue) => ["company_name", "person_name", "domain"].includes(clue.type)).every((clue) => clue.qualityScore >= 80));
  assert.equal(graph.clues.some((clue) => ["open", "short", "video", "with", "100k"].includes(clue.normalizedValue)), false);
  assert.equal(graph.metrics.budgetExhaustionReason, "closure_reached");
});

test("PERSON open-web pages bridge a public name to company and domain graph nodes", async () => {
  const graph = await investigateEntityClues({ type: "person_name", value: "Avery Rowan" }, async (_query, clue) => {
    if (clue.displayValue === "Avery Rowan") return [{ title: "Avery Rowan biography", url: "https://publication.example/article/avery-rowan", description: "Company: Rowan Signal Studio. Alice leads product development. Website: rowan-signal.example. More details follow." }];
    return [];
  }, { maxHops: 3, maxIdentifiers: 8, maxSearches: 6 });
  assert.ok(graph.clues.some((clue) => clue.type === "company_name" && clue.displayValue === "Rowan Signal Studio"));
  assert.ok(graph.clues.some((clue) => clue.type === "domain" && clue.displayValue === "rowan-signal.example"));
  assert.equal(graph.clues.some((clue) => clue.displayValue.includes("Alice leads") || clue.displayValue.includes("More details")), false);
  assert.ok(graph.relationships.every((edge) => edge.discoveryPath[0] === "Avery Rowan"));
  assert.equal(graph.diagnostics[0].searchIntent, "graph_neighbor_expansion");
});

test("labeled open-web context stays available without becoming standalone identity searches", async () => {
  const queries = [];
  const graph = await discoverExternalIdentityGraph("context.person@example.com", "key", new AbortController().signal, {
    search: async (query) => {
      queries.push(query);
      if (query === '"context.person@example.com"') return [{
        title: "Alice Morgan profile",
        url: "https://directory.example/people/alice-morgan",
        description: "context.person@example.com. Company: Acme Inc. Alice leads product development. Person: Alice Morgan. She founded the team. Domain: acme.example. Location: London. Role: CEO. Further details follow.",
      }];
      return [];
    },
    limits: { maxSearches: 10, maxIdentifiers: 12 },
  });

  assert.ok(graph.clues.some((clue) => clue.type === "company_name" && clue.displayValue === "Acme Inc"));
  assert.ok(graph.clues.some((clue) => clue.type === "person_name" && clue.displayValue === "Alice Morgan"));
  assert.ok(graph.clues.some((clue) => clue.type === "domain" && clue.displayValue === "acme.example"));
  for (const [type, value] of [["location", "London"], ["role_title", "CEO"]]) {
    const clue = graph.clues.find((item) => item.type === type && item.displayValue === value);
    assert.ok(clue);
    assert.equal(clue.enqueueDecision, "rejected");
    assert.equal(clue.rejectionReason, "context_only");
    assert.deepEqual(clue.queriesPlanned, []);
    assert.deepEqual(clue.queriesExecuted, []);
  }
  assert.equal(queries.some((query) => query.includes('"London"') || query.includes('"CEO"')), false);
  assert.equal(graph.clues.some((clue) => /Alice leads|She founded|Further details/.test(clue.displayValue)), false);
});

test("unrelated person names and handles outrank noisy social title copy", async () => {
  const queries = [];
  const graph = await discoverExternalIdentityGraph("riverquill@example.com", "key", new AbortController().signal, {
    search: async (query) => {
      queries.push(query);
      if (query.toLowerCase() === '"morgan quill" "riverquill"') return [{ title: "Morgan Quill (@mq_field) | Instagram", url: "https://instagram.com/mq_field", description: "Morgan Quill, known as RiverQuill" }];
      if (query.includes("riverquill")) return [{ title: "RiverQuill | Morgan Quill - Watch short video with 42k likes", url: "https://tiktok.com/@riverquill/video/42", description: "Open and discover more videos" }];
      return [];
    },
  });
  const person = graph.clues.find((clue) => clue.normalizedValue === "morgan quill");
  const handle = graph.clues.find((clue) => clue.normalizedValue === "riverquill");
  assert.equal(person.type, "person_name");
  assert.equal(handle.type, "username");
  assert.ok(person.qualityScore >= 80 && handle.qualityScore >= 80);
  assert.ok(queries.some((query) => query.toLowerCase() === '"morgan quill" "riverquill"'));
  assert.ok(graph.allCandidates.some((candidate) => candidate.profileUrl === "https://instagram.com/mq_field" && candidate.status === "Candidate"));
  assert.equal(graph.clues.some((clue) => ["watch", "short", "video", "with", "42k", "likes", "open", "and", "discover", "more", "videos"].includes(clue.normalizedValue)), false);
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
      if (query.includes("john.smith")) return [{ title: "John Smith - Facebook", url: "https://facebook.com/johnsmith", description: "john.smith public profile" }];
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

test("TikTok discovery pages and generic titles consume neither candidate nor expansion budget", async () => {
  const queries = [];
  const { discoverExternalIdentityGraph } = await import("../lib/providers/externalIdentityProvider.ts");
  const graph = await discoverExternalIdentityGraph("subject@example.com", "key", new AbortController().signal, {
    search: async (query) => {
      queries.push(query);
      if (query.includes("subject")) return [
        { title: "Discover popular videos", url: "https://www.tiktok.com/discover/subject", description: "TikTok discovery" },
        { title: "Public profile | TikTok", url: "https://www.tiktok.com/search?q=subject", description: "Search results" },
        { title: "Videos | TikTok", url: "https://www.tiktok.com/@useful_handle/video/123", description: "subject creator" },
      ];
      return [];
    },
    limits: { maxSearches: 8 },
  });
  assert.deepEqual(graph.allCandidates.map((candidate) => candidate.profileUrl), ["https://www.tiktok.com/@useful_handle"]);
  assert.equal(queries.some((query) => /"(?:Discover|popular|videos|Public|profile|Search|results)"/.test(query)), false);
  assert.ok(graph.edges.some((edge) => edge.to === "useful_handle" && edge.evidence.derivation === "social_url"));
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
  assert.equal(aliasEdges.some((edge) => edge.from === "https://facebook.com/one"), false);
  assert.ok(aliasEdges.some((edge) => edge.from === "https://instagram.com/two"));
  const aliasQueries = queries.filter((query) => query.includes("SharedAlias"));
  assert.ok(aliasQueries.length >= 2);
  assert.equal(new Set(aliasQueries).size, aliasQueries.length);
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
