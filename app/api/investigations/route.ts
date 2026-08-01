import { NextResponse } from "next/server";
import { getWorkspaceAccessToken } from "@/lib/workspace/actor.server";
import { resolveWorkspaceActor, WorkspaceAccessError } from "@/lib/workspace/actor";
import { SupabaseInvestigationRepository } from "@/lib/investigation";
import { supabaseFetch } from "@/lib/supabase";

async function authenticatedRepository() {
  const accessToken = await getWorkspaceAccessToken();
  const actor = await resolveWorkspaceActor(accessToken, supabaseFetch);
  return new SupabaseInvestigationRepository(supabaseFetch, accessToken!, {
    userId: actor.userId,
    organizationId: actor.organizationId,
    email: actor.email,
  });
}

function authError(error: unknown) {
  if (error instanceof WorkspaceAccessError) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  throw error;
}

export async function GET() {
  try {
    return NextResponse.json({ investigations: await (await authenticatedRepository()).list() });
  } catch (error) {
    return authError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { target?: unknown; targetType?: unknown } | null;
    if (typeof body?.target !== "string" || !body.target.trim()) return NextResponse.json({ error: "An investigation target is required." }, { status: 422 });
    const targetType = body.targetType === "Marketplace Seller" || body.targetType === "Business" || body.targetType === "Website" ? body.targetType : undefined;
    const investigation = await (await authenticatedRepository()).create({ target: body.target, targetType });
    return NextResponse.json({ investigation }, { status: 201 });
  } catch (error) {
    return authError(error);
  }
}
