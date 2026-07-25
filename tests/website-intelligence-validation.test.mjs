import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const load = (name) => JSON.parse(readFileSync(resolve(root, "validation/website-intelligence", name), "utf8"));
const corpus = load("corpus.json");
const inventory = load("providers.json");
const matrix = load("matrix.json");
const expectedModules = ["domain", "dns", "ssl", "http", "security_headers", "technology", "infrastructure", "email", "reputation", "quality", "screenshot"];

test("the validation corpus is a fixed set of 20 unique domains", () => {
  assert.equal(corpus.version, 1);
  assert.equal(corpus.sites.length, 20);
  assert.deepEqual(corpus.sites.map((site) => site.id), Array.from({ length: 20 }, (_, index) => `WI-${String(index + 1).padStart(2, "0")}`));
  assert.equal(new Set(corpus.sites.map((site) => site.domain)).size, 20);
  for (const site of corpus.sites) {
    assert.match(site.domain, /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/);
    assert.ok(site.segment && site.region);
  }
});

test("the provider inventory maps every production module exactly once", () => {
  assert.equal(inventory.version, 1);
  assert.deepEqual(inventory.providers.map((provider) => provider.moduleId), expectedModules);
  assert.equal(new Set(inventory.providers.map((provider) => provider.moduleId)).size, expectedModules.length);
  assert.equal(inventory.providers.filter((provider) => provider.requiredForPilot).length, 8);
  assert.deepEqual(inventory.providers.filter((provider) => provider.mode === "placeholder").map((provider) => provider.moduleId), ["reputation", "screenshot"]);

  const source = readFileSync(resolve(root, "lib/websiteIntelligence/modules.ts"), "utf8");
  for (const moduleId of expectedModules) assert.ok(source.includes(`simple("${moduleId}"`), `missing production module ${moduleId}`);
});

test("the matrix defines baseline metrics and a conditional pilot recommendation", () => {
  const baseline = matrix.baseline;
  assert.equal(baseline.kind, "acceptance-target");
  assert.equal(baseline.corpusSize, corpus.sites.length);
  assert.equal(baseline.providerInventorySize, inventory.providers.length);
  assert.equal(baseline.requiredProviderCount, inventory.providers.filter((provider) => provider.requiredForPilot).length);
  assert.deepEqual({
    site: baseline.minimumSiteCompletionRate,
    required: baseline.minimumRequiredModuleCompletionRate,
    evidence: baseline.minimumEvidenceCoverageRate,
    duration: baseline.maximumP95DurationMs,
    failures: baseline.maximumUnexpectedFailureRate,
  }, { site: 0.95, required: 0.9, evidence: 0.9, duration: 15000, failures: 0.05 });
  assert.equal(matrix.recommendation.status, "conditional");
  assert.equal(matrix.checks.length, 9);
  assert.equal(new Set(matrix.checks.map((check) => check.id)).size, matrix.checks.length);
});

test("the live runner is inert unless the explicit environment flag is enabled", () => {
  const env = { ...process.env };
  delete env.WEBSITE_INTELLIGENCE_LIVE;
  const output = execFileSync(process.execPath, ["--experimental-strip-types", "scripts/validate-website-intelligence-live.mjs"], { cwd: root, env, encoding: "utf8" });
  assert.match(output, /live validation skipped/i);
});
