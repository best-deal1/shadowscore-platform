import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

import { createDefaultProviders, discoverDkimRecords, RobotsTxtProvider, SecurityTxtProvider } from "../lib/providers/index.ts";

function context(target) {
  return { intakeId: "intake-pr9", scanMode: "paid", target, platform: "web", fileNames: [], visibleSignalCategories: [], executionProfile: "paid_report" };
}

async function fixtureServer() {
  const server = createServer((request, response) => {
    if (request.url === "/robots.txt") {
      response.setHeader("content-type", "text/plain");
      response.end("User-agent: *\nDisallow: /private\nSitemap: https://example.test/sitemap.xml\n");
      return;
    }
    if (request.url === "/.well-known/security.txt") {
      response.setHeader("content-type", "text/plain");
      response.end("Contact: mailto:security@example.test\nExpires: 2099-01-01T00:00:00Z\n");
      return;
    }
    response.statusCode = 404;
    response.end("missing");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return { server, origin: `http://127.0.0.1:${address.port}` };
}

test("robots.txt provider collects published directives", async (t) => {
  const fixture = await fixtureServer();
  t.after(() => fixture.server.close());
  const result = await new RobotsTxtProvider().execute(context(fixture.origin));
  assert.equal(result.status, "completed");
  assert.equal(result.metadata.published, true);
  assert.equal(result.metadata.directiveCount, 3);
  assert.match(result.evidence.find((item) => item.id === "robots-document").value, /Disallow: \/private/);
});

test("security.txt provider extracts contact and expiration", async (t) => {
  const fixture = await fixtureServer();
  t.after(() => fixture.server.close());
  const result = await new SecurityTxtProvider().execute(context(fixture.origin));
  assert.equal(result.status, "completed");
  assert.equal(result.metadata.published, true);
  assert.equal(result.metadata.expired, false);
  assert.equal(result.findings.length, 0);
  assert.equal(result.evidence.find((item) => item.id === "security-txt-contact").value, "mailto:security@example.test");
});

test("DKIM discovery checks selectors and returns only valid DKIM records", async () => {
  const queries = [];
  const records = await discoverDkimRecords("example.test", ["selector1", "selector2"], async (name) => {
    queries.push(name);
    return name.startsWith("selector1") ? [["v=DKIM1; k=rsa; ", "p=abc123"]] : [["unrelated=value"]];
  });
  assert.deepEqual(queries.sort(), ["selector1._domainkey.example.test", "selector2._domainkey.example.test"]);
  assert.deepEqual(records, [{ selector: "selector1", name: "selector1._domainkey.example.test", value: "v=DKIM1; k=rsa; p=abc123" }]);
});

test("default provider registry includes the PR9 providers", () => {
  const ids = createDefaultProviders().map((provider) => provider.id);
  assert.ok(ids.includes("robots-txt"));
  assert.ok(ids.includes("security-txt"));
  assert.ok(ids.includes("dkim"));
});
