import assert from "node:assert/strict";
import test from "node:test";
import { BravePublicWebInvestigationProvider, GoogleDnsInvestigationProvider, SecEdgarCompanyRegistryProvider, createLiveInvestigationProviders, investigateLive, presentLiveInvestigation } from "../lib/investigationCollection/index.ts";
import { buildInvestigationGraph } from "../lib/investigationEngine/index.ts";

const NOW = new Date("2026-08-09T12:00:00.000Z");

test("collects sourced DNS evidence from an email and follows the discovered domain once", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input)); requests.push(url);
    const type = url.searchParams.get("type");
    return Response.json({ Status: 0, Answer: type === "MX" ? [{ name: "example.com.", type: 15, TTL: 300, data: "10 mail.example.com." }] : [] });
  };
  try {
    const output = await investigateLive({ kind: "email", value: "owner@example.com" }, { providers: [new GoogleDnsInvestigationProvider()], now: () => NOW, maxDepth: 2 });
    assert.equal(requests.length, 6);
    assert.deepEqual(output.discoveredSeeds, [{ kind: "domain", value: "example.com" }]);
    assert.equal(output.graph.evidence.length, 1);
    assert.equal(output.graph.evidence[0].source.sourceUrl.includes("dns.google/resolve"), true);
    assert.equal(output.graph.evidence[0].source.retrievedAt, NOW.toISOString());
    assert.equal(output.graph.entities[0].identifiers[0].value, "example.com");
    assert.equal(output.graph.decision.outcome, "investigate");
    assert.equal(output.graph.decision.verifiedEvidenceCount, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test("correlates marketplace evidence in the graph through a pluggable provider", async () => {
  const provider = {
    manifest: { id: "contract-marketplace", name: "Contract marketplace", supportedSeedTypes: ["marketplace_identity"], supportedJurisdictions: ["US"], supportedMarketplaces: ["etsy"], availability: { status: "available" }, authentication: "api_key", rateLimit: "10/minute", cost: { amount: 0.01, currency: "USD" }, evidenceTypes: ["marketplace"] },
    async collect() { return {
      candidates: [
        { candidateId: "seller", kind: "marketplace_account", label: "Acme Store", identifiers: [{ kind: "marketplace_identity", value: "etsy/acme" }, { kind: "email", value: "owner@acme.example" }], evidenceIds: ["market-owner"] },
        { candidateId: "company", kind: "company", label: "Acme LLC", identifiers: [{ kind: "registration_number", value: "US-123" }, { kind: "email", value: "owner@acme.example" }], evidenceIds: ["market-owner"] },
      ],
      evidence: [{ evidenceId: "market-owner", subjectCandidateId: "seller", objectCandidateId: "company", relationship: "operated_by", value: "Acme LLC", confidence: 95, evidenceType: "marketplace", source: { sourceId: "contract-marketplace", sourceName: "Marketplace API", sourceUrl: "https://api.market.example/evidence/123", observedAt: NOW.toISOString(), retrievedAt: NOW.toISOString(), reliability: 90 } }], discoveredSeeds: [],
    }; },
  };
  const output = await investigateLive({ kind: "marketplace_identity", value: "etsy/acme" }, { providers: [provider], now: () => NOW, budgetUsd: 0.02 });
  assert.deepEqual(output.graph.marketplace.evidenceIds, ["market-owner"]);
  assert.deepEqual(output.graph.marketplace.connectedEntityIds, ["entity:company"]);
  assert.equal(output.spentUsd, 0.01);
});

test("reports unavailable credentialed providers without fabricating evidence", async () => {
  const marketplace = createLiveInvestigationProviders().find((provider) => provider.manifest.id === "marketplace-partner");
  const output = await investigateLive({ kind: "marketplace_identity", value: "etsy/acme" }, { providers: [marketplace], now: () => NOW });
  assert.equal(output.providerRuns[0].status, "unavailable");
  assert.match(output.providerRuns[0].error, /credentialed marketplace partner client/);
  assert.equal(output.graph.evidence.length, 0);
  assert.equal(output.graph.decision.outcome, "investigate");
});

test("never treats public mailbox infrastructure as subject evidence", async () => {
  let requests = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { requests += 1; return Response.json({ Answer: [{ data: "mail.google.com" }] }); };
  try {
    const output = await investigateLive({ kind: "email", value: "subject@gmail.com" }, { providers: [new GoogleDnsInvestigationProvider()], now: () => NOW });
    assert.equal(requests, 0);
    assert.equal(output.graph.evidence.length, 0);
    assert.equal(output.graph.decision.outcome, "investigate");
    assert.equal(output.graph.contradictions.length, 0);
    assert.deepEqual(output.discoveredSeeds, []);
  } finally { globalThis.fetch = originalFetch; }
});

test("zero verified evidence cannot create a decision or contradiction", () => {
  const graph = buildInvestigationGraph({ seed: { kind: "email", value: "subject@example.com" }, now: NOW.toISOString(), candidates: [
    { candidateId: "one", kind: "person", label: "One", identifiers: [{ kind: "email", value: "subject@example.com" }], evidenceIds: [] },
    { candidateId: "two", kind: "company", label: "Two", identifiers: [{ kind: "email", value: "subject@example.com" }], evidenceIds: [] },
  ], evidence: [] });
  assert.equal(graph.decision.outcome, "investigate");
  assert.equal(graph.decision.verifiedEvidenceCount, 0);
  assert.equal(graph.contradictions.length, 0);
  assert.doesNotMatch(graph.decision.summary, /supported/i);
});

test("mirrors in one source family cannot create independent corroboration", () => {
  const candidate = { candidateId: "company", kind: "company", label: "Acme", identifiers: [{ kind: "registration_number", value: "123" }], evidenceIds: ["mirror-1", "mirror-2"] };
  const assertion = (evidenceId, sourceId) => ({ evidenceId, subjectCandidateId: "company", relationship: "registration", value: "123", confidence: 95, lifecycle: "verified", evidenceType: "registry", source: { sourceId, sourceFamily: "syndicated-register", sourceName: sourceId, observedAt: NOW.toISOString(), retrievedAt: NOW.toISOString(), reliability: 95, license: "public" } });
  const graph = buildInvestigationGraph({ seed: { kind: "company", value: "Acme" }, now: NOW.toISOString(), candidates: [candidate], evidence: [assertion("mirror-1", "mirror-a"), assertion("mirror-2", "mirror-b")] });
  assert.equal(graph.decision.independentSourceFamilyCount, 1);
  assert.equal(graph.decision.outcome, "proceed_with_conditions");
});

test("preserves successful evidence when another provider times out", async () => {
  const manifest = { supportedSeedTypes: ["company"], supportedJurisdictions: ["global"], supportedMarketplaces: [], availability: { status: "available" }, authentication: "none", rateLimit: "none", cost: null, evidenceTypes: ["registry"], sourceFamily: "fixture", legalBasis: "open_data", capabilities: ["registry"] };
  const good = { manifest: { ...manifest, id: "registry", name: "Registry" }, async collect(_seed, context) { return { candidates: [{ candidateId: "acme", kind: "company", label: "Acme", identifiers: [{ kind: "registration_number", value: "123" }], evidenceIds: ["registration"] }], evidence: [{ evidenceId: "registration", subjectCandidateId: "acme", relationship: "registration", value: "123", confidence: 95, lifecycle: "verified", evidenceType: "registry", source: { sourceId: "registry", sourceFamily: "official-registry", sourceName: "Registry", observedAt: context.now, retrievedAt: context.now, reliability: 98, license: "open_data" } }], discoveredSeeds: [] }; } };
  const slow = { manifest: { ...manifest, id: "slow", name: "Slow" }, async collect(_seed, context) { await new Promise((resolve, reject) => { const timer = setTimeout(resolve, 100); context.signal.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }); }); return { candidates: [], evidence: [], discoveredSeeds: [] }; } };
  const output = await investigateLive({ kind: "company", value: "Acme" }, { providers: [good, slow], timeoutMs: 5, maxRetries: 0, now: () => NOW });
  assert.equal(output.providerRuns.find((run) => run.providerId === "slow").status, "timed_out");
  assert.equal(output.graph.evidence.length, 1);
  assert.equal(output.graph.decision.verifiedEvidenceCount, 1);
});

