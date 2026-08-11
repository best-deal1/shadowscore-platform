import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { BETA_PRODUCT, PRICING_PLANS } from "../lib/pricing.ts";
import { REPORT_PRODUCT } from "../lib/workspace.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the beta SKU has one frozen commercial contract", () => {
  assert.deepEqual(BETA_PRODUCT, {
    sku: "business-investigation",
    name: "Business Investigation",
    deliverable: "Executive Report",
    price: "$9.90",
    amount: "9.90",
    currency: "USD",
    period: "one time",
    promise: "One Business Investigation produces one Executive Report for a one-time price of $9.90.",
    includes: ["Executive recommendation", "Verified findings and evidence gaps", "Source trail", "Prioritized action plan"],
  });
  assert.equal(REPORT_PRODUCT.name, BETA_PRODUCT.name);
  assert.equal(REPORT_PRODUCT.price, BETA_PRODUCT.price);
  assert.equal(REPORT_PRODUCT.amount, BETA_PRODUCT.amount);
});

test("public pricing uses the canonical four-tier catalog", async () => {
  const pricing = await read("app/pricing/page.tsx");
  const layout = await read("components/ShadowScoreLayout.tsx");
  assert.match(pricing, /PRICING_PLANS\.map/);
  assert.match(pricing, /PLAN_COMPARISON\.map/);
  assert.match(pricing, /BETA_PRODUCT\.price/);
  assert.match(pricing, /<ShadowScoreLayout hideReviewMessaging>/);
  assert.match(layout, /hideReviewMessaging = false/);

  assert.deepEqual(PRICING_PLANS.map(({ name, price }) => [name, price]), [
    ["Individual", "$9.90"],
    ["Professional", "$49"],
    ["Business", "$199"],
    ["Enterprise", "$299"],
  ]);
  assert.equal(PRICING_PLANS.find(({ recommended }) => recommended)?.name, "Business");
});

test("pricing distinguishes one-time and monthly plans", () => {
  assert.equal(PRICING_PLANS[0].cadence, "one-time purchase");
  for (const plan of PRICING_PLANS.slice(1)) assert.equal(plan.cadence, "per month");
  assert.deepEqual(PRICING_PLANS[0].features.slice(0, 3), [
    "One Business Investigation",
    "One Executive Report",
    "Workspace access for that investigation",
  ]);
});

test("pricing includes comparison, FAQ, CTAs, and no future-product language", async () => {
  const pricing = `${await read("app/pricing/page.tsx")}\n${await read("lib/pricing.ts")}`;
  for (const copy of ["The essentials, side by side.", "Pricing FAQ", "Start an investigation", "Choose Professional", "Choose Business", "Choose Enterprise"]) {
    assert.match(pricing, new RegExp(copy.replace(/[.]/g, "\\.")));
  }
  assert.doesNotMatch(await read("app/pricing/page.tsx"), /Planned|subscriptions are unavailable|For larger review programs|roadmap|preview/i);
  assert.doesNotMatch(await read("lib/pricing.ts"), /Planned|subscriptions are unavailable|For larger review programs/i);
});
