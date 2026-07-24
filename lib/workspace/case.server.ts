import "server-only";

import { supabaseFetch } from "@/lib/supabase";
import { CaseRepository } from "./caseRepository";
import { CaseService, type CaseDto } from "./cases";
import { getWorkspaceAccessToken, type WorkspaceActor } from "./actor.server";

/** Loads the browser-safe case DTO after the workspace actor has been resolved. */
export async function getWorkspaceCase(actor: WorkspaceActor, caseId: string): Promise<CaseDto> {
  const accessToken = await getWorkspaceAccessToken();
  if (!accessToken) throw new Error("A workspace session is required.");
  return new CaseService(new CaseRepository(supabaseFetch, accessToken)).get(actor, caseId);
}