test("enforces provider budgets and bounded retries", async () => {
  let calls = 0;
  const provider = { manifest: { id: "paid", name: "Paid", supportedSeedTypes: ["company"], supportedJurisdictions: ["US"], supportedMarketplaces: [], availability: { status: "available" }, authentication: "api_key", rateLimit: "1/minute", cost: { amount: 1, currency: "USD" }, evidenceTypes: ["registry"] }, async collect() { calls += 1; throw new Error("upstream failed"); } };
  const blocked = await investigateLive({ kind: "company", value: "Acme" }, { providers: [provider], budgetUsd: 0.5, now: () => NOW });
  assert.equal(blocked.providerRuns[0].status, "budget_blocked"); assert.equal(calls, 0);
  const attempted = await investigateLive({ kind: "company", value: "Acme" }, { providers: [{ ...provider, manifest: { ...provider.manifest, cost: null } }], maxRetries: 1, now: () => NOW });
  assert.equal(attempted.providerRuns[0].attempts, 2); assert.equal(calls, 2);
});

test("scopes decisions to the seed subject and collapses derived source families", () => {
  const source = (id, family) => ({ sourceId: id, sourceFamily: family, sourceName: id, observedAt: NOW.toISOString(), retrievedAt: NOW.toISOString(), reliability: 95 });
  const candidates = [
    { candidateId: "subject", kind: "company", label: "Subject", identifiers: [{ kind: "company", value: "Subject" }], evidenceIds: ["subject-primary", "subject-derived"] },
    { candidateId: "other", kind: "company", label: "Other", identifiers: [{ kind: "company", value: "Other" }], evidenceIds: ["other-a", "other-b"] },
  ];
  const assertion = (evidenceId, subjectCandidateId, family, derivedFromEvidenceIds = []) => ({ evidenceId, subjectCandidateId, relationship: "registration", value: "active", confidence: 95, lifecycle: "verified", evidenceType: "registry", derivedFromEvidenceIds, source: source(evidenceId, family) });
  const graph = buildInvestigationGraph({ seed: { kind: "company", value: "Subject" }, now: NOW.toISOString(), candidates, evidence: [
    assertion("subject-primary", "subject", "registry-a"), assertion("subject-derived", "subject", "mirror-b", ["subject-primary"]),
    assertion("other-a", "other", "other-a"), assertion("other-b", "other", "other-b"),
  ] });
  assert.equal(graph.decision.verifiedEvidenceCount, 2);
  assert.equal(graph.decision.independentSourceFamilyCount, 1);
  assert.equal(graph.decision.outcome, "proceed_with_conditions");
  assert.match(graph.decision.coverageGaps[0], /independent source family/i);
  assert.deepEqual(graph.evidence.find((item) => item.evidenceId === "subject-derived").derivedFromEvidenceIds, ["subject-primary"]);
  assert.equal(graph.evidence.find((item) => item.evidenceId === "subject-derived").lifecycle, "verified");
});

