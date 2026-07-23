import "server-only";
import { supabaseFetch } from "@/lib/supabase";
import type { MembershipRole } from "../domain";

export type WorkspaceActor = { userId: string; accessToken: string; organizationId: string; role: MembershipRole };
type AuthUser = { id?: string };
type MembershipRow = { organization_id: string; role: MembershipRole };

export async function requireWorkspaceActor(request: Request): Promise<WorkspaceActor> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new WorkspaceHttpError(401, "unauthorized");
  const user = await supabaseFetch<AuthUser>("/auth/v1/user", {}, token);
  if (!user.id) throw new WorkspaceHttpError(401, "unauthorized");
  const requestedOrganization = request.headers.get("x-organization-id");
  const query = requestedOrganization ? `organization_id=eq.${encodeURIComponent(requestedOrganization)}&` : "";
  const memberships = await supabaseFetch<MembershipRow[]>(`/rest/v1/organization_memberships?select=organization_id,role&status=eq.active&${query}order=created_at.asc&limit=1`, {}, token);
  if (!memberships[0]) throw new WorkspaceHttpError(403, "workspace_access_denied");
  return { userId: user.id, accessToken: token, organizationId: memberships[0].organization_id, role: memberships[0].role };
}
export class WorkspaceHttpError extends Error { constructor(public status: number, public code: string, public details?: unknown) { super(code); } }
