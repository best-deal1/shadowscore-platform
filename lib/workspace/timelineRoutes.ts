import { resolveWorkspaceActor, WorkspaceAccessError, type SupabaseRequest } from "./actor";
import { supabaseFetch } from "../supabase";
import { TimelineRepository } from "./timelineRepository";
import { TimelineAccessError, TimelineNotFoundError, TimelineService, TimelineValidationError } from "./timeline";

type Dependencies = { resolveActor: (token: string | undefined) => ReturnType<typeof resolveWorkspaceActor>; service: (token: string) => TimelineService };
const defaults: Dependencies = { resolveActor: (token) => resolveWorkspaceActor(token, supabaseFetch as SupabaseRequest), service: (token) => new TimelineService(new TimelineRepository(supabaseFetch, token)) };
const token = (request: Request) => {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (bearer) return bearer;
  return request.headers.get("cookie")?.match(/(?:^|;\s*)shadowscore_access_token=([^;]+)/)?.[1];
};

function errorResponse(error: unknown) {
  if (error instanceof WorkspaceAccessError || error instanceof TimelineAccessError) return Response.json({ error: error.message }, { status: 401 });
  if (error instanceof TimelineValidationError) return Response.json({ error: error.message }, { status: 400 });
  if (error instanceof TimelineNotFoundError) return Response.json({ error: error.message }, { status: 404 });
  return Response.json({ error: "Unable to load the activity timeline." }, { status: 500 });
}

export function createTimelineRouteHandlers(dependencies: Dependencies = defaults) {
  return { async GET(request: Request, caseId: string) {
    try {
      const actor = await dependencies.resolveActor(token(request));
      const url = new URL(request.url);
      const category = url.searchParams.get("category") ?? undefined;
      const cursor = url.searchParams.get("cursor") ?? undefined;
      const limitValue = url.searchParams.get("limit");
      const limit = limitValue === null ? undefined : Number(limitValue);
      return Response.json(await dependencies.service(token(request)!).list(actor, caseId, { category: category as never, cursor, limit }));
    } catch (error) { return errorResponse(error); }
  } };
}
