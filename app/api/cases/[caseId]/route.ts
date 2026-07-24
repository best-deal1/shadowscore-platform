import { createCaseRouteHandlers } from "@/lib/workspace/caseRoutes";
const handlers = createCaseRouteHandlers();
type CaseRouteContext = { params: Promise<{ caseId: string }> };
export async function GET(request: Request, context: CaseRouteContext) { return handlers.GET(request, (await context.params).caseId); }
export async function PATCH(request: Request, context: CaseRouteContext) { return handlers.PATCH(request, (await context.params).caseId); }
