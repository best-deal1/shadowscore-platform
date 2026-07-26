import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { companyEvidenceFor, resolveCompanyTarget, validationCompanies } from "./fixtures/companyEvidenceCatalog.ts";
import { ReputationProvider } from "../lib/providers/productionProviders.ts";

function context(target) {
  return { intakeId: `validation-${target}`, scanMode: "company", target, requestedTarget: target, platform: "validation", fileNames: [], visibleSignalCategories: [] };
}

async function withMockSec(run) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://efts.sec.gov");
    const query = url.searchParams.get("q");
    return new Response(JSON.stringify({ hits: { total: { value: 1 }, hits: [{ _id: `${query}-record`, _source: { form: "10-K", file_date: "2026-01-01", display_names: [`${query} filing entity`] } }] } }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try { return await run(); } finally { globalThis.fetch = originalFetch; }
}

test("the company catalog remains a validation fixture", async () => {
  assert.equal(companyEvidenceFor("Microsoft")?.domain, "microsoft.com");
  assert.equal(resolveCompanyTarget("Unlisted Example Company").resolvedTarget, "Unlisted Example Company");
  const productionFiles = ["lib/providers/productionProviders.ts", "lib/providers/defaultProviders.ts", "app/api/free-scan/providers/route.ts"];
  for (const file of productionFiles) assert.doesNotMatch(await readFile(new URL(`../${file}`, import.meta.url), "utf8"), /companyEvidenceCatalog|validationCompanies|companyEvidenceFor|resolveCompanyTarget/, `${file} must not import validation company knowledge`);
});

test("reputation evidence is collected dynamically from an authoritative source", async () => {
  await withMockSec(async () => {
    const results = await Promise.all(validationCompanies.slice(0, 3).map((name) => new ReputationProvider().execute(context(name))));
    assert.ok(results.every((result) => result.status === "completed"));
    assert.ok(results.every((result) => result.metadata.sourceType === "live_authoritative_public_records"));
    assert.ok(results.every((result) => result.evidence.some((item) => new URL(item.source).hostname.endsWith("sec.gov"))));
    assert.equal(new Set(results.map((result) => result.evidence[1]?.value)).size, results.length);
  });
});

test("public-record matches are not converted into adverse findings", async () => {
  await withMockSec(async () => {
    const result = await new ReputationProvider().execute(context("FTX"));
    assert.equal(result.status, "completed");
    assert.deepEqual(result.findings, []);
    assert.match(String(result.metadata.assessmentPolicy), /not treated as adverse findings/);
  });
});
