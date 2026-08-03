import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sample = await readFile(new URL("../app/sample-report/page.tsx", import.meta.url), "utf8");

test("sample report leads with an explicit decision and evidence chain", () => {
  assert.match(sample, /See the decision record before you buy\./);
  assert.match(sample, /Proceed after one website control is reviewed\./);
  for (const stage of ["OBSERVATION", "FINDING", "CONTROL"]) assert.match(sample, new RegExp(stage));
});

test("sample report clearly labels representative data and product scope", () => {
  for (const copy of ["Demonstration data", "fixed demonstration data", "Business Investigation", "Website Intelligence checks"]) assert.match(sample, new RegExp(copy));
  assert.doesNotMatch(sample, /Illustrative Executive Report|What the \$9\.90 report provides/);
});

test("sample report identifies a professional decision record", () => {
  for (const field of ["Report reference", "Subject", "Generated", "Methodology version", "Investigation scope", "Partial evidence"]) assert.match(sample, new RegExp(field));
  assert.match(sample, /2026-07-25T10:00:00Z/);
});

test("sample report defines the self-service offer and enterprise path", () => {
  for (const copy of ["Current self-service entry offer", "Included", "Service boundaries", "Expected delivery", "Access and retention", "Evidence limits", "Not included", "Enterprise evaluation", "Contact sales"]) assert.match(sample, new RegExp(copy));
});

test("sample report explains decision value without unsupported ROI claims", () => {
  assert.match(sample, /Why this is more useful than search/);
  assert.match(sample, /source, observation time, confidence, business impact, and evidence limits/);
  assert.match(sample, /another reviewer can inspect/);
  assert.doesNotMatch(sample, /return on investment|ROI|save[s]? \d+|guaranteed/i);
});

test("sample report exposes semantic navigation and a focused CTA hierarchy", () => {
  assert.match(sample, /aria-label="Report sections"/);
  for (const id of ["decision-brief", "report-dashboard", "evidence-detail", "report-value"]) assert.match(sample, new RegExp(`id="${id}"`));
  assert.equal((sample.match(/href="\/intake"/g) || []).length, 1);
  assert.equal((sample.match(/href="\/methodology"/g) || []).length, 1);
  assert.equal((sample.match(/href="\/contact"/g) || []).length, 1);
});
