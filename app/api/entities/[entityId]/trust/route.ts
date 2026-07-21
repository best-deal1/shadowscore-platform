import { getTrustGraphService } from "@/lib/trustGraph";
export async function GET(_request: Request, context: { params: Promise<{ entityId: string }> }) { const { entityId } = await context.params; const trust = getTrustGraphService().getTrust(entityId); return trust ? Response.json(trust) : Response.json({ error: "Trust record not found." }, { status: 404 }); }
