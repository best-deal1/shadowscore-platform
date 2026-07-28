import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SECClient, SECRegistry, SEC_URLS } from "../lib/entityResolution/authoritative/index.ts";

const fixture = async (name) => JSON.parse(await readFile(new URL(`./fixtures/sec/${name}`, import.meta.url), "utf8"));

function mockSEC(responses) {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    const body = responses[String(url)];
    return body === undefined
      ? new Response("", { status: 404 })
      : new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  };
  return { fetch, calls };
}

test("SEC client uses official endpoints and identification headers", async () => {
  const tickerData = await fixture("company_tickers_exchange.json");
  const mock = mockSEC({ [SEC_URLS.companyTickersExchange]: tickerData });
  const client = new SECClient({ fetch: mock.fetch, userAgent: "Registry tests test@example.com" });
  assert.deepEqual(await client.fetchTickerDataset(), tickerData);
  assert.equal(mock.calls[0].url, SEC_URLS.companyTickersExchange);
  assert.deepEqual(mock.calls[0].options.headers, { accept: "application/json", "user-agent": "Registry tests test@example.com" });
});

test("SEC registry resolves a ticker and enriches it from submissions", async () => {
  const tickerData = await fixture("company_tickers_exchange.json");
  const submissions = await fixture("CIK0000320193.json");
  const mock = mockSEC({
    [SEC_URLS.companyTickersExchange]: tickerData,
    [SEC_URLS.submissions("0000320193")]: submissions,
  });
  const registry = new SECRegistry(new SECClient({ fetch: mock.fetch }));
  const issuer = await registry.resolveByTicker("aapl");
  assert.equal(issuer?.registryId, "0000320193");
  assert.equal(issuer?.legalName, "Apple Inc.");
  assert.equal(issuer?.website, "https://www.apple.com");
  assert.deepEqual(issuer?.sourceUrls, [SEC_URLS.submissions("0000320193"), SEC_URLS.companyTickersExchange]);
});

test("SEC registry supports CIK and exact normalized name lookups", async () => {
  const tickerData = await fixture("company_tickers_exchange.json");
  const submissions = await fixture("CIK0000320193.json");
  const mock = mockSEC({
    [SEC_URLS.companyTickersExchange]: tickerData,
    [SEC_URLS.submissions("0000320193")]: submissions,
  });
  const registry = new SECRegistry(new SECClient({ fetch: mock.fetch }));
  assert.equal((await registry.resolveByCIK("CIK320193"))?.legalName, "Apple Inc.");
  assert.equal((await registry.resolveByName("apple inc"))[0]?.registryId, "0000320193");
  assert.equal(await registry.resolveByTicker("missing"), null);
});

test("SEC client returns null for a missing issuer and reports upstream failures", async () => {
  const missing = new SECClient({ fetch: mockSEC({}).fetch });
  assert.equal(await missing.fetchSubmissions("1"), null);
  const failing = new SECClient({ fetch: async () => new Response("", { status: 503 }) });
  await assert.rejects(() => failing.fetchTickerDataset(), /status 503/);
  await assert.rejects(() => missing.fetchSubmissions("invalid"), /CIK must contain/);
});
