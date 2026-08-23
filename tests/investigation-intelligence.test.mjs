import assert from "node:assert/strict";
import test from "node:test";
import { buildInvestigationIntelligence } from "../lib/investigationIntelligence/index.ts";

const evidence = (overrides) => ({ id: "evidence", source: "registry.example", provider: "registry", category: "Verified", status: "observed", confidence: 90, title: "Business registration", description: "Business registration: Northstar LLC", businessImpact: "Supports identity verification.", evidenceRefs: [{ id: "ref", type: "document", label: "Registry record", source: "registry.example" }], ...overrides });
const graph = { entities: [{ id: "business:1", type: "Business", label: "Northstar LLC", normalizedValue: "northstar llc", aliases: [], attributes: {}, sourceScanIds: ["scan"] }, { id: "domain:1", type: "Domain", label: "northstar.example", normalizedValue: "northstar.example", aliases: [], attributes: {}, sourceScanIds: ["scan"] }], relationships: [{ id: "link:1", type: "OWNS", from: "business:1", to: "domain:1", context: "Registry and website evidence", sourceScanIds: ["scan"] }], graphSummary: { entityCount: 2, relationshipCount: 1, entityTypes: {}, relationshipTypes: {} } };
const correlations = { engineVersion: "test", generatedAt: "2026-01-01T00:00:00.000Z", findings: [], verifiedRelationships: [], missingRelationships: [], unresolvedRelationships: [], contradictions: [], counts: { Confirmed: 0, Likely: 0, Unknown: 0, Contradiction: 0 } };

test("produces analyst decision support, relationship discovery, and section confidence", () => {
  const result = buildInvestigationIntelligence({ evidenceItems: [evidence({})], correlationSummary: correlations, businessFindings: [], knowledgeGraph: graph, generatedAt: "2026-01-01T00:00:00.000Z" });
  assert.equal(result.decisionSupport.outcome, "Proceed");
  assert.match(result.executiveInsight, /no significant warning signals/i);
  assert.equal(result.relationships[0].from, "Northstar LLC");
  assert.deepEqual(result.sectionConfidence.map((section) => section.section), ["Identity", "Relationships", "Risk", "Decision"]);
  assert.ok(result.sectionConfidence.every((section) => section.confidence >= 0 && section.confidence <= 100));
});

test("explains contradictions, risks, impact, evidence, and exact gap remediation", () => {
  const missingOwner = evidence({ id: "owner-gap", category: "Missing", status: "missing", confidence: 65, title: "Beneficial owner record", description: "Ownership record was not returned." });
  const adverse = evidence({ id: "adverse", category: "Negative", status: "negative", confidence: 95, title: "Regulatory enforcement", description: "An authoritative enforcement record was matched.", businessImpact: "The enforcement event may create legal and counterparty exposure." });
  const contradiction = { id: "contradiction:name", relationship: "company_name_consistency", title: "Company name differs across providers", classification: "Contradiction", severity: "critical", explanation: "Registry and marketplace names differ.", evidence: [{ role: "registry", value: "Northstar LLC", evidenceId: "registry-name", source: "registry" }, { role: "seller", value: "Other Trading Ltd", evidenceId: "seller-name", source: "marketplace" }] };
  const registryName = evidence({ id: "registry-name-item", evidenceRefs: [{ id: "registry-name", type: "document", label: "Registry name", source: "registry" }] });
  const sellerName = evidence({ id: "seller-name-item", evidenceRefs: [{ id: "seller-name", type: "document", label: "Seller name", source: "marketplace" }] });
  const result = buildInvestigationIntelligence({ evidenceItems: [missingOwner, adverse, registryName, sellerName], correlationSummary: { ...correlations, contradictions: [contradiction], counts: { ...correlations.counts, Contradiction: 1 } }, businessFindings: [], knowledgeGraph: graph });
  assert.equal(result.decisionSupport.outcome, "Do Not Proceed");
  assert.match(result.contradictions[0].whyItMatters, /commercial decision/i);
  assert.equal(result.risks[0].supportingEvidence[0].id, "ref");
  assert.match(result.risks[0].businessImpact, /legal and counterparty exposure/i);
  assert.match(result.evidenceGaps[0].recommendation, /registry extract and beneficial ownership record/i);
  assert.deepEqual(result.decisionSupport.conditions, [result.evidenceGaps[0].recommendation]);
});

test("routes a standalone technical provider failure to neutral verification instead of do not proceed", () => {
  const failedCollection = evidence({ id: "provider-failure", category: "Negative", status: "negative", confidence: 99, title: "DNS provider unavailable", description: "Technical collection failure: request timed out.", businessImpact: "Provider collection failed." });
  const result = buildInvestigationIntelligence({ evidenceItems: [failedCollection], correlationSummary: correlations, businessFindings: [], knowledgeGraph: graph });
  assert.equal(result.decisionSupport.outcome, "Verification Required");
  assert.equal(result.risks.length, 0);
  assert.match(result.decisionSupport.justification, /uncertainty, not a positive or adverse finding/i);
});
