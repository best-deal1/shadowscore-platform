import { NextResponse } from "next/server";
import { clearAuthCookies, publicUser, resolveServerSession, setAuthCookies } from "@/lib/auth-session.server";
import { supabaseFetch } from "@/lib/supabase";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  const session = await resolveServerSession();
  if (!session) {
    const response = NextResponse.json({ user: null }, { status: 401, headers: NO_STORE_HEADERS });
    clearAuthCookies(response);
    return response;
  }
  const response = NextResponse.json({ user: publicUser(session.user) }, { headers: NO_STORE_HEADERS });
  if (session.refreshedAuth) setAuthCookies(response, session.refreshedAuth);
  return response;
}

export async function DELETE() {
  const session = await resolveServerSession();
  if (session?.accessToken) {
    try {
      await supabaseFetch("/auth/v1/logout", { method: "POST" }, session.accessToken);
    } catch {
      // Cookie removal still completes logout when the upstream session is expired.
    }
  }
  const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  clearAuthCookies(response);
  return response;
}
