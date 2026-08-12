import { NextResponse } from "next/server";
import { publicUser, setAuthCookies, type SupabaseAuthResponse } from "@/lib/auth-session.server";
import { supabaseFetch } from "@/lib/supabase";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password.trim() : "";
  if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400, headers: NO_STORE_HEADERS });

  try {
    const auth = await supabaseFetch<SupabaseAuthResponse>("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!auth.access_token || !auth.refresh_token) throw new Error("The authentication response was incomplete.");
    const response = NextResponse.json({ user: publicUser(auth.user) }, { headers: NO_STORE_HEADERS });
    setAuthCookies(response, auth);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sign in failed." }, { status: 401, headers: NO_STORE_HEADERS });
  }
}
