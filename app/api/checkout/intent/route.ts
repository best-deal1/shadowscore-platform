import { NextResponse } from "next/server";
import { resolveServerSession, setAuthCookies } from "@/lib/auth-session.server";
import { createCheckoutIntent, getWorkspace, REPORT_PRODUCT, reportIdForPayment, type WorkspaceSession } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const authenticated = await resolveServerSession();
    if (!authenticated) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    const body = await request.json().catch(() => null) as { intakeId?: unknown } | null;
    if (typeof body?.intakeId !== "string" || !body.intakeId.trim()) {
      return NextResponse.json({ error: "A saved investigation is required." }, { status: 400 });
    }
    const intakeId = body.intakeId.trim();
    const session: WorkspaceSession = {
      userId: authenticated.user.id,
      accessToken: authenticated.accessToken,
      name: "",
      email: "",
      startedAt: new Date().toISOString(),
    };
    const workspace = await getWorkspace(session);
    const intake = workspace.intakes.find((item) => item.intakeId === intakeId);
    if (!intake) return NextResponse.json({ error: "The saved investigation could not be found." }, { status: 404 });
    const personalIdentity = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(intake.target.trim());
    const intent = await createCheckoutIntent(session, {
      planName: personalIdentity ? "Personal Identity Investigation" : REPORT_PRODUCT.name,
      price: REPORT_PRODUCT.price,
      method: "PayPal",
      intakeId: body.intakeId,
    });
    const reportId = reportIdForPayment(intent.id);
    const updatedWorkspace = await getWorkspace(session);
    if (!updatedWorkspace.reports.some((report) => report.reportId === reportId)) {
      throw new Error("Checkout did not create the locked report.");
    }
    const response = NextResponse.json({ intent, reportId }, { status: 201 });
    if (authenticated.refreshedAuth) setAuthCookies(response, authenticated.refreshedAuth);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout could not be started.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