test("executes configured public search and preserves discovery provenance", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ web: { results: [{ title: "Public profile", url: "https://facebook.com/example-person", description: "Contact person@example.com" }] } });
  try {
    const provider = new BravePublicWebInvestigationProvider({ BRAVE_SEARCH_API_KEY: "configured" });
    const output = await investigateLive({ kind: "email", value: "person@example.com" }, { providers: [provider], now: () => NOW, maxRetries: 0 });
    assert.equal(output.providerRuns[0].status, "success");
    assert.ok(output.providerRuns[0].evidenceCount > 0);
    const item = output.graph.evidence[0];
    assert.equal(item.lifecycle, "lead");
    assert.equal(item.discovery.resultUrl, "https://facebook.com/example-person");
    assert.match(item.discovery.query, /person@example\.com/);
    assert.match(item.discovery.snippet, /Contact person@example\.com/);
    assert.equal(item.discovery.timestamp, NOW.toISOString());
    assert.equal(output.graph.decision.outcome, "investigate");
  } finally { globalThis.fetch = originalFetch; }
});

test("marks public search unavailable when credentials are missing", async () => {
  const provider = new BravePublicWebInvestigationProvider({});
  const output = await investigateLive({ kind: "email", value: "random-person@gmail.com" }, { providers: [provider], now: () => NOW });
  assert.equal(output.providerRuns[0].status, "unavailable");
  assert.match(output.providerRuns[0].error, /BRAVE_SEARCH_API_KEY/);
  assert.equal(output.graph.evidence.length, 0);
});

