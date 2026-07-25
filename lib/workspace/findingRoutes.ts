import { resolveWorkspaceActor, WorkspaceAccessError, type SupabaseRequest } from "./actor";
import { supabaseFetch } from "../supabase";
import { FindingRepository } from "./findingRepository";
import { FindingAccessError, FindingConflictError, FindingNotFoundError, FindingService, FindingValidationError } from "./findings";
type Dependencies = { resolveActor: (token?: string) => ReturnType<typeof resolveWorkspaceActor>; service: (token: string) => FindingService };
const defaults: Dependencies = { resolveActor: (token) => resolveWorkspaceActor(token, supabaseFetch as SupabaseRequest), service: (token) => new FindingService(new FindingRepository(supabaseFetch, token)) };
const token = (request: Request) => request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || request.headers.get("cookie")?.match(/(?:^|;\s*)shadowscore_access_token=([^;]+)/)?.[1];
function error(error: unknown) { if (error instanceof WorkspaceAccessError || error instanceof FindingAccessError) return Response.json({ error: error.message }, { status: 401 }); if (error instanceof FindingValidationError) return Response.json({ error: error.message }, { status: 400 }); if (error instanceof FindingNotFoundError) return Response.json({ error: error.message }, { status: 404 }); if (error instanceof FindingConflictError) return Response.json({ error: error.message }, { status: 409 }); return Response.json({ error: "Unable to save the finding." }, { status: 500 }); }
export function createFindingRouteHandlers(deps: Dependencies = defaults) { const run = async (request: Request, action: (service: FindingService, actor: Awaited<ReturnType<Dependencies["resolveActor"]>>) => Promise<unknown>, status = 200) => { try { const access = token(request); const actor = await deps.resolveActor(access); return Response.json(await action(deps.service(access!), actor), { status }); } catch (cause) { return error(cause); } }; return {
  GET: (request: Request, caseId: string) => run(request, (service, actor) => service.list(actor, caseId)),
  POST: (request: Request, caseId: string) => run(request, async (service, actor) => service.create(actor, caseId, await request.json()), 201),
  PATCH: (request: Request, caseId: string, findingId: string) => run(request, async (service, actor) => service.update(actor, caseId, findingId, await request.json())),
  DELETE: (request: Request, caseId: string, findingId: string) => run(request, async (service, actor) => { const body = await request.json(); await service.delete(actor, caseId, findingId, body.version); return { deleted: true }; }),
}; }
