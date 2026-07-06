import { NextResponse } from "next/server";
import { markPaymentPaidAndGenerateReport } from "../../../../lib/workspace.server";
import type { WorkspaceSession } from "../../../../lib/workspace";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { session?: WorkspaceSession; paymentIntentId?: string };
    if (!body.session || !body.paymentIntentId) {
      return NextResponse.json({ error: "Payment intent and session are required." }, { status: 400 });
    }
    const report = await markPaymentPaidAndGenerateReport(body.session, body.paymentIntentId);
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate report." }, { status: 400 });
  }
}
