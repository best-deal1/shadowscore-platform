import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public platform pages use the shared commercial shell", async () => {
  const marketingPage = await read("app/components/MarketingPage.tsx");
  assert.match(marketingPage, /ShadowScoreLayout/);
  assert.match(marketingPage, /<ShadowScoreLayout>/);

  const layout = await read("components/ShadowScoreLayout.tsx");
  assert.match(layout, /href: "\/faq"/);
  assert.match(layout, /href: "\/about"/);
  assert.match(layout, /"\/forgot-password": "Password recovery"/);
  assert.match(layout, /"\/supplier-verification": "Supplier verification"/);
  assert.doesNotMatch(marketingPage, /aria-label="Breadcrumb"/);
});

test("about represents the current platform and ends with supported actions", async () => {
  const about = await read("app/about/page.tsx");
  assert.match(about, /identity resolution, source collection, analysis, monitoring/);
  assert.match(about, /href="\/intake"/);
  assert.match(about, /href="\/sample-report"/);
  assert.match(about, /href="\/contact"/);
});

test("FAQ resolves evaluation questions with current product paths", async () => {
  const faq = await read("app/faq/page.tsx");
  for (const expected of ["Investigations and reports", "Evidence and methodology", "Pricing, access, and support", "demonstration data", "$9.90 USD"]) {
    assert.match(faq, new RegExp(expected.replace("$", "\\$")));
  }
  assert.match(faq, /<details/);
  assert.match(faq, /href="\/contact"/);
});

test("authentication has complete recovery and browser autofill paths", async () => {
  const [login, signup, recovery, auth] = await Promise.all([
    read("app/login/page.tsx"), read("app/signup/page.tsx"),
    read("app/forgot-password/page.tsx"), read("lib/auth.ts"),
  ]);
  assert.match(login, /href="\/forgot-password"/);
  assert.match(login, /autoComplete="current-password"/);
  assert.match(signup, /autoComplete="new-password"/);
  assert.match(recovery, /aria-live="polite"/);
  assert.match(recovery, /does not disclose whether an email address is registered/);
  assert.match(auth, /\/auth\/v1\/recover/);
});
