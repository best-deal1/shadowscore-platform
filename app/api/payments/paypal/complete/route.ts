import { NextResponse } from "next/server";
import { PAYPAL_BUSINESS_EMAIL, getPayPalPdtIdentityToken } from "@/lib/config";
import { resolveWebsiteSession } from "@/lib/websiteIntelligence/server";
import { confirmPaymentAndQueueInvestigation } from "@/lib/workspace.server";
import { REPORT_PRODUCT, type WorkspaceSession } from "@/lib/workspace";

const PAYPAL_PDT_URL = "https://www.paypal.com/cgi-bin/webscr";

function parsePdtResponse(body: string) {
  const [status, ...lines] = body.replaceAll("\r", "").split("\n");
  const values = new URLSearchParams();
  for (const line of lines) {
    const separator = line.indexOf("=");
    if (separator > 0) values.set(line.slice(0, separator), decodeURIComponent(line.slice(separator + 1).replaceAll("+", " ")));
  }
  return { status, values };
}

export async function POST(request: Request) {
  try {
    const authenticated = await resolveWebsiteSession(request);
    if (!authenticated) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    const body = (await request.json().catch(() => null)) as { reportId?: unknown; transactionId?: unknown } | null;
    if (typeof body?.reportId !== "string" || typeof body.transactionId !== "string") {
      return NextResponse.json({ error: "Payment confirmation details are required." }, { status: 400 });
    }
    const paymentIntentId = body.reportId.replace(/^locked-/, "");
    const identityToken = getPayPalPdtIdentityToken();
    if (!identityToken) throw new Error("PayPal payment confirmation is not configured.");

    const verification = await fetch(PAYPAL_PDT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ cmd: "_notify-synch", tx: body.transactionId, at: identityToken }),
      cache: "no-store",
    });
    const result = parsePdtResponse(await verification.text());
    const receiver = result.values.get("receiver_email")?.toLowerCase();
    if (result.status !== "SUCCESS" || result.values.get("payment_status") !== "Completed") throw new Error("PayPal has not confirmed this payment.");
    if (result.values.get("invoice") !== paymentIntentId) throw new Error("Payment reference does not match this report.");
    if (receiver !== PAYPAL_BUSINESS_EMAIL.toLowerCase()) throw new Error("Payment recipient could not be verified.");
    if (result.values.get("mc_currency") !== "USD" || result.values.get("mc_gross") !== REPORT_PRODUCT.amount) throw new Error("Payment amount could not be verified.");

    const session: WorkspaceSession = { userId: authenticated.userId, accessToken: authenticated.accessToken, name: "", email: "", startedAt: new Date().toISOString() };
    const queued = await confirmPaymentAndQueueInvestigation(session, paymentIntentId, body.transactionId);
    return NextResponse.json({ reportId: queued.reportId, investigationId: queued.investigationId, reportStatus: queued.reportStatus });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment could not be confirmed." }, { status: 400 });
  }
}
