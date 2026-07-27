import assert from "node:assert/strict";
import test from "node:test";

import { buildVerificationDecision } from "../lib/decisionEngine/model.ts";
import { buildEvidenceItems } from "../lib/evidence/builder.ts";
import { classifyRegulatoryRecord } from "../lib/evidence/regulatoryClassification.ts";

function providerResult(evidence) {
  return { providerId: "reputation", providerVersion: "test", status: "completed", startedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T00:00:00.000Z", duration: 0, findings: [], evidence, metadata: { authoritative: true }, errors: [] };
}

test("classifies distinct authoritative legal and regulatory events", () => {
  assert.equal(classifyRegulatoryRecord({ form: "10-K" }), "routine");
  assert.equal(classifyRegulatoryRecord({ text: "SEC enforcement action and settled charges" }), "regulatory_action");
  assert.equal(classifyRegulatoryRecord({ text: "SEC charged the company with securities fraud" }), "regulatory_action");
  assert.equal(classifyRegulatoryRecord({ text: "Civil lawsuit and injunction" }), "litigation");
  assert.equal(classifyRegulatoryRecord({ text: "DOJ criminal conviction" }), "criminal_enforcement");
  assert.equal(classifyRegulatoryRecord({ text: "Chapter 11 bankruptcy" }), "bankruptcy");
  assert.equal(classifyRegulatoryRecord({ text: "OFAC sanctions listing" }), "sanctions");
});

test("routine filings support coverage without becoming confirmed risk", () => {
  const evidenceItems = buildEvidenceItems([providerResult([{ id: "routine", type: "document", label: "Routine SEC filing", value: "10-K", source: "https://www.sec.gov/filing", regulatoryClassification: "routine", authoritative: true }])]);
  const decision = buildVerificationDecision({ evidenceItems, providerResults: [providerResult([])], audience: "paid", targetType: "business" });
  assert.equal(evidenceItems[0].category, "Verified");
  assert.notEqual(decision.decision, "FAIL");
  assert.equal(decision.negativeEvidenceCount, 0);
});

for (const regulatoryClassification of ["regulatory_action", "litigation", "criminal_enforcement", "bankruptcy", "sanctions"]) {
  test(`${regulatoryClassification} drives a confirmed-risk decision`, () => {
    const evidenceItems = buildEvidenceItems([providerResult([{ id: regulatoryClassification, type: "document", label: `Authoritative ${regulatoryClassification}`, value: "Official record", source: "https://www.sec.gov/official-record", regulatoryClassification, authoritative: true }])]);
    const decision = buildVerificationDecision({ evidenceItems, providerResults: [providerResult([])], audience: "paid", targetType: "business" });
    assert.equal(evidenceItems[0].category, "Negative");
    assert.equal(decision.decision, "FAIL");
    assert.equal(decision.canonicalDecision.decisionOutcome, "DO_NOT_PROCEED");
    assert.ok(decision.negativeEvidenceCount >= 1);
  });
}

test("an unverified classification cannot create confirmed risk", () => {
  const evidenceItems = buildEvidenceItems([providerResult([{ id: "claim", type: "document", label: "Bankruptcy claim", value: "Unverified claim", source: "submitted text", regulatoryClassification: "bankruptcy", authoritative: false }])]);
  const decision = buildVerificationDecision({ evidenceItems, providerResults: [providerResult([])], audience: "paid", targetType: "business" });
  assert.equal(evidenceItems[0].category, "Verified");
  assert.notEqual(decision.decision, "FAIL");
});
