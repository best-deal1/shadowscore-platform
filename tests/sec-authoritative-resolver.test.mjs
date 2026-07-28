import test from "node:test";
import assert from "node:assert/strict";
import { SECAuthoritativeResolver } from "../lib/entityResolution/authoritative/sec/index.ts";

const NOW = "2026-07-28T12:00:00.000Z";

function entity(overrides = {}) {
  return {
    entityId: "ent_company_original",
    entityType: "company",
    displayName: "Original display",
    canonicalName: "Original Company",
    resolutionStatus: "DETERMINISTIC",
    provenance: [{ source: "deterministic", extractor: "name-normalizer", confidence: 1, timestamp: "2026-07-27T00:00:00.000Z", field: "target", value: "Original Company" }],
    createdAt: "2026-07-27T00:00:00.000Z",
    updatedAt: "2026-07-27T00:00:00.000Z",
    resolverVersion: "deterministic@1.0.0",
    schemaVersion: "entity@1.0.0",
    metadata: { retained: true, authoritativeIdentifiers: { other: { id: "other-1" } } },
    ...overrides,
  };
}

function issuer(overrides = {}) {
  return {
    registry: "sec",
    registryId: "0000320193",
    legalName: "Apple Inc.",
    tickers: ["AAPL"],
    exchanges: ["Nasdaq"],
    sourceUrls: ["https://data.sec.gov/submissions/CIK0000320193.json"],
    raw: { submissions: { privateRawPayload: true } },
    ...overrides,
  };
}

function mockRegistry(overrides = {}) {
  const calls = [];
  return {
    id: "sec",
    calls,
    async resolveByCIK(value) { calls.push(["cik", value]); return null; },
    async resolveByTicker(value) { calls.push(["ticker", value]); return null; },
    async resolveByName(value) { calls.push(["name", value]); return []; },
    async fetchIssuer(value) { calls.push(["issuer", value]); return null; },
    ...overrides,
  };
}

function resolver(registry) {
  return new SECAuthoritativeResolver(registry, { now: () => NOW });
}

test("resolves an exact CIK authoritatively and normalizes it to ten digits", async () => {
  const registry = mockRegistry({
    async resolveByCIK(value) { this.calls.push(["cik", value]); return issuer(); },
  });
  const original = entity({ metadata: { companyId: "CIK320193", retained: true } });
  const result = await resolver(registry).resolve(original);

  assert.equal(result.status, "AUTHORITATIVE");
  assert.equal(result.confidence, 1);
  assert.deepEqual(registry.calls, [["cik", "0000320193"]]);
  assert.equal(result.candidates[0].matchReason, "exact_cik");
  assert.equal(result.candidates[0].cik, "0000320193");
});

test("resolves a lowercase ticker as a unique exact ticker", async () => {
  const registry = mockRegistry({
    async resolveByTicker(value) { this.calls.push(["ticker", value]); return issuer(); },
  });
  const result = await resolver(registry).resolve(entity({ metadata: { companyTicker: "aapl" } }));

  assert.equal(result.status, "AUTHORITATIVE");
  assert.equal(result.confidence, 1);
  assert.deepEqual(registry.calls, [["ticker", "AAPL"]]);
  assert.equal(result.candidates[0].matchReason, "exact_ticker");
});

test("rejects a ticker response that does not contain the exact ticker", async () => {
  const registry = mockRegistry({ async resolveByTicker() { return issuer({ tickers: ["APPL"] }); } });
  const result = await resolver(registry).resolve(entity({ metadata: { companyTicker: "AAPL" } }));
  assert.equal(result.status, "FAILED");
  assert.equal(result.confidence, 0);
  assert.equal(result.entity, undefined);
});

test("resolves one exact normalized legal name with 0.98 confidence", async () => {
  const registry = mockRegistry({ async resolveByName(value) { this.calls.push(["name", value]); return [issuer()]; } });
  const result = await resolver(registry).resolve(entity({ canonicalName: " apple inc " }));
  assert.equal(result.status, "AUTHORITATIVE");
  assert.equal(result.confidence, 0.98);
  assert.deepEqual(registry.calls, [["name", "apple inc"]]);
  assert.equal(result.entity?.canonicalName, "Apple Inc.");
});

