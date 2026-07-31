import assert from "node:assert/strict";
import test from "node:test";

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
