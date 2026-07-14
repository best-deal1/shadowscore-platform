import assert from "node:assert/strict";
import { buildVerificationDecision } from "./model";
import { loadReferenceProviderSnapshots, referenceProviderSnapshot } from "./snapshots";
import { correlateEvidence } from "../correlation";
import { isValidPhoneCandidate } from "../correlation/relationships";

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
  return { rows, marketplaceIdentityMismatchFixture: { decision: marketplaceIdentityMismatch.decision, missingSignals: marketplaceIdentityMismatch.missingSignals, blockingIssues: marketplaceIdentityMismatch.blockingIssues }, missingDmarc: missingDmarc.decision };
}
