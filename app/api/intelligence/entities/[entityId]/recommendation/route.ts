import { getIntelligenceService } from "@/lib/intelligence";

export async function POST(request: Request, context: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await context.params;
  let policyVersion = "intelligence-policy-1.0";
  try {
    const body = await request.json() as { policyVersion?: string };
    policyVersion = body.policyVersion || policyVersion;
  } catch { /* An empty body uses the default policy version. */ }
  try {
    return Response.json(getIntelligenceService().recommendation(entityId, policyVersion));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Recommendation could not be generated." }, { status: 404 });
  }
}
