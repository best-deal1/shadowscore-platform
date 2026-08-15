import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("browser intake persistence uses the same-origin API without a Supabase token", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.window = {};
  globalThis.fetch = async (input, init) => {
    requests.push({ input, init });
    return Response.json({ intake: { intakeId: "intake-1", userId: "user-1", scanMode: "website", target: "example.com", platform: "Website", email: "buyer@example.com", fileNames: [], visibleSignalCategories: [], paymentStatus: "payment_pending", reportStatus: "preview", createdAt: "2026-08-15T00:00:00.000Z" } }, { status: 201 });
  };
  try {
    const { createIntake } = await import(`../lib/workspace.ts?cookie-persistence=${Date.now()}`);
    const intake = await createIntake({ userId: "user-1", email: "buyer@example.com", name: "Buyer", startedAt: "2026-08-15T00:00:00.000Z" }, { scanMode: "website", target: "example.com", platform: "Website", email: "buyer@example.com", fileNames: [], visibleSignalCategories: [] });
    assert.equal(intake.intakeId, "intake-1");
    assert.equal(requests[0].input, "/api/intakes");
    assert.deepEqual(requests[0].init.headers, { "Content-Type": "application/json" });
    assert.doesNotMatch(JSON.stringify(requests[0]), /accessToken|authorization|bearer/i);
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
});

test("signed-out intake API rejects persistence and server routes own checkout credentials", async () => {
  const [intakeRoute, checkoutRoute, paymentButtons, auth] = await Promise.all([
    readFile(new URL("../app/api/intakes/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/checkout/intent/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/PaymentButtons.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/auth.ts", import.meta.url), "utf8"),
  ]);
  assert.match(intakeRoute, /if \(!authenticated\).*status: 401/);
  assert.match(intakeRoute, /resolveServerSession\(\)/);
  assert.match(checkoutRoute, /resolveServerSession\(\)/);
  assert.match(checkoutRoute, /createCheckoutIntent\(session/);
  assert.doesNotMatch(paymentButtons, /Authorization|accessToken/);
  assert.doesNotMatch(auth, /sessionStorage\.setItem\([^\n]*accessToken/);
});

test("workspace keeps an investigation visible and refreshes when deletion fails", async () => {
  const workspace = await readFile(new URL("../components/workspace/InvestigationWorkspace.tsx", import.meta.url), "utf8");
  const failure = workspace.slice(workspace.indexOf("if (!response.ok)"), workspace.indexOf("} finally", workspace.indexOf("if (!response.ok)")));
  assert.match(failure, /throw new Error/);
  assert.match(failure, /router\.refresh\(\)/);
  assert.doesNotMatch(failure.slice(0, failure.indexOf("catch")), /setInvestigations/);
});
