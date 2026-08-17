import assert from "node:assert/strict";
import { buildVerificationDecision } from "./model";
import { loadReferenceProviderSnapshots, referenceProviderSnapshot } from "./snapshots";
import { correlateEvidence } from "../correlation";
import { isValidPhoneCandidate } from "../correlation/relationships";
import { applicableEvidence, buildEvidenceItems } from "../evidence";
import { buildBusinessIntelligence } from "../businessIntelligence";
import { buildInvestigationIntelligence } from "../investigationIntelligence";

export function runDecisionIntegrityValidationSuite() {
  const snapshots = loadReferenceProviderSnapshots();
  const realDomains = ["stripe.com", "ynet.co.il", "bankhapoalim.co.il", "gadgetdeals.co.il"] as const;
  const rows = realDomains.map((domain) => {
    const integrityCase = snapshots.integrityCases[domain];
    if (typeof integrityCase === "string") throw new Error(`Invalid integrity case metadata for ${domain}`);
    const output = buildVerificationDecision({ providerResults: referenceProviderSnapshot(integrityCase.snapshot), audience: "free", targetType: "website" });
    assert.notEqual(output.decision, "FAIL", `${domain} must never be CONFIRMED RISK`);
    assert.ok(!output.blockingIssues.includes("Marketplace seller differs from company"), `${domain} marketplace contradiction`);
    assert.ok(!output.missingSignals.some((s) => /marketplace|payment|compliance|aaaa|cname/i.test(s)), `${domain} has invalid material gap`);
    assert.ok(!output.reasons.some((s) => /high-trust public domain/i.test(s)), `${domain} local reputation increased trust`);
    return { domain, before: "CONFIRMED RISK from Marketplace seller differs from company", after: output.decision, blockingIssues: output.blockingIssues };
  });

  const marketplaceIdentityMismatch = buildVerificationDecision({ providerResults: referenceProviderSnapshot(snapshots.integrityCases.negativeMarketplace), audience: "paid", targetType: "marketplaceSeller" });
  assert.equal(marketplaceIdentityMismatch.decision, "REVIEW", "marketplace identity mismatch without enforcement evidence routes to REVIEW");
  assert.ok(marketplaceIdentityMismatch.missingSignals.includes("Marketplace seller differs from company"));
  assert.ok(!marketplaceIdentityMismatch.blockingIssues.includes("Marketplace seller differs from company"));

  const missingDmarc = buildVerificationDecision({ providerResults: referenceProviderSnapshot(snapshots.integrityCases.missingDmarc), audience: "free", targetType: "website" });
  assert.notEqual(missingDmarc.decision, "FAIL", "DMARC absence alone must not be CONFIRMED RISK");

  assert.equal(isValidPhoneCandidate("2026-07-11"), false, "date rejected as phone");
  assert.equal(isValidPhoneCandidate("123456789012"), false, "numeric ID rejected as phone");

  const websiteCorrelation = correlateEvidence({ evidenceItems: [], targetType: "website" });
  assert.equal(websiteCorrelation.contradictions.some((c) => c.title === "Marketplace seller differs from company"), false);

  const stripeCase = snapshots.integrityCases["stripe.com"];
  if (typeof stripeCase === "string") throw new Error("Invalid Stripe integrity metadata");
  const stripeProviderResults = referenceProviderSnapshot(stripeCase.snapshot);
  const stripeRawEvidence = buildEvidenceItems(stripeProviderResults);
  const stripeEvidence = applicableEvidence(stripeRawEvidence, "website");
  const stripeCorrelation = correlateEvidence({ evidenceItems: stripeEvidence, targetType: "website" });
  const stripeBusinessIntelligence = buildBusinessIntelligence(stripeProviderResults, "2026-07-11T00:00:00.000Z");
  const stripeInvestigationIntelligence = buildInvestigationIntelligence({
    evidenceItems: stripeEvidence,
    correlationSummary: stripeCorrelation,
    businessFindings: stripeBusinessIntelligence.findings,
    knowledgeGraph: { entities: [], relationships: [], graphSummary: { entityCount: 0, relationshipCount: 0, entityTypes: {} as never, relationshipTypes: {} as never } },
    generatedAt: "2026-07-11T00:00:00.000Z",
  });
  const stripeDecision = buildVerificationDecision({ providerResults: stripeProviderResults, evidenceItems: stripeEvidence, correlationSummary: stripeCorrelation, audience: "free", targetType: "website" });
  const invalidGap = /marketplace|payment|compliance|aaaa|cname/i;
  assert.ok(stripeRawEvidence.some((item) => /AAAA records|CNAME records/i.test(item.title)), "Stripe fixture preserves raw optional DNS observations");
  assert.ok(!stripeEvidence.some((item) => invalidGap.test(item.title)), "optional Stripe observations do not become applicable evidence");
  assert.ok(!stripeCorrelation.missingRelationships.some((item) => invalidGap.test(item.title)), "optional Stripe observations do not become correlation gaps");
  assert.ok(!stripeInvestigationIntelligence.evidenceGaps.some((item) => invalidGap.test(item.missingEvidence)), "optional Stripe observations do not become investigation gaps");
  assert.equal(stripeBusinessIntelligence.findings.some((item) => item.direction !== "supports_credibility"), false, "a domain and business name are not conflicting identity values");
  assert.equal(stripeInvestigationIntelligence.risks.some((item) => item.severity === "high" || item.severity === "critical"), false, "Stripe does not receive a fabricated high-severity risk");
  assert.ok(!stripeDecision.missingSignals.some((item) => invalidGap.test(item)), "optional Stripe observations do not become decision gaps");
  assert.equal(stripeDecision.decision, "PASS");
  return { rows, stripePipelineRegression: { providerResults: stripeProviderResults.length, rawEvidenceItems: stripeRawEvidence.length, applicableEvidenceItems: stripeEvidence.length, correlationContradictions: stripeCorrelation.contradictions.length, businessFindings: stripeBusinessIntelligence.findings.length, investigationGaps: stripeInvestigationIntelligence.evidenceGaps.map((item) => item.missingEvidence), decision: stripeDecision.decision, missingSignals: stripeDecision.missingSignals }, marketplaceIdentityMismatchFixture: { decision: marketplaceIdentityMismatch.decision, missingSignals: marketplaceIdentityMismatch.missingSignals, blockingIssues: marketplaceIdentityMismatch.blockingIssues }, missingDmarc: missingDmarc.decision };
}
