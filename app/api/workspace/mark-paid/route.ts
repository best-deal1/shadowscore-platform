import { NextResponse } from "next/server";
import { markPaymentPaidAndGenerateReport } from "../../../../lib/workspace.server";
import type { WorkspaceSession } from "../../../../lib/workspace";
import { resolveWebsiteSession } from "@/lib/websiteIntelligence/server";

export async function POST(request: Request) {
  try {
    const callbackSecret = process.env.PAYMENT_CALLBACK_SECRET;
    if (!callbackSecret || request.headers.get("x-payment-callback-secret") !== callbackSecret) {
      return NextResponse.json({ error: "Verified payment callback required." }, { status: 401 });
    }
    const authenticated = await resolveWebsiteSession(request);
    if (!authenticated) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    const body = (await request.json().catch(() => null)) as { paymentIntentId?: unknown } | null;
    if (typeof body?.paymentIntentId !== "string") return NextResponse.json({ error: "Payment intent is required." }, { status: 400 });
    const session: WorkspaceSession = { userId: authenticated.userId, accessToken: authenticated.accessToken, name: "", email: "", startedAt: new Date().toISOString() };
    const report = await markPaymentPaidAndGenerateReport(session, body.paymentIntentId);
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate report." }, { status: 400 });
  }
}
