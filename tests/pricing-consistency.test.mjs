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

test("public pricing presents only the beta SKU and canonical promise", async () => {
  const pricing = await read("app/pricing/page.tsx");
  assert.match(pricing, /BETA_PRODUCT\.promise/);
  assert.match(pricing, /Start Business Investigation/);
  for (const retiredOffer of ["Quick Investigation", "Professional Investigation", "Business Intelligence Report", "Continuous Monitoring"]) {
    assert.doesNotMatch(pricing, new RegExp(retiredOffer));
  }
});
