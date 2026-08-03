import { getWorkspaceAccessToken } from "@/lib/workspace/actor.server";
import { resolveWorkspaceActor, WorkspaceAccessError } from "@/lib/workspace/actor";
import { CaseRepository } from "@/lib/workspace/caseRepository";
import { CaseAccessError, CaseConflictError, CaseNotFoundError, CaseService, CaseValidationError } from "@/lib/workspace/cases";
import { supabaseFetch } from "@/lib/supabase";

export async function PATCH(request: Request, context: RouteContext<"/api/workspace/investigations/[caseId]">) {
  const { caseId } = await context.params;
  const body = await request.json().catch(() => null) as { status?: unknown; version?: unknown } | null;
  if ((body?.status !== "archived" && body?.status !== "closed") || !Number.isInteger(body?.version)) return Response.json({ error: "A valid lifecycle status and version are required." }, { status: 400 });
  try {
    const accessToken = await getWorkspaceAccessToken();
    if (!accessToken) return Response.json({ error: "Authentication is required." }, { status: 401 });
    const actor = await resolveWorkspaceActor(accessToken, supabaseFetch);
    const investigation = await new CaseService(new CaseRepository(supabaseFetch, accessToken)).update(actor, caseId, { status: body.status, version: body.version as number });
    return Response.json({ investigation });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) return Response.json({ error: "Authentication is required." }, { status: 401 });
    if (error instanceof CaseValidationError) return Response.json({ error: error.message }, { status: 400 });
    if (error instanceof CaseAccessError) return Response.json({ error: error.message }, { status: 403 });
    if (error instanceof CaseNotFoundError) return Response.json({ error: error.message }, { status: 404 });
    if (error instanceof CaseConflictError) return Response.json({ error: "This investigation changed. Refresh and try again." }, { status: 409 });
    console.error("Workspace investigation lifecycle update failed.", { caseId, error });
    return Response.json({ error: "The investigation could not be updated. Try again." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/workspace/investigations/[caseId]">) {
  const { caseId } = await context.params;

  try {
    const accessToken = await getWorkspaceAccessToken();
    if (!accessToken) return Response.json({ error: "Authentication is required." }, { status: 401 });
    const actor = await resolveWorkspaceActor(accessToken, supabaseFetch);
    await new CaseService(new CaseRepository(supabaseFetch, accessToken)).delete(actor, caseId);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) return Response.json({ error: "Authentication is required." }, { status: 401 });
    if (error instanceof CaseValidationError) return Response.json({ error: error.message }, { status: 400 });
    if (error instanceof CaseAccessError) return Response.json({ error: error.message }, { status: 403 });
    if (error instanceof CaseNotFoundError) return Response.json({ error: error.message }, { status: 404 });
    console.error("Workspace investigation deletion failed.", { caseId, error });
    return Response.json({ error: "The investigation could not be deleted. Try again." }, { status: 500 });
  }
}
