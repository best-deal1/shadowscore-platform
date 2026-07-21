import { buildEvidenceItems } from "../lib/evidence";
import { buildVerificationDecision } from "../lib/decisionEngine/model";
import { correlateEvidence } from "../lib/correlation";
import { loadReferenceProviderSnapshots, referenceProviderSnapshot } from "../lib/decisionEngine/snapshots";
import { buildReasoning, deterministicReasoningHash } from "../lib/reasoning";
import type { EvidenceItem } from "../lib/evidence";

function item(id: string, provider: string, category: EvidenceItem["category"], title: string, value: string, confidence = 90): EvidenceItem {
  return { id, provider, category, status: category === "Verified" ? "observed" : category === "Negative" ? "negative" : "missing", source: provider, confidence, title, description: value ? `${title}: ${value}` : `${title} was not available.`, businessImpact: category === "Verified" ? `${title} supports verification coverage.` : category === "Negative" ? `${title} is verified negative evidence and may block a pass decision.` : `${title} is unresolved; this lowers confidence but is not risk evidence.`, evidenceRefs: [{ id, type: "observation", label: title, value, source: provider }] };
}

function snapshotCase(label: string) {
  const testCase = loadReferenceProviderSnapshots().decisionValidationCases.find((candidate) => candidate.label === label);
  if (!testCase) throw new Error(`Missing snapshot case ${label}`);
  const providerResults = referenceProviderSnapshot(testCase.snapshot);
  const evidenceItems = buildEvidenceItems(providerResults);
  const decision = buildVerificationDecision({ providerResults, audience: "paid", targetType: testCase.targetType || "website" });
  return { label, evidenceItems, decision };
}

const cases = [
  snapshotCase("Microsoft"),
  { label: "Bank Leumi", evidenceItems: [item("bank-reg", "registry", "Verified", "Legal bank registration", "Bank Leumi is registered with banking regulator", 96), item("bank-domain", "dns", "Verified", "Website domain", "bankleumi.co.il", 90), item("bank-mx", "dns", "Verified", "MX record", "Google Workspace", 88)], decision: undefined },
  snapshotCase("GadgetDeals"),
  { label: "Unknown startup", evidenceItems: [item("startup-domain", "dns", "Verified", "Website domain", "unknown-startup.example", 76), item("startup-owner", "whois", "Missing", "Domain ownership", "", 100), item("startup-reg", "registry", "Missing", "Business registry", "", 100)], decision: undefined },
  { label: "Marketplace seller", evidenceItems: [item("seller-profile", "marketplace", "Verified", "Marketplace seller profile", "Seller is active on marketplace", 88), item("seller-payout", "payment", "Missing", "Payment processor relationship", "", 100), item("seller-domain", "dns", "Verified", "Website domain", "seller.example", 82)], decision: undefined },
  { label: "Conflicting ownership", evidenceItems: [item("site-owner", "business_profile", "Verified", "Business name", "Northwind LLC", 90), item("registry-owner", "registry", "Negative", "Business name mismatch", "Registry says Contoso LLC", 92)], decision: undefined },
  { label: "Lookalike domain", evidenceItems: [item("lookalike-dns", "dns", "Verified", "Website domain", "micros0ft-login.example", 80), item("lookalike-rep", "reputation", "Negative", "Confirmed phishing evidence", "Lookalike domain reported for phishing", 95)], decision: undefined },
];

export function runReasoningValidationSuite() {
  return cases.map((testCase) => {
    const decision = testCase.decision || buildVerificationDecision({ evidenceItems: testCase.evidenceItems, audience: "paid", targetType: "website" });
    const correlationSummary = correlateEvidence({ evidenceItems: testCase.evidenceItems, targetType: "website" });
    const first = buildReasoning({ evidenceItems: testCase.evidenceItems, correlationSummary, decision });
    const second = buildReasoning({ evidenceItems: testCase.evidenceItems, correlationSummary, decision });
    const relationshipEvidenceIdsAreComplete = correlationSummary.contradictions.every((contradiction) => {
      const expected = [...new Set(contradiction.evidence.map((evidence) => evidence.evidenceId))].sort();
      const reasoning = first.contradictions.find((candidate) => JSON.stringify(candidate.relationshipEvidenceIds) === JSON.stringify(expected));
      if (!reasoning) return false;
      return JSON.stringify(reasoning.relationshipEvidenceIds) === JSON.stringify(expected) && expected.every((id) => reasoning.conflictingEvidence.some((evidence) => evidence.evidenceId === id));
    });
    const passed = deterministicReasoningHash(first) === deterministicReasoningHash(second) && first.steps.every((step) => step.supportingEvidence.length > 0) && relationshipEvidenceIdsAreComplete;
    return { label: testCase.label, passed, steps: first.steps.length, graphNodes: first.graph.nodes.length, graphEdges: first.graph.edges.length, decision: decision.decision, confidence: decision.verificationConfidence, graph: JSON.stringify(first.graph), inferenceChain: first.steps.map((step) => `${step.observation} -> ${step.inferredFact} -> ${step.contribution}`).join(" | "), evidenceTrace: first.steps.map((step) => `${step.id}: ${step.supportingEvidence.map((evidence) => `${evidence.provider}/${evidence.evidenceId}`).join(",")}`).join(" | "), decisionExplanation: first.summary.decisionBasis.join(" "), confidencePropagation: first.summary.confidencePropagation.join(" | ") };
  });
}
