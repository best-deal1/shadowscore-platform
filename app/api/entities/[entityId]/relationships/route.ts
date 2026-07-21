import { getTrustGraphService } from "@/lib/trustGraph";
export async function GET(_request: Request, context: { params: Promise<{ entityId: string }> }) { const { entityId } = await context.params; return Response.json(getTrustGraphService().getRelationships(entityId)); }
