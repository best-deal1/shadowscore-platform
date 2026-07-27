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

test("routine public-record matches are not converted into adverse findings", async () => {
  await withMockSec(async () => {
    const result = await new ReputationProvider().execute(context("FTX"));
    assert.equal(result.status, "completed");
    assert.deepEqual(result.findings, []);
    assert.equal(result.evidence[1].regulatoryClassification, "routine");
    assert.match(String(result.metadata.assessmentPolicy), /Routine filings support public-record coverage/);
  });
});

test("authoritative SEC records retain an adverse event classification", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ hits: { total: { value: 2 }, hits: [
    { _source: { form: "10-K", file_date: "2025-01-01", display_names: ["Example Corp"] } },
    { _source: { form: "8-K", file_date: "2025-02-01", display_names: ["Example Corp Chapter 11 bankruptcy proceeding"] } },
  ] } }), { status: 200, headers: { "content-type": "application/json" } });
  try {
    const result = await new ReputationProvider().execute(context("Example Corp"));
    assert.equal(result.evidence[1].regulatoryClassification, "routine");
    assert.equal(result.evidence[2].regulatoryClassification, "bankruptcy");
    assert.equal(result.evidence[2].authoritative, true);
    assert.equal(result.findings[0].severity, "high");
  } finally { globalThis.fetch = originalFetch; }
});

test("SEC full-text highlights and authoritative document fields reach regulatory classification", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ hits: { total: { value: 3 }, hits: [
    { _source: { form: "8-K", file_date: "2025-01-01", display_names: ["Example Corp"] }, highlight: { content: ["Example Corp filed for <em>Chapter 11 bankruptcy</em> protection."] } },
    { _source: { form: "8-K", file_date: "2025-02-01", display_names: ["Example Corp"], primary_doc_description: "SEC charged Example Corp with securities fraud" } },
    { _source: { form: "8-K", file_date: "2025-03-01", display_names: ["Example Corp"], items: ["DOJ criminal conviction"] } },
  ] } }), { status: 200, headers: { "content-type": "application/json" } });
  try {
    const result = await new ReputationProvider().execute(context("Example Corp"));
    assert.deepEqual(result.evidence.slice(1).map((item) => item.regulatoryClassification), ["bankruptcy", "regulatory_action", "criminal_enforcement"]);
    assert.match(result.evidence[1].value, /Chapter 11 bankruptcy protection/);
    assert.equal(result.metadata.recordsWithEventText, 3);
    assert.equal(result.findings.length, 3);
  } finally { globalThis.fetch = originalFetch; }
});

test("SEC debug telemetry is conditional and returned from the reachable metadata path", async () => {
  const originalDebug = process.env.DEBUG;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ hits: { total: { value: 1 }, hits: [
    { _source: { form: "8-K", title: "Example Corp bankruptcy" } },
  ] } }), { status: 200, headers: { "content-type": "application/json" } });
  try {
    delete process.env.DEBUG;
    const standardResult = await new ReputationProvider().execute(context("Example Corp"));
    assert.equal("rawSecResponse" in standardResult.metadata, false);
    assert.equal("eventTexts" in standardResult.metadata, false);
    assert.equal("classifications" in standardResult.metadata, false);
    assert.equal("secHitCount" in standardResult.metadata, false);

    process.env.DEBUG = "true";
    const debugResult = await new ReputationProvider().execute(context("Example Corp"));
    assert.equal(debugResult.metadata.rawSecResponse.hits.total.value, 1);
    assert.deepEqual(debugResult.metadata.eventTexts, ["Example Corp bankruptcy"]);
    assert.deepEqual(debugResult.metadata.classifications, ["bankruptcy"]);
    assert.equal(debugResult.metadata.secHitCount, 1);
    assert.equal(debugResult.metadata.recordsWithEventText, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalDebug === undefined) delete process.env.DEBUG;
    else process.env.DEBUG = originalDebug;
  }
});
