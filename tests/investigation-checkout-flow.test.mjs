import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { prepareInvestigationCheckout } from "../lib/investigationCheckout.ts";

test("authenticated user can save a completed investigation and continue to checkout", async () => {
  const calls = [];

  const result = await prepareInvestigationCheckout({
    email: "",
    authenticatedEmail: "buyer@example.com",
    persistIntake: async (email) => {
      calls.push(["persist", email]);
      return "intake-123";
    },
    createIntent: async (intakeId) => {
      calls.push(["checkout", intakeId]);
      return { id: "pi-123" };
    },
  });

  assert.deepEqual(calls, [
    ["persist", "buyer@example.com"],
    ["checkout", "intake-123"],
  ]);
  assert.deepEqual(result, {
    email: "buyer@example.com",
    intakeId: "intake-123",
    intent: { id: "pi-123" },
  });
});

test("checkout reports a visible validation error before persistence when email is unavailable", async () => {
  await assert.rejects(
    prepareInvestigationCheckout({
      email: "",
      authenticatedEmail: "",
      persistIntake: async () => "intake-123",
      createIntent: async () => ({ id: "pi-123" }),
    }),
    /Enter a valid customer email to continue/,
  );
});

test("a saved investigation advances without creating a duplicate intake", async () => {
  let persistenceCalls = 0;
  let checkoutCalls = 0;

  const result = await prepareInvestigationCheckout({
    intakeId: "intake-existing",
    email: "buyer@example.com",
    authenticatedEmail: "buyer@example.com",
    persistIntake: async () => {
      persistenceCalls += 1;
      return "intake-duplicate";
    },
    createIntent: async (intakeId) => {
      checkoutCalls += 1;
      return { reportId: "locked-report", intakeId, paymentStatus: "payment_pending" };
    },
  });

  assert.equal(persistenceCalls, 0);
  assert.equal(checkoutCalls, 1);
  assert.equal(result.intakeId, "intake-existing");
  assert.deepEqual(result.intent, {
    reportId: "locked-report",
    intakeId: "intake-existing",
    paymentStatus: "payment_pending",
  });
});

test("purchase flow saves anonymous drafts and opens review after persistence", async () => {
  const [buttons, intake, login, signup] = await Promise.all([
    readFile(new URL("../components/PaymentButtons.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/intake/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/login/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/signup/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(buttons, /if \(!onPersistIntake\)/);
  assert.match(buttons, /await onPersistIntake\(email\)/);
  assert.match(buttons, /window\.location\.assign\(`\/reports\/\$\{result\.intent\.reportId\}\/unlock`\)/);
  assert.match(intake, /window\.sessionStorage\.removeItem\(CHECKOUT_DRAFT_KEY\);\s*window\.location\.assign\("\/workspace"\)/);
  assert.match(login, /await loginUser[\s\S]*window\.location\.assign\(/);
  assert.match(signup, /await signupUser[\s\S]*window\.location\.assign\(/);
});
