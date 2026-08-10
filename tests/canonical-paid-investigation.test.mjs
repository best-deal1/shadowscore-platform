import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { investigateLive } from "../lib/investigationCollection/index.ts";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const NOW = new Date("2026-08-10T00:00:00.000Z");

test("persists every provider outcome while allowing useful partial execution", async () => {
  const evidence = { evidenceId: "live-1", subjectCandidateId: "domain:example.com", relationship: "resolves_to", value: "192.0.2.1", confidence: 90, evidenceType: "website", source: { sourceId: "live", sourceName: "Live DNS", sourceUrl: "https://dns.example/query", observedAt: NOW.toISOString(), retrievedAt: NOW.toISOString(), reliability: 90 } };
  const good = { manifest: { id: "good", name: "Good", supportedSeedTypes: ["domain"], supportedJurisdictions: ["global"], supportedMarketplaces: [], availability: { status: "available" }, authentication: "none", rateLimit: "none", cost: null, evidenceTypes: ["website"] }, async collect() { return { candidates: [{ candidateId: "domain:example.com", kind: "domain", label: "example.com", identifiers: [{ kind: "domain", value: "example.com" }], evidenceIds: ["live-1"] }], evidence: [evidence], discoveredSeeds: [] }; } };
  const unavailable = { ...good, manifest: { ...good.manifest, id: "marketplace", availability: { status: "unavailable", reason: "Credentials are not configured." } } };
  const progress = [];
  const result = await investigateLive({ kind: "domain", value: "example.com" }, { providers: [good, unavailable], now: () => NOW, onProgress: (item) => progress.push(item) });
  assert.deepEqual(progress.map((item) => item.run.status), ["completed", "unavailable"]);
  assert.equal(result.graph.evidence.length, 1);
  assert.equal(result.graph.evidence[0].source.sourceUrl, "https://dns.example/query");
});

test("payment confirmation and worker execution use durable idempotency keys", () => {
  const migration = read("../supabase/migrations/20260810010000_canonical_paid_investigation_execution.sql");
  assert.match(migration, /unique index[^;]+canonical_investigation_id/is);
  assert.match(migration, /on conflict\(canonical_investigation_id\)/);
  assert.match(migration, /primary key\(investigation_id,evidence_id\)/);
  assert.match(migration, /report_status=case when report_status='ready'/);
  const worker = read("../lib/canonicalPaidInvestigation.ts");
  assert.match(worker, /status==="ready"\|\|runs\[0\]\.status==="partial"/);
  assert.match(worker, /resolution=ignore-duplicates/);
});

test("report, workspace case, and job are projected from the persisted graph", () => {
  const worker = read("../lib/canonicalPaidInvestigation.ts");
  assert.match(worker, /canonicalGraph:output\.graph/);
  assert.match(worker, /evidence_snapshot:\{investigationId,evidence:output\.graph\.evidence,entities:output\.graph\.entities,contradictions:output\.graph\.contradictions,confidence\}/);
  assert.match(worker, /rest\/v1\/cases\?investigation_id/);
  assert.doesNotMatch(worker, /buildReadyReport/);
});
