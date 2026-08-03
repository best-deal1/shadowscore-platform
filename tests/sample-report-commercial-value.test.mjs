import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sample = await readFile(new URL("../app/sample-report/page.tsx", import.meta.url), "utf8");

test("sample report leads with an explicit decision and evidence chain", () => {
  assert.match(sample, /See the decision record before you buy\./);
  assert.match(sample, /Proceed after one website control is reviewed\./);
  assert.match(sample, /OBSERVATION/);
  assert.match(sample, /FINDING/);
  assert.match(sample, /CONTROL/);
});

test("sample report clearly labels demonstration content", () => {
  assert.match(sample, /Demonstration data/);
  assert.match(sample, /Findings are illustrative/);
  assert.match(sample, /rather than a live investigation/);
});

test("sample report explains the paid deliverable and next action", () => {
  assert.match(sample, /Why this is more useful than search/);
  assert.match(sample, /What the \$9\.90 report provides/);
  assert.match(sample, /Included in the decision record/);
  assert.match(sample, /Start free preview/);
  assert.match(sample, /Review methodology/);
});

test("sample report exposes semantic section navigation", () => {
  assert.match(sample, /aria-label="Report sections"/);
  for (const id of ["decision-brief", "report-dashboard", "evidence-detail", "report-value"]) {
    assert.match(sample, new RegExp(`id="${id}"`));
  }
});
