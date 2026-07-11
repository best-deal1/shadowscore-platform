import { correlateEvidence } from "../correlation";
import type { EvidenceItem } from "../evidence";
import { buildVerificationDecision } from "./model";
import { confirmedRiskDecisionMatrix } from "./riskPolicy";
import { loadReferenceProviderSnapshots, referenceProviderSnapshot } from "./snapshots";

export const decisionValidationCases = loadReferenceProviderSnapshots().decisionValidationCases;

function item(partial: Pick<EvidenceItem, "id" | "provider" | "category" | "status" | "title" | "description" | "businessImpact"> & { value?: string; source?: string; confidence?: number }): EvidenceItem {
  return {
    source: partial.source || partial.provider,
    confidence: partial.confidence || 90,
    evidenceRefs: [{ id: partial.id, type: "observation", label: partial.title, value: partial.value, source: partial.source || partial.provider }],
    ...partial,
  };
}

const identityMismatchRegressionCases = [
  {
    label: "Isolated email mismatch routes to REVIEW",
    expected: "REVIEW" as const,
    evidenceItems: [
      item({ id: "site", provider: "business_profile", category: "Verified", status: "observed", title: "Website domain", value: "example.com", description: "Website domain: example.com", businessImpact: "Website evidence supports verification coverage." }),
      item({ id: "email", provider: "business_profile", category: "Verified", status: "observed", title: "Contact email", value: "owner@gmail.com", description: "Contact email: owner@gmail.com", businessImpact: "Contact evidence supports verification coverage." }),
    ],
  },
  {
    label: "Isolated company name mismatch routes to REVIEW",
    expected: "REVIEW" as const,
    evidenceItems: [
      item({ id: "business", provider: "business_profile", category: "Verified", status: "observed", title: "Business name", value: "Gadget Deals", description: "Business name: Gadget Deals", businessImpact: "Business profile evidence supports verification coverage." }),
      item({ id: "registry", provider: "registry", category: "Verified", status: "observed", title: "Legal name", value: "Gadget Online Ltd", description: "Legal name: Gadget Online Ltd", businessImpact: "Registry evidence supports verification coverage." }),
    ],
  },
  {
    label: "Verified fraud evidence still produces CONFIRMED RISK",
    expected: "FAIL" as const,
    evidenceItems: [
      item({ id: "fraud", provider: "reputation", category: "Negative", status: "negative", title: "Confirmed fraud evidence", description: "Confirmed fraud signal from reputation evidence.", businessImpact: "Confirmed fraud is verified negative evidence and may block a pass decision." }),
    ],
  },
];

export function runDecisionValidationSuite() {
  const snapshotResults = decisionValidationCases.map((testCase) => {
    const output = buildVerificationDecision({ providerResults: referenceProviderSnapshot(testCase.snapshot), audience: "paid", targetType: testCase.targetType || "website" });
    const passed = testCase.expected.includes(output.decision);
    return {
      label: testCase.label,
      expected: testCase.expected.join(" or "),
      actual: output.decision,
      passed,
      why: output.reasons,
      counts: {
        positiveEvidenceCount: output.positiveEvidenceCount,
        missingEvidenceCount: output.missingEvidenceCount,
        negativeEvidenceCount: output.negativeEvidenceCount,
        verificationConfidence: output.verificationConfidence,
        evidenceCompleteness: output.evidenceCompleteness,
      },
    };
  });

  const regressionResults = identityMismatchRegressionCases.map((testCase) => {
    const output = buildVerificationDecision({ evidenceItems: testCase.evidenceItems, correlationSummary: correlateEvidence({ evidenceItems: testCase.evidenceItems, targetType: "website" }), audience: "paid", targetType: "website" });
    return {
      label: testCase.label,
      expected: testCase.expected,
      actual: output.decision,
      passed: output.decision === testCase.expected,
      why: output.reasons,
      counts: {
        positiveEvidenceCount: output.positiveEvidenceCount,
        missingEvidenceCount: output.missingEvidenceCount,
        negativeEvidenceCount: output.negativeEvidenceCount,
        verificationConfidence: output.verificationConfidence,
        evidenceCompleteness: output.evidenceCompleteness,
      },
    };
  });

  return [...snapshotResults, ...regressionResults];
}

export { confirmedRiskDecisionMatrix };

export const decisionAlgorithmSummary = [
  "PASS requires sufficient positive evidence and zero confirmed negative evidence.",
  "REVIEW is used for missing evidence, incomplete provider coverage, or insufficient confidence when negative evidence is absent.",
  "FAIL requires at least one verified negative condition; missing evidence alone cannot produce FAIL.",
  "Verification confidence and evidence completeness are reported separately from risk/negative evidence.",
];

export const falsePositiveReviewCases = [
  { domain: "barinaeng.co.il", decision: "REVIEW", explanation: "Insufficient independent production evidence in the calibration set; no verified negative evidence is present, so the decision remains review rather than confirmed risk." },
  { domain: "gadgetdeals.co.il", decision: "REVIEW", explanation: "DNS/WHOIS/profile evidence is partial and any identity inconsistency is review-only without independent fraud, phishing, malware, enforcement, sanctions, abuse, or legal/compliance proof." },
  { domain: "ynet.co.il", decision: "PASS", explanation: "Reference evidence has aligned DNS, registration, profile, and no confirmed negative findings." },
  { domain: "stripe.com", decision: "PASS", explanation: "Reference evidence has aligned DNS, registration, profile, and no confirmed negative findings." },
  { domain: "microsoft.com", decision: "PASS", explanation: "Enterprise-strength reference evidence reaches pass with no confirmed negative findings." },
] as const;

export const beforeAfterDecisionMatrix = [
  { scenario: "Missing data only", before: "Could reduce score below FAIL threshold", after: "REVIEW because missing evidence is incomplete coverage, not risk" },
  { scenario: "Incomplete provider coverage", before: "Could be treated as a critical failed check", after: "REVIEW unless verified negative evidence exists" },
  { scenario: "Strong positive evidence", before: "PASS only if score thresholds survive missing-signal penalties", after: "PASS when positive evidence is sufficient and negative evidence count is zero" },
  { scenario: "Verified phishing/malicious/reputation issue", before: "FAIL through score or blocking issue", after: "FAIL through explicit verified negative evidence" },
];