test("runs SEC EDGAR through the capability runtime and preserves authoritative provenance", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), userAgent: init.headers["user-agent"] });
    if (String(input).includes("company_tickers")) return Response.json({ data: [[320193, "Apple Inc.", "AAPL", "Nasdaq"]] });
    return Response.json({ name: "Apple Inc.", website: "https://www.apple.com", addresses: { business: { street1: "One Apple Park Way", city: "Cupertino", stateOrCountry: "CA", zipCode: "95014" } } });
  };
  try {
    const output = await investigateLive({ kind: "registration_number", value: "320193" }, { providers: [new SecEdgarCompanyRegistryProvider({ SEC_EDGAR_USER_AGENT: "Test test@example.com" })], now: () => NOW, maxDepth: 0 });
    assert.equal(output.providerRuns[0].configuration, "configured"); assert.equal(output.providerRuns[0].status, "success");
    assert.equal(output.graph.entities.some((item) => item.kind === "company" && item.label === "Apple Inc."), true);
    assert.equal(output.graph.entities.some((item) => item.kind === "domain" && item.label === "apple.com"), true);
    const edge = output.graph.evidence.find((item) => item.relationship === "official_website");
    assert.equal(edge.source.sourceFamily, "sec-edgar"); assert.equal(edge.source.license, "open_data"); assert.match(edge.source.sourceUrl, /data\.sec\.gov/);
    assert.equal(edge.lifecycle, "verified"); assert.equal(edge.freshness, "current"); assert.equal(requests[0].userAgent, "Test test@example.com");
    assert.equal(output.graph.evidence.some((item) => item.relationship === "business_address"), true);
    assert.equal(output.graph.evidence.some((item) => item.relationship === "registered_address"), false);
    assert.ok(output.graph.decision.reasons.every((item) => item.evidenceIds.length || item.coverageGap));
    assert.ok(output.graph.decision.recommendations.every((item) => item.evidenceIds.length || item.coverageGap));
  } finally { globalThis.fetch = originalFetch; }
});

test("reports honest SEC empty, unavailable, failed, and timed out states", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ data: [] });
    const empty = await investigateLive({ kind: "company", value: "Missing Company" }, { providers: [new SecEdgarCompanyRegistryProvider({})], now: () => NOW });
    assert.equal(empty.providerRuns[0].status, "empty"); assert.match(empty.graph.decision.coverageGaps[0], /No current/);
    const unavailable = await investigateLive({ kind: "company", value: "Apple Inc." }, { providers: [new SecEdgarCompanyRegistryProvider({ SEC_EDGAR_REGISTRY_ENABLED: "false" })], now: () => NOW });
    assert.equal(unavailable.providerRuns[0].configuration, "unavailable"); assert.equal(unavailable.providerRuns[0].status, "unavailable");
    globalThis.fetch = async () => new Response("failure", { status: 503 });
    const failed = await investigateLive({ kind: "company", value: "Apple Inc." }, { providers: [new SecEdgarCompanyRegistryProvider({})], now: () => NOW, maxRetries: 0 });
    assert.equal(failed.providerRuns[0].status, "failed");
    globalThis.fetch = async (_input, init) => await new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))));
    const timedOut = await investigateLive({ kind: "company", value: "Apple Inc." }, { providers: [new SecEdgarCompanyRegistryProvider({})], now: () => NOW, timeoutMs: 2, maxRetries: 0 });
    assert.equal(timedOut.providerRuns[0].status, "timed_out");
  } finally { globalThis.fetch = originalFetch; }
});

test("expired ownership cannot support a decision and requires refresh", () => {
  const candidate = { candidateId: "company", kind: "company", label: "Acme", identifiers: [{ kind: "company", value: "Acme" }], evidenceIds: ["old-owner"] };
  const graph = buildInvestigationGraph({ seed: { kind: "company", value: "Acme" }, now: NOW.toISOString(), candidates: [candidate], evidence: [{ evidenceId: "old-owner", subjectCandidateId: "company", relationship: "owner", value: "Old Owner", confidence: 99, lifecycle: "verified", evidenceType: "ownership", source: { sourceId: "registry", sourceFamily: "registry", sourceName: "Registry", sourceUrl: "https://registry.example/record", observedAt: "2024-01-01T00:00:00.000Z", retrievedAt: "2024-01-01T00:00:00.000Z", reliability: 99, license: "open_data" } }] });
  assert.equal(graph.evidence[0].freshness, "expired"); assert.equal(graph.decision.verifiedEvidenceCount, 0); assert.equal(graph.decision.outcome, "investigate"); assert.match(graph.decision.coverageGaps.join(" "), /Refresh evidence/);
});

