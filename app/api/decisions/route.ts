import { getTrustGraphService, type RecordDecisionInput } from "@/lib/trustGraph";

export async function POST(request: Request) {
  try {
    const input = await request.json() as RecordDecisionInput;
    return Response.json(getTrustGraphService().recordDecision(input), { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Decision could not be recorded." }, { status: 400 });
  }
}
