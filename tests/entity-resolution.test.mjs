import assert from "node:assert/strict";
import test from "node:test";
import { DeterministicEntityResolver } from "../lib/entityResolution/deterministicResolver.ts";
import { ProviderManager } from "../lib/providers/ProviderManager.ts";

const timestamp = "2026-07-27T12:00:00.000Z";

test("resolves a domain to a readable, stable entity identity", () => {
  const resolver = new DeterministicEntityResolver(() => timestamp);
  const first = resolver.resolve({ target: "https://www.Example.com/path", platform: "website" });
  const second = resolver.resolve({ target: "example.com", platform: "website" });

  assert.match(first.entityId, /^ent_domain_[a-f0-9]{20}$/);
  assert.equal(first.entityId, second.entityId);
  assert.equal(first.displayName, "example.com");
  assert.equal(first.canonicalName, "example.com");
  assert.equal(first.resolutionStatus, "DETERMINISTIC");
  assert.equal(first.resolverVersion, "deterministic@1.0.0");
  assert.equal(first.schemaVersion, "entity@1.0.0");
  assert.deepEqual(first.provenance[0], { source: "deterministic", extractor: "url-parser", confidence: 1, timestamp, field: "target", value: "example.com" });
});

test("keeps the entity model broader than companies", () => {
  const resolver = new DeterministicEntityResolver(() => timestamp);
  assert.equal(resolver.resolve({ target: "analyst@example.com" }).entityType, "email");
  assert.equal(resolver.resolve({ target: "+1 212 555 0123" }).entityType, "phone");
  assert.equal(resolver.resolve({ target: "Acme Cooperative" }).entityType, "organization");
  assert.equal(resolver.resolve({ target: "MSFT", companyTicker: "MSFT" }).entityType, "company");
});

test("provider manager resolves once before provider execution", async () => {
  let resolutions = 0;
  const resolvedEntity = new DeterministicEntityResolver(() => timestamp).resolve({ target: "example.com" });
  const resolver = { resolve() { resolutions += 1; return resolvedEntity; } };
  const observed = [];
  const provider = (id) => ({
    id, name: id, version: "1", category: "dns",
    async execute(context) { observed.push(context.resolvedEntity); return { providerId: id, providerVersion: "1", status: "completed", startedAt: timestamp, completedAt: timestamp, duration: 0, findings: [], evidence: [], metadata: {}, errors: [] }; },
    normalize() {}, confidence() { return 1; }, evidence() { return []; }, correlation() {}, failureReason() { return "Unavailable"; }, async health() { return { providerId: id, providerVersion: "1", status: "healthy", checkedAt: timestamp, metadata: {} }; },
  });

  await new ProviderManager(resolver).registerMany([provider("one"), provider("two")]).runProviders({ intakeId: "intake", scanMode: "website", target: "example.com", platform: "web", fileNames: [], visibleSignalCategories: [] });
  assert.equal(resolutions, 1);
  assert.deepEqual(observed, [resolvedEntity, resolvedEntity]);
});
