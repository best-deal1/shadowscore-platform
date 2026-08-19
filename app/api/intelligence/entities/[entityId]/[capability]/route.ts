import { getIntelligenceService } from "@/lib/intelligence";

type Capability = "trust-explanation" | "risk-explanation" | "missing-evidence" | "conflicts" | "relationship-insights" | "change-impact";

export async function GET(_request: Request, context: { params: Promise<{ entityId: string; capability: Capability }> }) {
  const { entityId, capability } = await context.params;
  const intelligence = getIntelligenceService();
  try {
    const result = ({
      "trust-explanation": () => intelligence.trustExplanation(entityId),
      "risk-explanation": () => intelligence.riskExplanation(entityId),
      "missing-evidence": () => intelligence.missingEvidence(entityId),
      conflicts: () => intelligence.conflicts(entityId),
      "relationship-insights": () => intelligence.relationshipInsights(entityId),
      "change-impact": () => intelligence.changeImpact(entityId),
    } as const)[capability]?.();
    return result ? Response.json(result) : Response.json({ error: "Unknown intelligence capability." }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Intelligence result could not be generated." }, { status: 404 });
  }
}
