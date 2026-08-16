import { NextResponse } from "next/server";
import { resolveServerSession, setAuthCookies } from "@/lib/auth-session.server";
import { getWorkspace, type WorkspaceSession } from "@/lib/workspace";

type Context = { params: Promise<{ reportId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const authenticated = await resolveServerSession();
  if (!authenticated) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

  const session: WorkspaceSession = {
    userId: authenticated.user.id,
    accessToken: authenticated.accessToken,
    name: "",
    email: authenticated.user.email || "",
    startedAt: new Date().toISOString(),
  };

  try {
    const { reportId } = await params;
    const workspace = await getWorkspace(session);
    const report = workspace.reports.find((item) =>
      item.reportId === reportId || item.paymentIntentId === reportId.replace(/^locked-/, ""),
    );
    if (!report) return NextResponse.json({ error: "This report was not found in your account." }, { status: 404 });

    const intent = workspace.paymentIntents.find((item) => item.id === report.paymentIntentId);
    const response = NextResponse.json({ report, intent });
    if (authenticated.refreshedAuth) setAuthCookies(response, authenticated.refreshedAuth);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report status could not be loaded.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
