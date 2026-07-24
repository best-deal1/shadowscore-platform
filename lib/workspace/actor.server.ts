import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseFetch } from "@/lib/supabase";
import { resolveWorkspaceActor, WorkspaceAccessError, type WorkspaceActor } from "./actor";

export type { WorkspaceActor } from "./actor";

const ACCESS_TOKEN_COOKIE = "shadowscore_access_token";

export async function getWorkspaceAccessToken() {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function requireWorkspaceActor(): Promise<WorkspaceActor> {
  try {
    return await resolveWorkspaceActor(await getWorkspaceAccessToken(), supabaseFetch);
  } catch (error) {
    if (error instanceof WorkspaceAccessError) redirect("/login");
    throw error;
  }
}
