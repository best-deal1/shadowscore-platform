import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "shadowscore_access_token";
const REFRESH_TOKEN_COOKIE = "shadowscore_refresh_token";
type RefreshedSession = { access_token: string; refresh_token: string; expires_in?: number };

function applyRefreshedCookies(response: NextResponse, refreshed: RefreshedSession | null) {
  if (!refreshed) return;
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", priority: "high" as const };
  response.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.access_token, { ...options, maxAge: refreshed.expires_in ?? 3600 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 30 });
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let authenticated = false;
  let refreshed: RefreshedSession | null = null;

  if (accessToken && url && anonKey) {
    try {
      const response = await fetch(`${url}/auth/v1/user`, {
        headers: { apikey: anonKey, authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      authenticated = response.ok;
    } catch {
      authenticated = false;
    }
  }

  if (!authenticated && refreshToken && url && anonKey) {
    try {
      const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: anonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
      if (response.ok) {
        refreshed = await response.json() as RefreshedSession;
        authenticated = Boolean(refreshed?.access_token && refreshed?.refresh_token);
      }
    } catch {
      authenticated = false;
    }
  }

  if (!authenticated) {
    if (request.nextUrl.pathname === "/login") {
      const response = NextResponse.next();
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(ACCESS_TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(REFRESH_TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (request.nextUrl.pathname === "/login") {
    const response = NextResponse.redirect(new URL("/workspace", request.url));
    applyRefreshedCookies(response, refreshed);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  // Resolve the legacy index before React renders its async authenticated layout.
  // A render-time redirect can otherwise be delivered as an RSC redirect and retried by the client.
  if (request.nextUrl.pathname === "/investigations") {
    const response = NextResponse.redirect(new URL("/workspace", request.url));
    applyRefreshedCookies(response, refreshed);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  const response = NextResponse.next();
  applyRefreshedCookies(response, refreshed);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export const config = {
  matcher: [
    "/login",
    "/account/:path*",
    "/admin/:path*",
    "/admin-lite/:path*",
    "/alerts/:path*",
    "/archive/:path*",
    "/cases/:path*",
    "/dashboard/:path*",
    "/entity-intelligence/:path*",
    "/entity-runtime/:path*",
    "/investigations/:path*",
    "/monitoring/:path*",
    "/radar/:path*",
    "/report/:path*",
    "/reports/:path*",
    "/watchlist/:path*",
    "/workspace/:path*",
  ],
};
