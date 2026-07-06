import { NextResponse } from "next/server";
import { getAdminConsoleDataForSession } from "../../../../lib/admin";
import type { ShadowScoreUser } from "../../../../lib/auth";
import type { WorkspaceSession } from "../../../../lib/workspace";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { session?: WorkspaceSession; user?: ShadowScoreUser };
    if (!body.session || !body.user) {
      return NextResponse.json({ error: "Admin console requires an authenticated session." }, { status: 401 });
    }
    const data = await getAdminConsoleDataForSession(body.session, body.user);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load admin console." }, { status: 403 });
  }
}
