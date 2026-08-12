import "server-only";

import { redirect } from "next/navigation";
import { getWorkspaceAccessToken } from "@/lib/workspace/actor.server";
import { resolveWorkspaceActor } from "@/lib/workspace/actor";
import { supabaseFetch } from "@/lib/supabase";
import type { ShadowScoreUser } from "@/lib/auth";
import type { WorkspaceSession } from "@/lib/workspace";

type ProfileRole = { role?: string };

export class AdminAuthorizationError extends Error {
  constructor(message: string, readonly status: 401 | 403) {
    super(message);
  }
}

export async function authorizeAdministrator() {
  const accessToken = await getWorkspaceAccessToken();
  if (!accessToken) throw new AdminAuthorizationError("Authentication is required.", 401);
  const actor = await resolveWorkspaceActor(accessToken, supabaseFetch).catch(() => null);
  if (!actor) throw new AdminAuthorizationError("Authentication is required.", 401);
  const profiles = await supabaseFetch<ProfileRole[]>(`/rest/v1/profiles?id=eq.${encodeURIComponent(actor.userId)}&select=role&limit=1`, {}, accessToken);
  if (profiles[0]?.role !== "admin") throw new AdminAuthorizationError("Administrator access is required.", 403);
  const session: WorkspaceSession = { userId: actor.userId, email: actor.email, name: actor.name, accessToken, startedAt: new Date().toISOString() };
  const user: ShadowScoreUser = { id: actor.userId, email: actor.email, name: actor.name, createdAt: "" };
  return { session, user };
}

export async function requireAdministrator() {
  try {
    return await authorizeAdministrator();
  } catch (error) {
    if (error instanceof AdminAuthorizationError) redirect(error.status === 401 ? "/login?returnTo=/admin" : "/workspace");
    throw error;
  }
}