test("expired ownership cannot create a decision contradiction with current ownership", () => {
  const candidate = { candidateId: "company", kind: "company", label: "Acme", identifiers: [{ kind: "company", value: "Acme" }], evidenceIds: ["current-owner-one", "current-owner-two", "expired-owner"] };
  const ownership = (evidenceId, value, sourceFamily, observedAt) => ({ evidenceId, subjectCandidateId: "company", relationship: "owner", value, confidence: 99, lifecycle: "verified", evidenceType: "ownership", source: { sourceId: sourceFamily, sourceFamily, sourceName: sourceFamily, sourceUrl: `https://${sourceFamily}.example/record`, observedAt, retrievedAt: NOW.toISOString(), reliability: 99, license: "open_data" } });
  const graph = buildInvestigationGraph({ seed: { kind: "company", value: "Acme" }, now: NOW.toISOString(), candidates: [candidate], evidence: [
    ownership("current-owner-one", "Current Owner", "registry-one", "2026-08-01T00:00:00.000Z"),
    ownership("current-owner-two", "Current Owner", "registry-two", "2026-08-02T00:00:00.000Z"),
    ownership("expired-owner", "Former Owner", "registry-old", "2024-01-01T00:00:00.000Z"),
  ] });
  assert.equal(graph.contradictions.length, 1);
  assert.equal(graph.decision.outcome, "proceed");
  assert.equal(graph.decision.verifiedEvidenceCount, 2);
});

test("customer serialization redacts provider traces while administrator output retains them", async () => {
  const source = { sourceId: "registry", sourceFamily: "registry-family", sourceName: "Registry name", sourceUrl: "https://registry.example/result/1", observedAt: NOW.toISOString(), retrievedAt: NOW.toISOString(), reliability: 99, license: "open_data", query: "secret graph query", normalization: { raw: "secret raw input", normalized: "acme", method: "case-folded" } };
  const discovery = { query: "secret discovery query", resultUrl: "https://registry.example/result/1", sourceUrl: "https://registry.example/search", snippet: "Reviewable result provenance", timestamp: NOW.toISOString(), hop: 0, parentEvidenceIds: [] };
  const graph = buildInvestigationGraph({ seed: { kind: "company", value: "Acme" }, candidates: [{ candidateId: "company", kind: "company", label: "Acme", identifiers: [{ kind: "company", value: "Acme" }], evidenceIds: ["registry-name"] }], evidence: [{ evidenceId: "registry-name", subjectCandidateId: "company", relationship: "legal_name", value: "Acme", confidence: 99, lifecycle: "verified", evidenceType: "registry", source, discovery }], now: NOW.toISOString() });
  const investigation = { graph, providerRuns: [{ providerId: "registry", seed: { kind: "company", value: "Acme" }, depth: 0, configuration: "configured", status: "failed", attempts: 1, evidenceCount: 0, query: "secret exact query", error: "upstream trace" }], discoveredSeeds: [], spentUsd: 0, limits: { maxDepth: 1, maxProviderCalls: 1, timeoutMs: 1, budgetUsd: 0 } };
  const customer = presentLiveInvestigation(investigation);
  const administrator = presentLiveInvestigation(investigation, "administrator");
  assert.equal(customer.providerRuns[0].query, undefined); assert.equal(customer.providerRuns[0].error, undefined);
  assert.equal(customer.graph.evidence[0].source.query, undefined); assert.equal(customer.graph.evidence[0].source.normalization.raw, undefined); assert.equal(customer.graph.evidence[0].discovery.query, undefined);
  assert.equal(customer.graph.evidence[0].source.sourceUrl, source.sourceUrl); assert.equal(customer.graph.evidence[0].source.sourceName, source.sourceName); assert.equal(customer.graph.evidence[0].source.sourceFamily, source.sourceFamily);
  assert.equal(customer.graph.evidence[0].discovery.resultUrl, discovery.resultUrl); assert.equal(customer.graph.evidence[0].discovery.snippet, discovery.snippet);
  assert.equal(administrator.providerRuns[0].query, "secret exact query"); assert.equal(administrator.graph.evidence[0].source.query, source.query); assert.equal(administrator.graph.evidence[0].source.normalization.raw, source.normalization.raw); assert.equal(administrator.graph.evidence[0].discovery.query, discovery.query);
});
