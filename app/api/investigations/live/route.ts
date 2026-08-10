import { getWorkspaceAccessToken } from "@/lib/workspace/actor.server";
import { resolveWorkspaceActor, WorkspaceAccessError } from "@/lib/workspace/actor";
import { investigateLive } from "@/lib/investigationCollection";
import type { InvestigationInputKind } from "@/lib/investigationEngine/types";
import { supabaseFetch } from "@/lib/supabase";

const SEED_TYPES = new Set<InvestigationInputKind>(["email", "phone", "person", "company", "registration_number", "domain", "marketplace_identity"]);

export async function POST(request: Request) {
  try {
    const token = await getWorkspaceAccessToken();
    await resolveWorkspaceActor(token, supabaseFetch);
    const body = await request.json().catch(() => null) as { kind?: unknown; value?: unknown } | null;
    if (typeof body?.kind !== "string" || !SEED_TYPES.has(body.kind as InvestigationInputKind) || typeof body.value !== "string" || !body.value.trim()) {
      return Response.json({ error: "A valid investigation seed type and value are required." }, { status: 422 });
    }
    const investigation = await investigateLive({ kind: body.kind as InvestigationInputKind, value: body.value }, { logger: console });
    return Response.json({ investigation }, { status: 200 });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) return Response.json({ error: "Authentication is required." }, { status: 401 });
    console.error("Live investigation failed.", { error });
    return Response.json({ error: "The live investigation could not be completed. Try again." }, { status: 502 });
  }
}
