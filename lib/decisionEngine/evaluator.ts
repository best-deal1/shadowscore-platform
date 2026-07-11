import { assessEvidence } from "./evidence";
import { isConfirmedRiskCorrelation, isConfirmedRiskContradiction } from "./riskPolicy";
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
  const correlationFindings = input.correlationFindings || [];
  const correlationContradictions = correlationFindings.flatMap((finding) => finding.contradiction ? [finding.contradiction] : []);
  const decision = selectDecision({ assessment, contradictions: [...input.contradictionSignals, ...correlationContradictions.map((finding) => ({ id: finding.id, severity: isConfirmedRiskCorrelation(finding) ? "high" as const : "medium" as const, title: finding.title, evidence: finding.evidence.map((item) => item.value), interpretation: finding.explanation, businessMeaning: isConfirmedRiskCorrelation(finding) ? "Verified negative evidence conflicts with a trusted-company conclusion." : "Identity inconsistency requires review but is not confirmed risk without independent negative evidence." }))] });
  const recommendation = recommendationFor(decision);

  return {
    decision,
    confidenceLevel: decision === "FAIL" ? "Low" : assessment.confidenceLevel,
    evidenceCoverage: assessment.evidenceCoverage,
    verificationConfidence: assessment.evidenceCompleteness,
    evidenceCompleteness: assessment.evidenceCompleteness,
    negativeEvidenceCount: input.contradictionSignals.filter(isConfirmedRiskContradiction).length + correlationContradictions.filter(isConfirmedRiskCorrelation).length + assessment.negativeEvidenceCount,
    positiveEvidenceCount: assessment.positiveEvidenceCount,
    missingEvidenceCount: assessment.missingEvidenceCount,
    findings: [
      ...input.evidenceItems.map((item) => ({ category: "positive" as const, confidence: item.reliabilityWeight, source: item.source, impact: item.label, explanation: String(item.value || item.label) })),
      ...assessment.missingEvidence.map((item) => ({ category: "missing" as const, confidence: 100, source: "decision-engine", impact: item, explanation: "Missing evidence lowers completeness but is not proof of risk." })),
      ...input.contradictionSignals.map((signal) => ({ category: isConfirmedRiskContradiction(signal) ? "negative" as const : "missing" as const, confidence: signal.severity === "high" ? 90 : 70, source: "contradiction-engine", impact: signal.title, explanation: signal.interpretation })),
      ...correlationFindings.map((finding) => ({ category: finding.classification === "Contradiction" && finding.contradiction && isConfirmedRiskCorrelation(finding.contradiction) ? "negative" as const : finding.classification === "Unknown" || finding.classification === "Contradiction" ? "missing" as const : "positive" as const, confidence: finding.confidence, source: "correlation-intelligence", impact: finding.title, explanation: finding.explanation })),
    ],
    missingEvidence: assessment.missingEvidence,
    correlations: correlationFindings,
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
