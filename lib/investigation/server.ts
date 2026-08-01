import "server-only";

import { getWorkspaceAccessToken, requireWorkspaceActor } from "@/lib/workspace/actor.server";
import { supabaseFetch } from "@/lib/supabase";
import { SupabaseInvestigationRepository } from "./workflowRepository";

export async function getInvestigationRepository() {
  const [actor, accessToken] = await Promise.all([requireWorkspaceActor(), getWorkspaceAccessToken()]);
  if (!accessToken) throw new Error("An authenticated workspace session is required.");
  return new SupabaseInvestigationRepository(supabaseFetch, accessToken, {
    userId: actor.userId,
    organizationId: actor.organizationId,
    email: actor.email,
  });
}
