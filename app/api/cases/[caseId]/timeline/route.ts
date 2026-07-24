import { createTimelineRouteHandlers } from "@/lib/workspace/timelineRoutes";

const handlers = createTimelineRouteHandlers();
export async function GET(request: Request, context: RouteContext<"/api/cases/[caseId]/timeline">) {
  return handlers.GET(request, (await context.params).caseId);
}
