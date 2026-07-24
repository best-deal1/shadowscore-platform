import { createFindingRouteHandlers } from "@/lib/workspace/findingRoutes";
const handlers = createFindingRouteHandlers();
export async function GET(request: Request, context: RouteContext<"/api/cases/[caseId]/findings">) { return handlers.GET(request, (await context.params).caseId); }
export async function POST(request: Request, context: RouteContext<"/api/cases/[caseId]/findings">) { return handlers.POST(request, (await context.params).caseId); }
