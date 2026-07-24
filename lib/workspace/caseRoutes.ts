import { resolveWorkspaceActor, WorkspaceAccessError, type SupabaseRequest } from "./actor.ts";
import { CaseAccessError, CaseConflictError, CaseNotFoundError, CaseService, CaseValidationError, type CreateCaseInput, type UpdateCaseInput } from "./cases.ts";
import { CaseRepository } from "./caseRepository.ts";
import { supabaseFetch } from "../supabase.ts";

type Dependencies = { resolveActor: (token: string | undefined) => ReturnType<typeof resolveWorkspaceActor>; service: (token: string) => CaseService };
const defaultDependencies: Dependencies = { resolveActor: (token) => resolveWorkspaceActor(token, supabaseFetch as SupabaseRequest), service: (token) => new CaseService(new CaseRepository(supabaseFetch, token)) };

function errorResponse(error: unknown) {
  if (error instanceof WorkspaceAccessError || error instanceof CaseAccessError) return Response.json({ error: error.message }, { status: 401 });
  if (error instanceof CaseValidationError) return Response.json({ error: error.message }, { status: 400 });
  if (error instanceof CaseConflictError) return Response.json({ error: error.message }, { status: 409 });
  if (error instanceof CaseNotFoundError) return Response.json({ error: error.message }, { status: 404 });
  return Response.json({ error: "Unable to process the case request." }, { status: 500 });
}

function token(request: Request) { return request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""); }
export function createCaseRouteHandlers(dependencies: Dependencies = defaultDependencies) {
  return {
    async POST(request: Request) {
      try {
        const actor = await dependencies.resolveActor(token(request));
        const body = await request.json().catch(() => null) as CreateCaseInput | null;
        if (!body) throw new CaseValidationError("A JSON request body is required.");
        return Response.json(await dependencies.service(token(request)!).create(actor, body), { status: 201 });
      } catch (error) { return errorResponse(error); }
    },
    async GET(request: Request, publicId: string) {
      try { const actor = await dependencies.resolveActor(token(request)); return Response.json(await dependencies.service(token(request)!).get(actor, publicId)); } catch (error) { return errorResponse(error); }
    },
    async PATCH(request: Request, publicId: string) {
      try {
        const actor = await dependencies.resolveActor(token(request));
        const body = await request.json().catch(() => null) as UpdateCaseInput | null;
        if (!body) throw new CaseValidationError("A JSON request body is required.");
        return Response.json(await dependencies.service(token(request)!).update(actor, publicId, body));
      } catch (error) { return errorResponse(error); }
    },
  };
}
