import assert from "node:assert/strict";
import { IntelligenceService } from "../lib/intelligence/service.ts";

const at = "2026-07-21T10:00:00.000Z";
const provenance = { source: "registry", engine: "fixture", engineVersion: "1", observedAt: at, ingestedAt: at };
const entities = new Map([
  ["business-1", { id: "business-1", type: "Business", canonicalName: "Acme Ltd", attributes: { governmentRegistration: "GB-123", ownershipVerified: true, addresses: ["1 Main Street", "2 Other Street"] }, provenance, confidence: 1, createdAt: at, updatedAt: at }],
  ["payment-1", { id: "payment-1", type: "PaymentIdentity", canonicalName: "Acme Payments", attributes: { riskFlag: true }, provenance, confidence: 0.9, createdAt: at, updatedAt: at }],
]);
const relationship = { id: "rel-1", type: "uses", fromEntityId: "business-1", toEntityId: "payment-1", provenance, confidence: 0.4, validFrom: at, evidenceIds: ["ev-relationship"], createdAt: at, updatedAt: at };
const decisions = [{ id: "decision-1", entityId: "business-1", recommendation: "approve", confidence: 0.8, evidenceIds: ["ev-trust"], policyVersion: "policy-1", decidedAt: "2026-07-20T10:00:00.000Z" }];
const graph = { getEntity: (id) => entities.get(id), getRelationships: () => [relationship], getTimeline: () => [{ id: "entity_updated:business-1", type: "entity_updated", occurredAt: "2026-07-21T11:00:00.000Z", evidenceIds: [], reason: "Canonical entity attributes were updated.", details: {} }], getDecisions: () => decisions, getTrust: () => ({ score: 78, confidence: 0.9, calculatedAt: at, evidenceIds: ["ev-trust"], explanation: "Registration was verified." }) };
const service = new IntelligenceService(graph, () => at);

const trust = service.trustExplanation("business-1");
assert.equal(trust.intelligenceType, "trust_explanation"); assert.equal(trust.details.trustScore, 78); assert.ok(trust.reasoningPath.length >= 2); assert.ok(trust.evidenceIds.includes("ev-trust")); assert.equal(trust.engineVersion, "1.0.0");
const missing = service.missingEvidence("business-1");
assert.equal(missing.recommendedActions[0].collectionTarget, "verified payment identity"); assert.ok(missing.confidence >= 0 && missing.confidence <= 1);
const conflicts = service.conflicts("business-1");
assert.equal(conflicts.details.conflicts.length, 1); assert.equal(conflicts.severity, "high");
const risk = service.riskExplanation("business-1");
assert.equal(risk.severity, "medium"); assert.ok(risk.relationshipIds.includes("rel-1")); assert.ok(risk.evidenceIds.includes("ev-relationship"));
const impact = service.changeImpact("business-1");
assert.equal(impact.details.reassessmentRequired, true);
const recommendation = service.recommendation("business-1", "policy-test-2");
assert.equal(recommendation.details.recommendation, "manual_review"); assert.equal(recommendation.details.policyVersion, "policy-test-2"); assert.equal(decisions.length, 1);
assert.throws(() => service.trustExplanation("missing"), /Unknown Trust Graph entity/);
console.log("Intelligence Layer validation passed.");
