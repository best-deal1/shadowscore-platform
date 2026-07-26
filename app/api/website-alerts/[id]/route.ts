import { createWebsiteServerRepositories, resolveWebsiteSession, websiteApiError } from "@/lib/websiteIntelligence/server";
import type { WebsiteAlertStatus } from "@/lib/websiteIntelligence/alerts";
const statuses = new Set<WebsiteAlertStatus>(["New", "Reviewing", "Resolved", "Dismissed"]);
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await resolveWebsiteSession(request); if (!session) return Response.json({ error: "Authentication is required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { status?: unknown } | null;
  if (typeof body?.status !== "string" || !statuses.has(body.status as WebsiteAlertStatus)) return Response.json({ error: "Alert status is invalid." }, { status: 400 });
  try { await createWebsiteServerRepositories(session).alerts.updateStatus(session.userId, (await params).id, body.status as WebsiteAlertStatus); return Response.json({ ok: true }); } catch (error) { return websiteApiError(error); }
}
