import type { ReasoningOutput } from "./reasoningTypes";

export function validateReasoning(output: ReasoningOutput): true {
  const ids = new Set(output.steps.map((step) => step.id));
  for (const step of output.steps) {
    if (step.supportingEvidence.length === 0) throw new Error(`Reasoning step ${step.id} has no supporting evidence.`);
    if (step.confidence < 0 || step.confidence > 100) throw new Error(`Reasoning step ${step.id} has invalid confidence.`);
  }
  for (const edge of output.graph.edges) {
    if ((edge.relationship === "contributes_to" || edge.relationship === "conflicts_with") && edge.from.startsWith("reason-") && !ids.has(edge.from)) throw new Error(`Graph edge references unknown reasoning step ${edge.from}.`);
  }
  return true;
}

export function deterministicReasoningHash(output: ReasoningOutput): string {
  return JSON.stringify(output);
}
