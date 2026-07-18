import { isConfirmedRiskContradiction } from "./riskPolicy";
import type { ContradictionSignal, DecisionIntelligenceDecision, EvidenceAssessment } from "./types";

export function selectDecision(input: { assessment: EvidenceAssessment; contradictions: ContradictionSignal[] }): DecisionIntelligenceDecision {
  const hasVerifiedNegativeEvidence = input.contradictions.some(isConfirmedRiskContradiction);
  if (hasVerifiedNegativeEvidence) return "FAIL";
  const hasMaterialContradiction = input.contradictions.some((signal) => signal.severity === "high" && !isConfirmedRiskContradiction(signal));
  if (hasMaterialContradiction) return "REVIEW";
  if (input.assessment.positiveEvidenceCount >= 3 && input.assessment.negativeEvidenceCount === 0 && input.assessment.confidenceLevel !== "None") return "PASS";
  return "PROCEED_WITH_VERIFICATION";
}

export function recommendationFor(decision: DecisionIntelligenceDecision): string {
  if (decision === "PASS") return "Sufficient evidence was collected and no significant negative indicators were detected.";
  if (decision === "FAIL") return "Confirmed negative indicators require investigation before proceeding.";
  if (decision === "REVIEW") return "Material contradictions or compounding uncertainty require review before proceeding.";
  return "Proceed with verification: no confirmed risk was found, but collect documentation before major commitment.";
}

export function nextActionsFor(input: { decision: DecisionIntelligenceDecision; missingEvidence: string[]; hasContradictions: boolean }): string[] {
  if (input.decision === "FAIL") {
    return [
      "Investigate and resolve the confirmed negative indicators before proceeding.",
      "Document which authoritative source verifies each negative condition.",
      "Re-run the deterministic evaluation after remediation evidence is available.",
    ];
  }

  if (input.decision === "REVIEW" || input.decision === "PROCEED_WITH_VERIFICATION") {
    const missingActions = input.missingEvidence.slice(0, 3).map((item) => `Collect or verify: ${item}.`);
    return missingActions.length > 0
      ? [...missingActions, "Treat missing evidence as incomplete coverage, not as proof of risk."]
      : ["Collect additional public evidence to improve confidence before relying on the conclusion."];
  }

  return ["Archive the evidence chain with the business profile.", "Continue routine monitoring for new confirmed negative signals."];
}
