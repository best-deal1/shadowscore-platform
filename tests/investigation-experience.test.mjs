import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("processing presents a truthful intelligence narrative", async () => {
  const agent = await read("app/reports/[reportId]/InvestigationAgent.tsx");
  for (const phrase of ["Live intelligence operation", "Identity resolving", "Sources discovering", "Evidence cross-validating", "Risk interpreting", "Decision preparing", "Why it matters"]) {
    assert.ok(agent.includes(phrase), phrase);
  }
  assert.doesNotMatch(agent, /evidenceCount/);
  assert.match(agent, /aria-busy={!ready}/);
  assert.match(agent, /role="progressbar"/);
  assert.match(agent, /aria-live="polite"/);
});

test("processing motion has a reduced-motion mode", async () => {
  const css = await read("app/globals.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.intelligence-radar-sweep/);
});
