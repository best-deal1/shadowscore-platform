import { createWebsiteServerRepositories, resolveWebsiteSession, websiteApiError } from "@/lib/websiteIntelligence/server";
import { normalizeWatchlistDomain } from "@/lib/websiteIntelligence/watchlist";

export async function GET(request: Request) {
  const session = await resolveWebsiteSession(request); if (!session) return Response.json({ error: "Authentication is required." }, { status: 401 });
  try { return Response.json({ items: await createWebsiteServerRepositories(session).watchlist.list(session.userId) }); } catch (error) { return websiteApiError(error); }
}
export async function POST(request: Request) {
  const session = await resolveWebsiteSession(request); if (!session) return Response.json({ error: "Authentication is required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { domain?: unknown } | null;
  if (typeof body?.domain !== "string") return Response.json({ error: "Domain is required." }, { status: 400 });
  try { const item = await createWebsiteServerRepositories(session).watchlist.add(session.userId, normalizeWatchlistDomain(body.domain)); return Response.json({ item }, { status: 201 }); } catch (error) { return websiteApiError(error); }
}
