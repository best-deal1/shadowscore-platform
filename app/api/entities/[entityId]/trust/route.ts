import { createTrustGraphRouteHandlers } from "@/lib/trustGraph/routes";
const handler = createTrustGraphRouteHandlers().getTrust;
export async function GET(request: Request, context: { params: Promise<{ entityId: string }> }) { return handler(request, (await context.params).entityId); }
