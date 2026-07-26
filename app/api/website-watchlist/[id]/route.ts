import { createWebsiteServerRepositories, resolveWebsiteSession, websiteApiError } from "@/lib/websiteIntelligence/server";
import type { WebsiteMonitoringStatus } from "@/lib/websiteIntelligence/watchlist";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  const session = await resolveWebsiteSession(request); if (!session) return Response.json({ error: "Authentication is required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { status?: unknown } | null;
  if (body?.status !== "Active" && body?.status !== "Paused") return Response.json({ error: "Status must be Active or Paused." }, { status: 400 });
  try { await createWebsiteServerRepositories(session).watchlist.setStatus(session.userId, (await context.params).id, body.status as WebsiteMonitoringStatus); return Response.json({ ok: true }); } catch (error) { return websiteApiError(error); }
}
export async function DELETE(request: Request, context: Context) {
  const session = await resolveWebsiteSession(request); if (!session) return Response.json({ error: "Authentication is required." }, { status: 401 });
  try { await createWebsiteServerRepositories(session).watchlist.remove(session.userId, (await context.params).id); return new Response(null, { status: 204 }); } catch (error) { return websiteApiError(error); }
}
