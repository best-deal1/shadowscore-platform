import assert from "node:assert/strict";
import test from "node:test";

import { buildInvestigationGraph } from "../lib/investigationEngine/index.ts";

const source = (sourceId, observedAt = "2026-08-01T00:00:00.000Z", reliability = 90) => ({ sourceId, sourceName: sourceId, sourceUrl: `https://evidence.example/${sourceId}`, observedAt, retrievedAt: "2026-08-09T00:00:00.000Z", reliability });

function candidate(candidateId, kind, label, identifiers, evidenceIds = []) {
  return { candidateId, kind, label, identifiers, evidenceIds };
}

function evidence(evidenceId, subjectCandidateId, relationship, value, sourceRef, options = {}) {
  return { evidenceId, subjectCandidateId, relationship, value, source: sourceRef, confidence: options.confidence ?? 90, evidenceType: options.evidenceType ?? "other", objectCandidateId: options.objectCandidateId, lifecycle: options.lifecycle };
}

test("resolves exact identifiers into one graph without merging on similar names", () => {
  const graph = buildInvestigationGraph({
    seed: { kind: "email", value: "owner@acme.example" },
    now: "2026-08-09T00:00:00.000Z",
    candidates: [
      candidate("company-registry", "company", "Acme Trading Ltd", [{ kind: "registration_number", value: "GB-123" }, { kind: "domain", value: "acme.example" }], ["registry"]),
      candidate("company-site", "company", "ACME Trading", [{ kind: "registration_number", value: "gb-123" }, { kind: "email", value: "owner@acme.example" }], ["website"]),
      candidate("similar-name", "company", "Acme Trading Group", [{ kind: "company", value: "Acme Trading Group" }], ["directory"]),
    ],
    evidence: [
      evidence("registry", "company-registry", "registered_name", "Acme Trading Ltd", source("registry"), { lifecycle: "verified" }),
      evidence("website", "company-site", "contact_email", "owner@acme.example", source("website"), { lifecycle: "corroborated" }),
      evidence("directory", "similar-name", "directory_name", "Acme Trading Group", source("directory"), { confidence: 45, lifecycle: "corroborated" }),
    ],
  });

  assert.equal(graph.entities.length, 2);
  assert.deepEqual(graph.entities.find((item) => item.candidateIds.includes("company-registry")).candidateIds.sort(), ["company-registry", "company-site"]);
  assert.equal(graph.entities.find((item) => item.candidateIds.includes("similar-name")).resolution, "possible");
});

test("connects marketplace evidence to the resolved company and decision", () => {
  const graph = buildInvestigationGraph({
    seed: { kind: "marketplace_identity", value: "shop/acme" },
    now: "2026-08-09T00:00:00.000Z",
    candidates: [
      candidate("company", "company", "Acme Ltd", [{ kind: "registration_number", value: "123" }], ["reg", "registry-link", "market-link"]),
      candidate("seller", "marketplace_account", "Acme Store", [{ kind: "marketplace_identity", value: "shop/acme" }], ["registry-link", "market-link"]),
    ],
    evidence: [
      evidence("reg", "company", "registered_name", "Acme Ltd", source("registry"), { evidenceType: "registry", lifecycle: "verified" }),
      evidence("registry-link", "seller", "registered_operator", "Acme Ltd", source("registry"), { evidenceType: "registry", objectCandidateId: "company", lifecycle: "verified" }),
      evidence("market-link", "seller", "operated_by", "Acme Ltd", source("marketplace"), { evidenceType: "marketplace", objectCandidateId: "company", lifecycle: "corroborated" }),
    ],
  });

  assert.equal(graph.marketplace.entityIds.length, 1);
  assert.deepEqual(graph.marketplace.evidenceIds, ["registry-link", "market-link"]);
  assert.equal(graph.marketplace.connectedEntityIds[0], "entity:company");
  assert.equal(graph.evidence.find((item) => item.evidenceId === "market-link").toEntityId, "entity:company");
  assert.equal(graph.decision.outcome, "proceed");
});

test("surfaces independent ownership conflicts and lowers the decision", () => {
  const warnings = [];
  const graph = buildInvestigationGraph({
    seed: { kind: "domain", value: "acme.example" },
    now: "2026-08-09T00:00:00.000Z",
    logger: { info() {}, warn(event, details) { warnings.push({ event, details }); } },
    candidates: [candidate("domain", "domain", "acme.example", [{ kind: "domain", value: "acme.example" }], ["whois", "claim"])],
    evidence: [
      evidence("whois", "domain", "domain_owner", "Acme Holdings Ltd", source("registry"), { lifecycle: "verified" }),
      evidence("claim", "domain", "domain_owner", "Example Seller LLC", source("marketplace"), { evidenceType: "marketplace", lifecycle: "corroborated" }),
    ],
  });

  assert.equal(graph.contradictions[0].type, "conflicting_value");
  assert.equal(graph.contradictions[0].severity, "high");
  assert.ok(graph.evidence.every((item) => item.status === "conflicting"));
  assert.equal(graph.decision.outcome, "investigate");
  assert.equal(warnings[0].event, "investigation_graph_contradictions");
});

test("keeps lead-only evidence out of resolution, contradictions, and decisions", () => {
  const graph = buildInvestigationGraph({
    seed: { kind: "company", value: "Acme Trading" },
    now: "2026-08-09T00:00:00.000Z",
    candidates: [candidate("company", "company", "Acme Trading", [{ kind: "company", value: "Acme Trading" }], ["lead-owner-a", "lead-owner-b"])],
    evidence: [
      evidence("lead-owner-a", "company", "owner", "Alice Example", source("directory"), { lifecycle: "lead" }),
      evidence("lead-owner-b", "company", "owner", "Bob Example", source("marketplace"), { evidenceType: "marketplace", lifecycle: "lead" }),
    ],
  });

  assert.equal(graph.entities[0].resolution, "unresolved");
  assert.equal(graph.contradictions.length, 0);
  assert.equal(graph.decision.outcome, "investigate");
  assert.equal(graph.decision.verifiedEvidenceCount, 0);
  assert.ok(graph.evidence.every((item) => item.lifecycle === "lead"));
});

test("reduces stale evidence confidence and rejects invalid references", () => {
  const graph = buildInvestigationGraph({
    seed: { kind: "phone", value: "+1 555 0100" },
    now: "2026-08-09T00:00:00.000Z",
    candidates: [candidate("phone", "phone", "+1 555 0100", [{ kind: "phone", value: "+1 555 0100" }], ["old-contact"])],
    evidence: [evidence("old-contact", "phone", "contact_for", "Acme", source("archive", "2020-01-01T00:00:00.000Z"))],
  });
  assert.equal(graph.evidence[0].freshness, "stale");
  assert.equal(graph.evidence[0].confidence, 70);

  assert.throws(() => buildInvestigationGraph({ seed: { kind: "company", value: "Acme" }, candidates: [], evidence: [evidence("bad", "missing", "name", "Acme", source("source"))] }), /unknown candidate/);
});
