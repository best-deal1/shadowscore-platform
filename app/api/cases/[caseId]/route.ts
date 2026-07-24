import { createCaseRouteHandlers } from "@/lib/workspace/caseRoutes";
const handlers = createCaseRouteHandlers();
export async function GET(request: Request, context: RouteContext<"/api/cases/[caseId]">) { return handlers.GET(request, (await context.params).caseId); }
export async function PATCH(request: Request, context: RouteContext<"/api/cases/[caseId]">) { return handlers.PATCH(request, (await context.params).caseId); }
