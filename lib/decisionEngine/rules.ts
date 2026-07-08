import type { ContradictionSignal, DecisionIntelligenceDecision, EvidenceAssessment } from "./types";

export function selectDecision(input: { assessment: EvidenceAssessment; contradictions: ContradictionSignal[] }): DecisionIntelligenceDecision {
  const hasMaterialContradiction = input.contradictions.some((signal) => signal.severity === "medium" || signal.severity === "high");
  if (hasMaterialContradiction) return "Conflicting evidence detected";
  if (input.assessment.evidenceCoverage === "Strong") return "Strong public evidence";
  if (input.assessment.evidenceCoverage === "Partial" || input.assessment.evidenceCoverage === "Limited") return "Limited public evidence";
  return "Insufficient evidence";
}

export function recommendationFor(decision: DecisionIntelligenceDecision): string {
  if (decision === "Strong public evidence") {
    return "Proceed with normal business review using the documented public evidence; keep records attached to the business file.";
  }
  if (decision === "Limited public evidence") {
    return "Do not treat the business as fully validated; request additional identity, domain, or marketplace documentation before relying on it.";
  }
  if (decision === "Conflicting evidence detected") {
    return "Pause the business conclusion until the contradictions are resolved with authoritative documentation.";
  }
  return "Evidence is insufficient to reach a trustworthy business conclusion; collect more public evidence before deciding.";
}

export function nextActionsFor(input: { decision: DecisionIntelligenceDecision; missingEvidence: string[]; hasContradictions: boolean }): string[] {
  if (input.hasContradictions) {
    return [
      "Resolve each contradiction against the most authoritative public source available.",
      "Document which evidence item supersedes or invalidates the conflicting signal.",
      "Re-run the deterministic evaluation after contradictions are resolved.",
    ];
  }

  if (input.decision === "Insufficient evidence") {
    return [
      "Collect the missing evidence categories before making a business conclusion.",
      "Verify business identity and domain control from public sources.",
      "Re-evaluate only after evidence items are attached.",
    ];
  }

  const missingActions = input.missingEvidence.slice(0, 3).map((item) => `Collect or verify: ${item}.`);
  return missingActions.length > 0 ? missingActions : ["Archive the evidence chain with the business profile.", "Continue routine monitoring for new contradictory signals."];
}
