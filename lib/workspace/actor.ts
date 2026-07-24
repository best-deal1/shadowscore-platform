import type { MembershipRole } from "./domain.ts";

export type WorkspaceActor = {
  userId: string;
  organizationId: string;
  role: MembershipRole;
  name: string;
  email: string;
};

type SupabaseUser = { id: string; email?: string; user_metadata?: { name?: string; full_name?: string } };
type MembershipRow = { organization_id: string; role: MembershipRole; status: "active" | "disabled" };
type ProfileRow = { full_name: string | null };
export type SupabaseRequest = <T>(path: string, init?: RequestInit, accessToken?: string) => Promise<T>;

export class WorkspaceAccessError extends Error {}

export async function resolveWorkspaceActor(accessToken: string | undefined, request: SupabaseRequest): Promise<WorkspaceActor> {
  if (!accessToken) throw new WorkspaceAccessError("A workspace session is required.");

  let user: SupabaseUser;
  let memberships: MembershipRow[];
  try {
    [user, memberships] = await Promise.all([
      request<SupabaseUser>("/auth/v1/user", {}, accessToken),
      request<MembershipRow[]>("/rest/v1/organization_memberships?select=organization_id,role,status&status=eq.active&order=updated_at.desc&limit=1", {}, accessToken),
    ]);
  } catch {
    throw new WorkspaceAccessError("A valid workspace session is required.");
  }

  const membership = memberships.find((candidate) => candidate.status === "active");
  if (!user.id || !membership) throw new WorkspaceAccessError("An active organization membership is required.");

  let profile: ProfileRow | null = null;
  try {
    const profiles = await request<ProfileRow[]>("/rest/v1/profiles?select=full_name&limit=1", {}, accessToken);
    profile = profiles[0] ?? null;
  } catch {
    // The authenticated user and active membership are sufficient for access.
  }

  const email = user.email ?? "";
  return { userId: user.id, organizationId: membership.organization_id, role: membership.role, name: profile?.full_name?.trim() || user.user_metadata?.full_name?.trim() || user.user_metadata?.name?.trim() || email, email };
}
