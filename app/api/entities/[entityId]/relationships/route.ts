import { createTrustGraphRouteHandlers } from "@/lib/trustGraph/routes";
const handler = createTrustGraphRouteHandlers().getRelationships;
export async function GET(request: Request, context: { params: Promise<{ entityId: string }> }) { return handler(request, (await context.params).entityId); }
