import { NextResponse } from "next/server";
import { supabaseFetch } from "@/lib/supabase";

type SupabaseUser = { id: string };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { accessToken?: unknown } | null;
  const accessToken = typeof body?.accessToken === "string" ? body.accessToken : "";
  if (!accessToken) return NextResponse.json({ error: "An access token is required." }, { status: 400 });

  try {
    await supabaseFetch<SupabaseUser>("/auth/v1/user", {}, accessToken);
  } catch {
    return NextResponse.json({ error: "The session is invalid." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("shadowscore_access_token", accessToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 });
  return response;
}
