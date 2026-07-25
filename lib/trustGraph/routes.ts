import { supabaseFetch } from "../supabase.ts";
import { resolveWorkspaceActor, WorkspaceAccessError, type SupabaseRequest, type WorkspaceActor } from "../workspace/actor.ts";
import { getTrustGraphService, TrustGraphAccessError, TrustGraphNotFoundError, type TrustGraphService } from "./service.ts";
import type { CreateRelationshipInput, RecordDecisionInput, TrustGraphTrust, UpsertEntityInput } from "./types.ts";

type Dependencies = {
  resolveActor: (token: string | undefined) => Promise<WorkspaceActor>;
  service: (actor: WorkspaceActor) => TrustGraphService;
};

const defaults: Dependencies = {
  resolveActor: (token) => resolveWorkspaceActor(token, supabaseFetch as SupabaseRequest),
  service: getTrustGraphService,
};

function accessToken(request: Request) {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)shadowscore_access_token=([^;]+)/)?.[1];
  return bearer || (cookie ? decodeURIComponent(cookie) : undefined);
}

function failure(error: unknown) {
  if (error instanceof WorkspaceAccessError) return Response.json({ error: error.message }, { status: 401 });
  if (error instanceof TrustGraphAccessError) return Response.json({ error: error.message }, { status: 403 });
  if (error instanceof TrustGraphNotFoundError) return Response.json({ error: error.message }, { status: 404 });
  if (error instanceof SyntaxError) return Response.json({ error: "A valid JSON request body is required." }, { status: 400 });
  return Response.json({ error: "Unable to process the Trust Graph request." }, { status: 500 });
}

export function createTrustGraphRouteHandlers(dependencies: Dependencies = defaults) {
  const run = async (request: Request, action: (service: TrustGraphService) => unknown | Promise<unknown>, status = 200) => {
    try {
      const actor = await dependencies.resolveActor(accessToken(request));
      return Response.json(await action(dependencies.service(actor)), { status });
    } catch (error) {
      return failure(error);
    }
  };

  return {
    getEntity: (request: Request, entityId: string) => run(request, (service) => {
      const entity = service.getEntity(entityId);
      if (!entity) throw new TrustGraphNotFoundError("Trust Graph entity not found.");
      return entity;
    }),
    upsertEntity: (request: Request, entityId: string) => run(request, async (service) => {
      const input = await request.json() as Omit<UpsertEntityInput, "id">;
      return service.upsertEntity({ ...input, id: entityId });
    }),
    getTimeline: (request: Request, entityId: string) => run(request, (service) => service.getTimeline(entityId)),
    getTrust: (request: Request, entityId: string) => run(request, (service) => {
      const trust = service.getTrust(entityId);
      if (!trust) throw new TrustGraphNotFoundError("Trust record not found.");
      return trust;
    }),
    getRelationships: (request: Request, entityId: string) => run(request, (service) => service.getRelationships(entityId)),
    getDecisions: (request: Request, entityId: string) => run(request, (service) => service.getDecisions(entityId)),
    setTrust: (request: Request) => run(request, async (service) => service.setTrust(await request.json() as TrustGraphTrust)),
    createRelationship: (request: Request) => run(request, async (service) => service.createRelationship(await request.json() as CreateRelationshipInput), 201),
    recordDecision: (request: Request) => run(request, async (service) => service.recordDecision(await request.json() as RecordDecisionInput), 201),
  };
}
