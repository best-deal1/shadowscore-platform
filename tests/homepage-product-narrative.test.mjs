import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homepage = await readFile(new URL("../app/components/MarketingHome.tsx", import.meta.url), "utf8");

test("homepage leads with a specific decision outcome", () => {
  assert.match(homepage, /Know who is behind the business before you commit\./);
  assert.match(homepage, /before you pay, onboard, partner, or invest/);
  assert.match(homepage, /Start free preview/);
});

test("homepage makes the product contract and report value visible", () => {
  assert.match(homepage, /What the investigation delivers/);
  assert.match(homepage, />Input</);
  assert.match(homepage, />Analysis</);
  assert.match(homepage, />Decision record</);
  assert.match(homepage, /traceable evidence and recommended controls/);
});

test("illustrative decision preview is clearly labeled and accessible", () => {
  assert.match(homepage, /aria-labelledby="decision-preview-title"/);
  assert.match(homepage, /Illustrative decision preview/);
  assert.match(homepage, /Sample data for format demonstration/);
  assert.match(homepage, /Findings are not from a live investigation/);
});
