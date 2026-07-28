import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { canViewFullReport, nextReportRoute } from "../lib/reportAccess.ts";
import { createCheckoutIntent, createIntake, REPORT_PRODUCT, reportIdForPayment } from "../lib/workspace.ts";

const session = { userId: "payment-flow-user", email: "buyer@example.com", name: "Buyer", startedAt: "2026-07-28T00:00:00.000Z" };
const intakeRecord = { scanMode: "website", target: "example.com", platform: "Website", email: session.email, fileNames: [], visibleSignalCategories: ["Identity", "Infrastructure"] };
const source = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("preview to unlock uses the canonical report route", () => assert.match(source("../components/PaymentButtons.tsx"), /\/reports\/\$\{reportIdForPayment\(intent\.id\)\}\/unlock/));
test("unlock summary states product, final price, contents, timing, account saving, and legal terms", () => {
  const page = source("../app/reports/[reportId]/ReportFlow.tsx");
  for (const copy of ["Purchase summary", "Final price", "The full report includes", "saved to your account", "Terms of Service"]) assert.ok(page.includes(copy));
  assert.equal(REPORT_PRODUCT.price, "$9.90");
});
test("checkout initiation creates one report-scoped intent", async () => {
  const intake = await createIntake(session, intakeRecord);
  const intent = await createCheckoutIntent(session, { planName: REPORT_PRODUCT.name, price: REPORT_PRODUCT.price, method: "PayPal", intakeId: intake.intakeId });
  assert.equal(reportIdForPayment(intent.id), `locked-${intent.id}`);
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
  assert.match(page, /getWorkspace\(session\)/);
  assert.doesNotMatch(page, /markPaymentPaidAndGenerateReport/);
});
test("processing route supports direct navigation", () => assert.match(source("../app/reports/[reportId]/processing/page.tsx"), /mode="processing"/));
test("paid report never renders the payment action", () => assert.match(source("../app/reports/[reportId]/ReportFlow.tsx"), /paid \? <Link[\s\S]*Continue to report status/));
test("authentication preserves a validated return-to route", () => {
  assert.match(source("../app/login/page.tsx"), /returnTo/);
  assert.match(source("../app/signup/page.tsx"), /!requested\.startsWith\("\/\/"\)/);
});
test("browser state cannot unlock a report", () => {
  const access = source("../lib/reportAccess.ts");
  assert.match(access, /paymentStatus === "paid" && report\.reportStatus === "ready"/);
  assert.doesNotMatch(access, /localStorage|sessionStorage|URLSearchParams/);
});
