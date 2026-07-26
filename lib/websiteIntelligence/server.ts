import { isSupabaseConfigured, supabaseFetch } from "../supabase";
import { MemoryWebsiteAlertRepository, type WebsiteAlertRepository } from "./alerts";
import { SupabaseWebsiteAlertRepository } from "./supabaseAlerts";
import { SupabaseWebsiteWatchlistRepository } from "./supabaseWatchlist";
import { MemoryWebsiteWatchlistRepository, type WebsiteWatchlistRepository } from "./watchlist";

export type WebsiteSession = { userId: string; accessToken: string };
type SupabaseUser = { id: string };

export async function resolveWebsiteSession(request: Request): Promise<WebsiteSession | null> {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || request.headers.get("cookie")?.match(/(?:^|;\s*)shadowscore_access_token=([^;]+)/)?.[1];
  if (!accessToken) return null;
  try {
    const user = await supabaseFetch<SupabaseUser>("/auth/v1/user", {}, decodeURIComponent(accessToken));
    return { userId: user.id, accessToken: decodeURIComponent(accessToken) };
  } catch {
    return null;
  }
}

const memoryWatchlist = new MemoryWebsiteWatchlistRepository();
const memoryAlerts = new MemoryWebsiteAlertRepository();
export function createWebsiteServerRepositories(session: WebsiteSession): { watchlist: WebsiteWatchlistRepository; alerts: WebsiteAlertRepository } {
  if (!isSupabaseConfigured()) return { watchlist: memoryWatchlist, alerts: memoryAlerts };
  return { watchlist: new SupabaseWebsiteWatchlistRepository(session.userId, session.accessToken), alerts: new SupabaseWebsiteAlertRepository(session.userId, session.accessToken) };
}

export function websiteApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "The request could not be completed.";
  if (/not found/i.test(message)) return Response.json({ error: message }, { status: 404 });
  if (/already|duplicate|unique|transition/i.test(message)) return Response.json({ error: /transition/i.test(message) ? "That status change is not allowed." : "This domain is already on the watchlist." }, { status: 409 });
  if (/valid|required/i.test(message)) return Response.json({ error: message }, { status: 400 });
  return Response.json({ error: "The request could not be completed." }, { status: 500 });
}
