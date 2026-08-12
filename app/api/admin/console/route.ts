import { NextResponse } from "next/server";
import { getAdminConsoleDataForSession } from "../../../../lib/admin";
import { supabaseFetch } from "@/lib/supabase";
import { resolveWebsiteSession } from "@/lib/websiteIntelligence/server";

type SupabaseUser = { id: string; email?: string; created_at?: string; last_sign_in_at?: string; user_metadata?: { name?: string; full_name?: string } };

export async function GET(request: Request) {
  try {
    const authenticated = await resolveWebsiteSession(request);
    if (!authenticated) {
      return NextResponse.json({ error: "Admin console requires an authenticated session." }, { status: 401 });
    }
    const user = await supabaseFetch<SupabaseUser>("/auth/v1/user", {}, authenticated.accessToken);
    const startedAt = user.last_sign_in_at || user.created_at || new Date().toISOString();
    const session = { userId: user.id, email: user.email || "", name: user.user_metadata?.name || user.user_metadata?.full_name || user.email || "Account", accessToken: authenticated.accessToken, startedAt };
    const currentUser = { id: user.id, email: session.email, name: session.name, createdAt: user.created_at || startedAt, lastLoginAt: user.last_sign_in_at };
    const data = await getAdminConsoleDataForSession(session, currentUser);
    return NextResponse.json(data);
  } catch (error) {
    console.warn("Admin console access denied.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load admin console." }, { status: 403 });
  }
}
