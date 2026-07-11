import { buildVerificationDecision } from "./model";
import { loadReferenceProviderSnapshots, referenceProviderSnapshot } from "./snapshots";

export const decisionValidationCases = loadReferenceProviderSnapshots().decisionValidationCases;

export function runDecisionValidationSuite() {
  return decisionValidationCases.map((testCase) => {
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
}

export const decisionAlgorithmSummary = [
  "PASS requires sufficient positive evidence and zero confirmed negative evidence.",
  "REVIEW is used for missing evidence, incomplete provider coverage, or insufficient confidence when negative evidence is absent.",
  "FAIL requires at least one verified negative condition; missing evidence alone cannot produce FAIL.",
  "Verification confidence and evidence completeness are reported separately from risk/negative evidence.",
];

export const beforeAfterDecisionMatrix = [
  { scenario: "Missing data only", before: "Could reduce score below FAIL threshold", after: "REVIEW because missing evidence is incomplete coverage, not risk" },
  { scenario: "Incomplete provider coverage", before: "Could be treated as a critical failed check", after: "REVIEW unless verified negative evidence exists" },
  { scenario: "Strong positive evidence", before: "PASS only if score thresholds survive missing-signal penalties", after: "PASS when positive evidence is sufficient and negative evidence count is zero" },
  { scenario: "Verified phishing/malicious/reputation issue", before: "FAIL through score or blocking issue", after: "FAIL through explicit verified negative evidence" },
];
