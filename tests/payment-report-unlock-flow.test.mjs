import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { canViewFullReport, nextReportRoute } from "../lib/reportAccess.ts";
import { createCheckoutIntent, createIntake, getWorkspace, REPORT_PRODUCT, reportIdForPayment } from "../lib/workspace.ts";

const session = { userId: "payment-flow-user", email: "buyer@example.com", name: "Buyer", startedAt: "2026-07-28T00:00:00.000Z" };
const intakeRecord = { scanMode: "website", target: "example.com", platform: "Website", email: session.email, fileNames: [], visibleSignalCategories: ["Identity", "Infrastructure"] };
const source = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("checkout sends the customer to the existing review and payment route", () => {
  const component = source("../components/PaymentButtons.tsx");
  assert.match(component, /if \(!body\.intent \|\| !body\.reportId\) throw new Error/);
  assert.match(component, /window\.location\.assign\(`\/reports\/\$\{result\.intent\.reportId\}\/unlock`\)/);
});
test("unlock summary states the purchase type, total, contents, and payment provider", () => {
  const page = source("../app/reports/[reportId]/ReportFlow.tsx");
  for (const copy of ["One Business Investigation", "Total", "Executive Report includes", "No subscription", "Payment processed by the selected provider"]) assert.ok(page.includes(copy));
  assert.equal(REPORT_PRODUCT.price, "$9.90");
  assert.equal(REPORT_PRODUCT.amount, "9.90");
  assert.equal(REPORT_PRODUCT.name, "Business Investigation");
});
test("checkout initiation creates one report-scoped intent", async () => {
  const intake = await createIntake(session, intakeRecord);
  const intent = await createCheckoutIntent(session, { planName: REPORT_PRODUCT.name, price: REPORT_PRODUCT.price, method: "PayPal", intakeId: intake.intakeId });
  const workspace = await getWorkspace(session);
  assert.ok(workspace.intakes.some((item) => item.intakeId === intake.intakeId), "saved intake resolves");
  assert.ok(workspace.paymentIntents.some((item) => item.id === intent.id), "payment intent resolves");
  assert.ok(workspace.acceptances.some((item) => item.reportId === intent.id), "legal acceptance resolves");
  assert.ok(workspace.reports.some((item) => item.reportId === reportIdForPayment(intent.id)), "locked report route resolves");
});
test("checkout endpoint always returns JSON and verifies the report before redirect", () => {
  const route = source("../app/api/checkout/intent/route.ts");
  assert.match(route, /NextResponse\.json\(\{ intent, reportId \}, \{ status: 201 \}\)/);
  assert.match(route, /workspace\.reports\.some/);
  assert.match(route, /NextResponse\.json\(\{ error: message \}, \{ status: 500 \}\)/);
  const component = source("../components/PaymentButtons.tsx");
  assert.match(component, /const text = await response\.text\(\)/);
  assert.doesNotMatch(component, /response\.json\(\)/);
});
test("duplicate checkout initiation reuses the active intent", async () => {
  const intake = await createIntake(session, { ...intakeRecord, target: "duplicate.example" });
  const first = await createCheckoutIntent(session, { planName: REPORT_PRODUCT.name, price: REPORT_PRODUCT.price, method: "PayPal", intakeId: intake.intakeId });
  const second = await createCheckoutIntent(session, { planName: REPORT_PRODUCT.name, price: REPORT_PRODUCT.price, method: "PayPal", intakeId: intake.intakeId });
  assert.equal(second.id, first.id);
});
test("payment pending stays on unlock", () => assert.match(nextReportRoute("r", "payment_pending", "payment_pending"), /\/unlock$/));
test("payment processing uses processing route", () => assert.match(nextReportRoute("r", "processing", "payment_pending"), /\/processing$/));
test("paid and ready opens the full report", () => assert.equal(nextReportRoute("r", "paid", "ready"), "/reports/r"));
test("payment failure never unlocks report", () => assert.equal(canViewFullReport({ paymentStatus: "failed", reportStatus: "ready" }), false));
test("successful payment generation is guarded before execution", () => assert.match(source("../lib/workspace.server.ts"), /const completed = workspace\.reports\.find/));
test("duplicate provider callback is protected", () => assert.match(source("../app/api/workspace/mark-paid/route.ts"), /x-payment-callback-secret/));
test("generation success requires both server states", () => assert.equal(canViewFullReport({ paymentStatus: "paid", reportStatus: "ready" }), true));
test("generation failure after payment stays in processing", () => assert.match(nextReportRoute("r", "paid", "failed"), /\/processing$/));
test("refresh during generation loads status without restarting generation", () => {
  const page = source("../app/reports/[reportId]/ReportFlow.tsx");
  assert.match(page, /fetch\(`\/api\/reports\/\$\{encodeURIComponent\(reportId\)\}`\)/);
  assert.doesNotMatch(page, /markPaymentPaidAndGenerateReport/);
});
test("report review resolves production sessions at the server cookie boundary", () => {
  const flow = source("../app/reports/[reportId]/ReportFlow.tsx");
  const route = source("../app/api/reports/[reportId]/route.ts");
  assert.match(route, /resolveServerSession\(\)/);
  assert.match(route, /accessToken: authenticated\.accessToken/);
  assert.match(route, /getWorkspace\(session\)/);
  assert.match(route, /NextResponse\.json\(\{ report, intent \}\)/);
  assert.doesNotMatch(flow, /getCurrentSession|getWorkspace\(session\)|accessToken/);
  assert.doesNotMatch(route, /NextResponse\.json\([^\n]*accessToken/);
});
test("server-loaded review preserves the locked Step 2 payment state", () => {
  const flow = source("../app/reports/[reportId]/ReportFlow.tsx");
  const route = source("../app/api/reports/[reportId]/route.ts");
  assert.match(flow, /mode === "unlock" \? 2/);
  assert.match(flow, /paid \? <Link[\s\S]*: <button onClick=\{pay\}/);
  assert.doesNotMatch(route, /markPaymentPaid|paymentStatus\s*=/);
  assert.match(route, /item\.reportId === reportId \|\| item\.paymentIntentId === reportId\.replace/);
});
test("processing route supports direct navigation", () => assert.match(source("../app/reports/[reportId]/processing/page.tsx"), /mode="processing"/));
test("paid report never renders the payment action", () => assert.match(source("../app/reports/[reportId]/ReportFlow.tsx"), /paid \? <Link[\s\S]*>Continue<\/Link> : <button/));
test("authentication preserves a validated return-to route", () => {
  assert.match(source("../app/login/page.tsx"), /returnTo/);
  assert.match(source("../app/signup/page.tsx"), /!requested\.startsWith\("\/\/"\)/);
});
test("an unauthenticated investigation is restored after signup", () => {
  const intake = source("../app/intake/page.tsx");
  assert.match(intake, /CHECKOUT_DRAFT_KEY/);
  assert.match(intake, /\/signup\?returnTo=/);
  assert.match(intake, /createIntake\(session, draft\)/);
});
test("PayPal return is verified on the server before report generation", () => {
  const flow = source("../app/reports/[reportId]/ReportFlow.tsx");
  const callback = source("../app/api/payments/paypal/complete/route.ts");
  assert.match(flow, /rm: "2"/);
  assert.match(flow, /\/api\/payments\/paypal\/complete/);
  for (const check of ["payment_status", "invoice", "receiver_email", "mc_currency", "mc_gross"]) assert.ok(callback.includes(check));
  assert.match(callback, /markPaymentPaidAndGenerateReport/);
});
test("browser state cannot unlock a report", () => {
  const access = source("../lib/reportAccess.ts");
  assert.match(access, /paymentStatus === "paid" && report\.reportStatus === "ready"/);
  assert.doesNotMatch(access, /localStorage|sessionStorage|URLSearchParams/);
});
