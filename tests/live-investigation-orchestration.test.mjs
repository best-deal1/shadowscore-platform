import assert from "node:assert/strict";
import test from "node:test";
import { GoogleDnsInvestigationProvider, createLiveInvestigationProviders, investigateLive } from "../lib/investigationCollection/index.ts";
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
  assert.equal(output.providerRuns[0].status, "PROVIDER_UNAVAILABLE");
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
