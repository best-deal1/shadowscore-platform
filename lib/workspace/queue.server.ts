import "server-only";

import { supabaseFetch } from "@/lib/supabase";
import { getWorkspaceAccessToken, type WorkspaceActor } from "./actor.server";
import { fetchOrganizationQueue } from "./queue";
import type { CaseQueueDto } from "./domain";

export async function listWorkspaceQueue(actor: Pick<WorkspaceActor, "organizationId">): Promise<CaseQueueDto> {
  const accessToken = await getWorkspaceAccessToken();
  if (!accessToken) throw new Error("A workspace session is required.");
  return fetchOrganizationQueue(actor, accessToken, supabaseFetch);
}
