import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import { publicUser, setAuthCookies, type SupabaseAuthResponse } from "@/lib/auth-session.server";
import { supabaseFetch } from "@/lib/supabase";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { name?: unknown; email?: unknown; password?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password.trim() : "";
  if (!name || !email.includes("@") || password.length < 8) {
    return NextResponse.json({ error: "Valid name, email, and password are required." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  try {
    const auth = await supabaseFetch<SupabaseAuthResponse>(`/auth/v1/signup?redirect_to=${encodeURIComponent(SITE_URL)}`, {
      method: "POST",
      body: JSON.stringify({ email, password, data: { name } }),
    });
    if (!auth.access_token || !auth.refresh_token) {
      return NextResponse.json({ error: "Check your email to confirm your account, then sign in." }, { status: 409, headers: NO_STORE_HEADERS });
    }
    const response = NextResponse.json({ user: publicUser(auth.user) }, { status: 201, headers: NO_STORE_HEADERS });
    setAuthCookies(response, auth);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Account creation failed." }, { status: 400, headers: NO_STORE_HEADERS });
  }
}
