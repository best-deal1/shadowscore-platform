import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const intake = await readFile(new URL("../app/intake/page.tsx", import.meta.url), "utf8");
const result = await readFile(new URL("../components/quick-check/QuickCheckResult.tsx", import.meta.url), "utf8");
const payment = await readFile(new URL("../components/PaymentButtons.tsx", import.meta.url), "utf8");
const review = await readFile(new URL("../app/reports/[reportId]/ReportFlow.tsx", import.meta.url), "utf8");

test("Quick Check stays separate from paid investigation intake", () => {
  assert.match(result, /Free Quick Check completed/);
  assert.match(intake, /Run Full Investigation · \{BETA_PRODUCT\.price\}/);
  assert.match(intake, /Existing result[\s\S]*Free Quick Check/);
  assert.match(intake, /Continue to payment · \$\{BETA_PRODUCT\.price\}/);
});

test("Quick Check exposes evidence and uncertainty before conversion", () => {
  assert.match(result, /Target checked/);
  assert.match(result, /Identity observed but not independently verified/);
  assert.match(result, /Evidence coverage/);
  assert.match(result, /Representative evidence/);
  assert.match(result, /Successfully queried sources/);
  assert.match(result, /Preliminary signals/);
  assert.match(result, /Evidence gaps/);
  assert.match(result, /What the Full Investigation adds/);
  assert.doesNotMatch(result, /Business found|Independent sources checked|Evidence items collected and documented|Commercial findings identified/);
});

test("pre-payment copy gates the Executive Report behind payment and processing", () => {
  assert.doesNotMatch(intake + result, /Investigation completed|Executive report ready|Executive Report is ready|Available immediately after payment/);
  assert.match(intake, /Executive Report becomes available after processing completes/);
  assert.match(intake, /Processing begins after payment/);
  assert.match(payment, /window\.location\.assign\(`\/reports\/\$\{result\.intent\.reportId\}\/unlock`\)/);
});

test("completed Quick Check intake advances to review without starting payment", () => {
  assert.match(intake, /previewStatus === "ready"/);
  assert.match(intake, /intakeId=\{intake\?\.intakeId\}/);
  assert.match(payment, /prepareInvestigationCheckout\(\{[\s\S]*intakeId,[\s\S]*persistIntake: onPersistIntake/);
  assert.match(payment, /\/reports\/\$\{result\.intent\.reportId\}\/unlock/);
  assert.match(review, /mode === "unlock" \? 2/);
  assert.match(review, /Business[\s\S]*report\.entity/);
  assert.doesNotMatch(payment, /mark-paid|payments\/paypal|paypalUrl/);
});
