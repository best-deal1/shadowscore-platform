import assert from "node:assert/strict";
import test from "node:test";

import { PRICING_PLANS } from "../lib/pricing.ts";

test("the intended pricing ladder remains consistent", () => {
  assert.deepEqual(
    Object.values(PRICING_PLANS).map(({ name, price, period }) => ({ name, price, period })),
    [
      { name: "Quick Investigation", price: "$9.90", period: "one time" },
      { name: "Professional Investigation", price: "$49", period: "one time" },
      { name: "Business Intelligence Report", price: "$199", period: "one time" },
      { name: "Continuous Monitoring", price: "$299", period: "per month" },
    ],
  );
});
