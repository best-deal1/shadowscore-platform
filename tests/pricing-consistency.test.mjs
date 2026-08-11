import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { BETA_PRODUCT } from "../lib/pricing.ts";
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

test("public pricing makes the canonical investigation the primary offer", async () => {
  const pricing = await read("app/pricing/page.tsx");
  const layout = await read("components/ShadowScoreLayout.tsx");
  assert.match(pricing, /BETA_PRODUCT\.price/);
  assert.match(pricing, /BETA_PRODUCT\.currency/);
  assert.match(pricing, /BETA_PRODUCT\.period/);
  assert.match(pricing, /Start Business Investigation/);
  assert.match(pricing, /View Sample Report/);
  assert.match(pricing, /<ShadowScoreLayout hideReviewMessaging>/);
  for (const internalMessage of ["beta offer", "beta Business Investigation", "Enterprise readiness review", "Enterprise review mode"]) {
    assert.doesNotMatch(pricing, new RegExp(internalMessage, "i"));
  }
  assert.match(layout, /hideReviewMessaging = false/);
  assert.match(layout, /!hideReviewMessaging \? <div className="ss-platform-bar"/);
  assert.match(layout, /!hideReviewMessaging \? <section className="ss-enterprise-readiness"/);
  for (const retiredOffer of ["Quick Investigation", "Professional Investigation", "Business Intelligence Report", "Continuous Monitoring"]) {
    assert.doesNotMatch(pricing, new RegExp(retiredOffer));
  }
});

test("pricing replaces the old comparison experience with the purchase journey", async () => {
  const pricing = await read("app/pricing/page.tsx");
  for (const oldSection of ["Plans for growing teams", "Plan comparison", "pricing-table", "PLAN_COMPARISON"]) {
    assert.doesNotMatch(pricing, new RegExp(oldSection));
  }
  for (const step of ["Submit", "Confirm scope", "Pay once", "Investigate", "Access report"]) {
    assert.match(pricing, new RegExp(`\\[\\"${step}\\"`));
  }
  for (const faqTopic of ["When and how do I pay?", "What will I receive?", "How long does processing take?", "What happens when a source is unavailable?", "How do I access my report?", "Can I purchase another investigation?"]) {
    assert.match(pricing, new RegExp(faqTopic.replace(/[?]/g, "\\?")));
  }
});
