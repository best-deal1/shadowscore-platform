import { getTrustGraphService, type CreateRelationshipInput } from "@/lib/trustGraph";

export async function POST(request: Request) {
  try {
    const input = await request.json() as CreateRelationshipInput;
    return Response.json(getTrustGraphService().createRelationship(input), { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Relationship could not be recorded." }, { status: 400 });
  }
}
