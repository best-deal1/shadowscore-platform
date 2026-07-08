import { assessEvidence } from "./evidence";
import { nextActionsFor, recommendationFor, selectDecision } from "./rules";
import type { DecisionIntelligenceInput, DecisionIntelligenceOutput, DecisionReasoningStep, EvidenceItem } from "./types";

function evidenceSummary(items: EvidenceItem[]) {
  return items.slice(0, 5).map((item) => `${item.label}: ${item.value}`);
}

function buildReasoning(input: DecisionIntelligenceInput, recommendation: string): DecisionReasoningStep[] {
  const evidence = evidenceSummary(input.evidenceItems);
  const baseEvidence = evidence.length > 0 ? evidence : ["No usable public evidence items were supplied."];
  const profileStep: DecisionReasoningStep = {
    evidence: baseEvidence,
    interpretation: evidence.length > 0
      ? `The supplied evidence supports ${input.businessProfile.investigationCoverage.toLowerCase()} investigation coverage without adding facts beyond the provided items.`
      : "The supplied evidence set is empty, so no positive business conclusion can be drawn.",
    businessMeaning: evidence.length > 0
      ? input.businessProfile.investigationSummary
      : "A trustworthy business conclusion requires public evidence that is not currently present.",
    recommendation,
  };

  const contradictionSteps = input.contradictionSignals.map((signal) => ({
    evidence: signal.evidence.length > 0 ? signal.evidence : [signal.title],
    interpretation: signal.interpretation,
    businessMeaning: signal.businessMeaning,
    recommendation: "Resolve this contradiction before treating the business conclusion as reliable.",
  }));

  return [profileStep, ...contradictionSteps];
}

export function evaluateDecisionEvidence(input: DecisionIntelligenceInput): DecisionIntelligenceOutput {
  const assessment = assessEvidence({
    businessProfile: input.businessProfile,
    executionPlan: input.executionPlan,
    evidenceItems: input.evidenceItems,
  });
  const decision = selectDecision({ assessment, contradictions: input.contradictionSignals });
  const recommendation = recommendationFor(decision);

  return {
    decision,
    confidenceLevel: decision === "Conflicting evidence detected" ? "Low" : assessment.confidenceLevel,
    evidenceCoverage: assessment.evidenceCoverage,
    missingEvidence: assessment.missingEvidence,
    contradictions: input.contradictionSignals,
    reasoning: buildReasoning(input, recommendation),
    recommendation,
    nextActions: nextActionsFor({
      decision,
      missingEvidence: assessment.missingEvidence,
      hasContradictions: input.contradictionSignals.length > 0,
    }),
  };
}
