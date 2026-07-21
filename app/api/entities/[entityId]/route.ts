import { getTrustGraphService, type UpsertEntityInput } from "@/lib/trustGraph";

export async function GET(_request: Request, context: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await context.params;
  const entity = getTrustGraphService().getEntity(entityId);
  return entity ? Response.json(entity) : Response.json({ error: "Entity not found." }, { status: 404 });
}

export async function PUT(request: Request, context: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await context.params;
  const input = await request.json() as Omit<UpsertEntityInput, "id">;
  return Response.json(getTrustGraphService().upsertEntity({ ...input, id: entityId }));
}
