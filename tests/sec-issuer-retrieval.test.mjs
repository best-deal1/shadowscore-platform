import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SECClient, SECIssuerRetriever, SEC_URLS } from "../lib/entityResolution/authoritative/sec/index.ts";

const fixture = async (name) => JSON.parse(await readFile(new URL(`./fixtures/sec/${name}`, import.meta.url), "utf8"));

function authoritativeInput(cik, overrides = {}) {
  return {
    entity: {
      entityId: "entity-1", entityType: "company", displayName: "Issuer", canonicalName: "Issuer",
      resolutionStatus: "AUTHORITATIVE", provenance: [], createdAt: "2026-01-01", updatedAt: "2026-01-01",
      resolverVersion: "sec@1", schemaVersion: "entity@1", metadata: { authoritativeIdentifiers: { sec: { cik } } },
      ...overrides.entity,
    },
    issuer: {
      registry: "sec", registryId: cik, legalName: "Issuer", tickers: [], exchanges: [], sourceUrls: [], raw: {},
      ...overrides.issuer,
    },
  };
}

function clientFor(responses, statuses = {}) {
  const calls = [];
  const fetch = async (url) => {
    const key = String(url);
    calls.push(key);
    const status = statuses[key] ?? (key in responses ? 200 : 404);
    return new Response(status === 200 ? JSON.stringify(responses[key]) : "", { status });
  };
  return { client: new SECClient({ fetch }), calls };
}

test("retrieves normalized Apple and Microsoft issuer filings with canonical EDGAR URLs", async () => {
  for (const [cik, name] of [["320193", "issuer-apple.json"], ["789019", "issuer-microsoft.json"]]) {
    const normalized = cik.padStart(10, "0");
    const payload = await fixture(name);
    const { client } = clientFor({ [SEC_URLS.submissions(normalized)]: payload });
    const result = await new SECIssuerRetriever(client).retrieve(authoritativeInput(cik));
    assert.equal(result.status, "success");
    assert.ok(result.filings.every((filing) => filing.cik === normalized && filing.source === "issuer_submissions"));
    assert.equal(result.filings[0].filingUrl, `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${result.filings[0].accessionNumber.replaceAll("-", "")}/${result.filings[0].primaryDocument}`);
  }
});

test("normalizes NVIDIA's CIK and supports an empty filing list", async () => {
  const payload = await fixture("issuer-nvidia.json");
  const cik = "0001045810";
  const { client } = clientFor({ [SEC_URLS.submissions(cik)]: payload });
  const result = await new SECIssuerRetriever(client).retrieve(authoritativeInput("CIK1045810", { issuer: { registryId: "1045810" } }));
  assert.deepEqual(result, { status: "success", cik, filings: [], issues: [] });
});

test("preserves recent and historical batch ordering and filing fields", async () => {
  const submissions = await fixture("issuer-multiple-batches.json");
  const historical = await fixture("CIK0000320193-submissions-001.json");
  const cik = "0000320193";
  const filename = "CIK0000320193-submissions-001.json";
  const { client, calls } = clientFor({ [SEC_URLS.submissions(cik)]: submissions, [SEC_URLS.submissionFile(filename)]: historical });
  const result = await new SECIssuerRetriever(client).retrieve(authoritativeInput(cik));
  assert.equal(result.status, "success");
  assert.deepEqual(result.filings.map(({ accessionNumber }) => accessionNumber), ["0000320193-26-000003", "0000320193-26-000002", "0000320193-25-000001"]);
  assert.equal(result.filings[2].filingDate, "2025-01-01");
  assert.equal(result.filings[2].primaryDocumentDescription, "Annual report");
  assert.deepEqual(calls, [SEC_URLS.submissions(cik), SEC_URLS.submissionFile(filename)]);
});

test("reports a missing historical index while retaining available filings", async () => {
  const submissions = await fixture("issuer-multiple-batches.json");
  const cik = "0000320193";
  const { client } = clientFor({ [SEC_URLS.submissions(cik)]: submissions });
  const result = await new SECIssuerRetriever(client).retrieve(authoritativeInput(cik));
  assert.equal(result.status, "partial");
  assert.equal(result.filings.length, 2);
  assert.equal(result.issues[0].code, "missing_historical_index");
});

test("distinguishes malformed payloads, missing issuers, and upstream failures", async () => {
  const cik = "0000320193";
  const malformed = await fixture("issuer-malformed.json");
  let setup = clientFor({ [SEC_URLS.submissions(cik)]: malformed });
  assert.equal((await new SECIssuerRetriever(setup.client).retrieve(authoritativeInput(cik))).issues[0].code, "malformed_payload");
  setup = clientFor({});
  assert.equal((await new SECIssuerRetriever(setup.client).retrieve(authoritativeInput(cik))).issues[0].code, "issuer_not_found");
  setup = clientFor({}, { [SEC_URLS.submissions(cik)]: 503 });
  assert.equal((await new SECIssuerRetriever(setup.client).retrieve(authoritativeInput(cik))).issues[0].code, "upstream_failure");
});

test("fails gracefully without one authoritative CIK", async () => {
  const { client, calls } = clientFor({});
  const input = authoritativeInput("320193");
  input.entity.metadata = {};
  const result = await new SECIssuerRetriever(client).retrieve(input);
  assert.equal(result.status, "failed");
  assert.equal(result.issues[0].code, "missing_cik");
  assert.deepEqual(calls, []);
});

test("isolates issuers across resolved, registry, current, and historical CIK values", async () => {
  const apple = await fixture("issuer-apple.json");
  const cik = "0000320193";
  let setup = clientFor({ [SEC_URLS.submissions(cik)]: apple });
  let result = await new SECIssuerRetriever(setup.client).retrieve(authoritativeInput(cik, { issuer: { registryId: "789019" } }));
  assert.equal(result.issues[0].code, "issuer_mismatch");
  assert.deepEqual(setup.calls, []);

  result = await new SECIssuerRetriever(clientFor({ [SEC_URLS.submissions(cik)]: { ...apple, cik: "789019" } }).client).retrieve(authoritativeInput(cik));
  assert.equal(result.issues[0].code, "issuer_mismatch");

  const submissions = await fixture("issuer-multiple-batches.json");
  const historical = { ...(await fixture("CIK0000320193-submissions-001.json")), cik: "789019" };
  setup = clientFor({ [SEC_URLS.submissions(cik)]: submissions, [SEC_URLS.submissionFile("CIK0000320193-submissions-001.json")]: historical });
  result = await new SECIssuerRetriever(setup.client).retrieve(authoritativeInput(cik));
  assert.equal(result.issues[0].code, "issuer_mismatch");
  assert.deepEqual(result.filings, []);
});
