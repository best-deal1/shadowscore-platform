import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const intake = await readFile(new URL("../app/intake/page.tsx", import.meta.url), "utf8");
const payment = await readFile(new URL("../components/PaymentButtons.tsx", import.meta.url), "utf8");

 test("Quick Check stays separate from paid investigation intake", () => {
  assert.match(intake, /Free Quick Check completed/);
  assert.match(intake, /Run Full Investigation · \{BETA_PRODUCT\.price\}/);
  assert.match(intake, /Existing result<\/dt><dd[^>]*>Free Quick Check/);
  assert.match(intake, /Continue to payment · \$\{BETA_PRODUCT\.price\}/);
});

test("pre-payment copy gates the Executive Report behind payment and processing", () => {
  assert.doesNotMatch(intake, /Investigation completed|Executive report ready|Executive Report is ready|Available immediately after payment/);
  assert.match(intake, /Executive Report becomes available after processing completes/);
  assert.match(intake, /Processing begins after payment/);
  assert.match(payment, /window\.location\.assign\("\/workspace"\)/);
});
