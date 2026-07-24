import { createFindingRouteHandlers } from "@/lib/workspace/findingRoutes";
const handlers = createFindingRouteHandlers();
export async function PATCH(request: Request, context: RouteContext<"/api/cases/[caseId]/findings/[findingId]">) { const params = await context.params; return handlers.PATCH(request, params.caseId, params.findingId); }
export async function DELETE(request: Request, context: RouteContext<"/api/cases/[caseId]/findings/[findingId]">) { const params = await context.params; return handlers.DELETE(request, params.caseId, params.findingId); }
