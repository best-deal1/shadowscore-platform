import type { ReasoningContradiction, ReasoningGraph, ReasoningStep } from "./reasoningTypes";

type Input = { steps: ReasoningStep[]; contradictions: ReasoningContradiction[]; decision?: { decision: string } };

export function buildReasoningGraph(input: Input): ReasoningGraph {
  const nodes: ReasoningGraph["nodes"] = [];
  const edges: ReasoningGraph["edges"] = [];
  const seen = new Set<string>();
  const add = (node: ReasoningGraph["nodes"][number]) => { if (!seen.has(node.id)) { seen.add(node.id); nodes.push(node); } };
  const decisionId = `decision-${input.decision?.decision || "pending"}`;
  add({ id: decisionId, label: input.decision?.decision || "Decision pending", kind: "Decision", confidence: input.decision?.decision ? undefined : 0 });
  for (const step of input.steps) {
    add({ id: step.id, label: step.inferredFact, kind: step.kind, confidence: step.confidence });
    edges.push({ from: step.id, to: decisionId, relationship: "contributes_to" });
    for (const evidence of step.supportingEvidence) {
      const evidenceId = `evidence-${evidence.evidenceId}`;
      const providerId = `provider-${evidence.provider}`;
      add({ id: evidenceId, label: evidence.title, kind: "Evidence", confidence: evidence.confidence });
      add({ id: providerId, label: evidence.provider, kind: "Provider" });
      edges.push({ from: evidenceId, to: step.id, relationship: "supports" });
      edges.push({ from: providerId, to: evidenceId, relationship: "supports" });
    }
  }
  for (const contradiction of input.contradictions) {
    const contradictionId = contradiction.id;
    add({ id: contradictionId, label: contradiction.why, kind: "Contradiction" });
    edges.push({ from: contradictionId, to: decisionId, relationship: "contributes_to" });
    for (const evidence of contradiction.conflictingEvidence) edges.push({ from: `evidence-${evidence.evidenceId}`, to: contradictionId, relationship: "conflicts_with" });
  }
  return { nodes: nodes.sort((a, b) => a.id.localeCompare(b.id)), edges: edges.sort((a, b) => `${a.from}:${a.to}:${a.relationship}`.localeCompare(`${b.from}:${b.to}:${b.relationship}`)) };
}
