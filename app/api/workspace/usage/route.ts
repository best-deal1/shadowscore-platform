import { NextResponse } from "next/server";
import { getWorkspaceAccessToken } from "@/lib/workspace/actor.server";
import { resolveWorkspaceActor, WorkspaceAccessError } from "@/lib/workspace/actor";
import { supabaseFetch } from "@/lib/supabase";
import { getWorkspaceMonthlyUsage } from "@/lib/platformCore/supabase";

export async function GET() {
  const token = await getWorkspaceAccessToken();
  try {
    const actor = await resolveWorkspaceActor(token, supabaseFetch);
    const usage = await getWorkspaceMonthlyUsage(actor.organizationId, token!);
    return NextResponse.json(usage);
  } catch (error) {
    if (error instanceof WorkspaceAccessError) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    throw error;
  }
}
