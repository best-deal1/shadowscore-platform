import assert from "node:assert/strict";
import test from "node:test";
import { GoogleDnsInvestigationProvider, createLiveInvestigationProviders, investigateLive } from "../lib/investigationCollection/index.ts";

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
    assert.equal(output.graph.decision.outcome, "proceed");
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
  assert.equal(output.graph.decision.outcome, "proceed_with_conditions");
});

test("enforces provider budgets and bounded retries", async () => {
  let calls = 0;
  const provider = { manifest: { id: "paid", name: "Paid", supportedSeedTypes: ["company"], supportedJurisdictions: ["US"], supportedMarketplaces: [], availability: { status: "available" }, authentication: "api_key", rateLimit: "1/minute", cost: { amount: 1, currency: "USD" }, evidenceTypes: ["registry"] }, async collect() { calls += 1; throw new Error("upstream failed"); } };
  const blocked = await investigateLive({ kind: "company", value: "Acme" }, { providers: [provider], budgetUsd: 0.5, now: () => NOW });
  assert.equal(blocked.providerRuns[0].status, "budget_blocked"); assert.equal(calls, 0);
  const attempted = await investigateLive({ kind: "company", value: "Acme" }, { providers: [{ ...provider, manifest: { ...provider.manifest, cost: null } }], maxRetries: 1, now: () => NOW });
  assert.equal(attempted.providerRuns[0].attempts, 2); assert.equal(calls, 2);
});