test("returns every exact legal-name candidate when the result is ambiguous", async () => {
  const matches = [issuer(), issuer({ registryId: "0000000002", tickers: ["APLE"], exchanges: ["NYSE"] })];
  const registry = mockRegistry({ async resolveByName() { return matches; } });
  const result = await resolver(registry).resolve(entity({ canonicalName: "Apple Inc" }));
  assert.equal(result.status, "AMBIGUOUS");
  assert.equal(result.entity, undefined);
  assert.equal(result.candidates.length, 2);
  assert.ok(result.candidates.every((item) => item.matchReason === "exact_legal_name"));
  assert.match(result.warnings[0], /Multiple exact SEC legal-name matches/);
});

test("filters non-exact registry results and fails for an unknown entity", async () => {
  const registry = mockRegistry({ async resolveByName() { return [issuer({ legalName: "Apple Holdings Inc." })]; } });
  const result = await resolver(registry).resolve(entity({ canonicalName: "Apple Inc." }));
  assert.equal(result.status, "FAILED");
  assert.equal(result.confidence, 0);
  assert.deepEqual(result.candidates, []);
  assert.equal(result.entity, undefined);
  assert.match(result.warnings[0], /No exact SEC legal-name match/);
});

test("reports SEC upstream errors separately from an unknown issuer", async () => {
  const registry = mockRegistry({ async resolveByName() { throw new Error("SEC request failed with status 503"); } });
  const result = await resolver(registry).resolve(entity({ canonicalName: "Apple Inc." }));
  assert.equal(result.status, "FAILED");
  assert.match(result.warnings[0], /SEC upstream failure/);
  assert.match(result.warnings[0], /status 503/);
});

test("enriches a copy while preserving identity, metadata, and provenance", async () => {
  const registry = mockRegistry({ async resolveByTicker() { return issuer(); } });
  const original = entity({ metadata: { retained: { nested: true }, companyTicker: "AAPL", authoritativeIdentifiers: { other: { id: "other-1" } } } });
  const originalSnapshot = structuredClone(original);
  const result = await resolver(registry).resolve(original);
  const enriched = result.entity;

  assert.ok(enriched);
  assert.equal(enriched.entityId, original.entityId);
  assert.equal(enriched.entityType, original.entityType);
  assert.equal(enriched.createdAt, original.createdAt);
  assert.deepEqual(enriched.metadata.retained, { nested: true });
  assert.deepEqual(enriched.metadata.authoritativeIdentifiers.other, { id: "other-1" });
  assert.deepEqual(enriched.provenance.slice(0, original.provenance.length), original.provenance);
  assert.deepEqual(enriched.provenance.at(-1), {
    source: "authoritative",
    extractor: "sec-registry",
    confidence: 1,
    timestamp: NOW,
    field: "canonicalName",
    value: "Apple Inc.",
    metadata: { registry: "sec", cik: "0000320193", ticker: "AAPL", matchReason: "exact_ticker" },
  });
  assert.equal(enriched.resolutionStatus, "AUTHORITATIVE");
  assert.equal(enriched.updatedAt, NOW);
  assert.deepEqual(enriched.metadata.authoritativeIdentifiers.sec, {
    cik: "0000320193",
    legalName: "Apple Inc.",
    tickers: ["AAPL"],
    exchanges: ["Nasdaq"],
    sourceUrls: ["https://data.sec.gov/submissions/CIK0000320193.json"],
  });
  assert.equal(JSON.stringify(enriched.metadata).includes("privateRawPayload"), false);
  assert.deepEqual(original, originalSnapshot);
});

test("uses CIK before ticker and name", async () => {
  const registry = mockRegistry({ async resolveByCIK(value) { this.calls.push(["cik", value]); return issuer(); } });
  const result = await resolver(registry).resolve(entity({
    canonicalName: "Apple Inc.",
    metadata: { originalInput: { companyId: "320193", companyTicker: "AAPL" } },
  }));
  assert.equal(result.status, "AUTHORITATIVE");
  assert.deepEqual(registry.calls, [["cik", "0000320193"]]);
});
