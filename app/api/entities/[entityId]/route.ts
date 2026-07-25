import { createTrustGraphRouteHandlers } from "@/lib/trustGraph/routes";

const handlers = createTrustGraphRouteHandlers();
type Context = { params: Promise<{ entityId: string }> };

export async function GET(request: Request, context: Context) { return handlers.getEntity(request, (await context.params).entityId); }
export async function PUT(request: Request, context: Context) { return handlers.upsertEntity(request, (await context.params).entityId); }
