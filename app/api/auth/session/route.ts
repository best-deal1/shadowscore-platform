import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseFetch } from "@/lib/supabase";

type SupabaseUser = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  user_metadata?: { name?: string; full_name?: string };
};
const ACCESS_TOKEN_COOKIE = "shadowscore_access_token";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ user: null }, { headers: NO_STORE_HEADERS });
  }

  try {
    const user = await supabaseFetch<SupabaseUser>("/auth/v1/user", {}, accessToken);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email || "Account",
        createdAt: user.created_at || "",
        lastLoginAt: user.last_sign_in_at,
      },
    }, { headers: NO_STORE_HEADERS });
  } catch {
    const response = NextResponse.json({ user: null }, { status: 401, headers: NO_STORE_HEADERS });
    response.cookies.set(ACCESS_TOKEN_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return response;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { accessToken?: unknown } | null;
  const accessToken = typeof body?.accessToken === "string" ? body.accessToken : "";
  if (!accessToken) return NextResponse.json({ error: "An access token is required." }, { status: 400 });

  try {
    await supabaseFetch<SupabaseUser>("/auth/v1/user", {}, accessToken);
  } catch {
    return NextResponse.json({ error: "The session is invalid." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 });
  return response;
}

export async function DELETE() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    try {
      await supabaseFetch("/auth/v1/logout", { method: "POST" }, accessToken);
    } catch {
      // An expired or already revoked token is already signed out.
    }
  }

  const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
