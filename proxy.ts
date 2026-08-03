import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "shadowscore_access_token";

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let authenticated = false;

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
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (request.nextUrl.pathname === "/login") {
    const response = NextResponse.redirect(new URL("/workspace", request.url));
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  // Resolve the legacy index before React renders its async authenticated layout.
  // A render-time redirect can otherwise be delivered as an RSC redirect and retried by the client.
  if (request.nextUrl.pathname === "/investigations") {
    const response = NextResponse.redirect(new URL("/workspace", request.url));
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  const response = NextResponse.next();
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
