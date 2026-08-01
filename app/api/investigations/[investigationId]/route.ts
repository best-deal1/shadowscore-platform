import { NextResponse } from "next/server";
import { getWorkspaceAccessToken } from "@/lib/workspace/actor.server";
import { resolveWorkspaceActor, WorkspaceAccessError } from "@/lib/workspace/actor";
import { SupabaseInvestigationRepository } from "@/lib/investigation";
import { supabaseFetch } from "@/lib/supabase";

export async function GET(_request: Request, context: RouteContext<"/api/investigations/[investigationId]">) {
  try {
    const accessToken = await getWorkspaceAccessToken();
    const actor = await resolveWorkspaceActor(accessToken, supabaseFetch);
    const repository = new SupabaseInvestigationRepository(supabaseFetch, accessToken!, { userId: actor.userId, organizationId: actor.organizationId, email: actor.email });
    const { investigationId } = await context.params;
    const investigation = await repository.get(investigationId);
    if (!investigation) return NextResponse.json({ error: "Investigation not found." }, { status: 404 });
    return NextResponse.json({ investigation });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    throw error;
  }
}
