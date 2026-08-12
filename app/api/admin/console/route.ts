import { NextResponse } from "next/server";
import { getAdminConsoleDataForSession } from "../../../../lib/admin";
import { AdminAuthorizationError, authorizeAdministrator } from "@/lib/admin.server";

export async function GET() {
  try {
    const { session, user } = await authorizeAdministrator();
    return NextResponse.json(await getAdminConsoleDataForSession(session, user), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const status = error instanceof AdminAuthorizationError ? error.status : 500;
    if (status === 500) console.error("Admin console loading failed.", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load admin console." }, { status });
  }
}
