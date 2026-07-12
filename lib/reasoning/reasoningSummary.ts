import type { ReasoningContradiction, ReasoningStep, ReasoningSummary } from "./reasoningTypes";

type Input = { steps: ReasoningStep[]; contradictions: ReasoningContradiction[]; decision?: { decision: string; reasons?: string[]; verificationConfidence?: number } };

export function summarizeReasoning(input: Input): ReasoningSummary {
  const positive = input.steps.filter((step) => step.contribution === "positive").sort((a, b) => b.confidence - a.confidence || a.id.localeCompare(b.id));
  const unresolved = input.steps.flatMap((step) => step.unresolvedQuestions).sort();
  return {
    keyConclusions: positive.slice(0, 5).map((step) => `${step.inferredFact} (${step.confidence}/100).`),
    remainingQuestions: unresolved.length > 0 ? unresolved : ["No unresolved questions were produced by the available evidence."],
    decisionBasis: input.decision ? [`Decision ${input.decision.decision} emerges from ${positive.length} positive, ${unresolved.length} unresolved, and ${input.contradictions.length} contradiction reasoning paths.`, ...(input.decision.reasons || [])] : ["Decision has not been supplied to the reasoning layer."],
    confidencePropagation: input.steps.map((step) => `${step.id}: evidence confidence ${step.supportingEvidence.map((item) => item.confidence).join("+") || "none"}, assumptions ${step.assumptions.length}, propagated ${step.confidence}/100.`),
  };
}
