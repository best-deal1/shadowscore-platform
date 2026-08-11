import assert from "node:assert/strict";
import test from "node:test";

import { ThreatReputationProvider } from "../lib/providers/productionProviders.ts";

const context = {
  intakeId: "quick-check-provider-test",
  scanMode: "website",
  target: "https://shop.example/",
  requestedTarget: "https://shop.example/",
  platform: "Website / Business",
  fileNames: [],
  visibleSignalCategories: [],
  executionProfile: "free_preview",
};

test("URLhaus no-results response records a completed independent lookup", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    assert.equal(init?.method, "POST");
    assert.equal(String(init?.body), "host=shop.example");
    return Response.json({ query_status: "no_results" });
  };
  try {
    const result = await new ThreatReputationProvider().execute(context);
    assert.equal(result.status, "completed");
    assert.equal(result.metadata.lookupPerformed, true);
    assert.equal(result.metadata.listingCount, 0);
    assert.equal(result.evidence[0]?.value, "No URLhaus listings returned");
    assert.equal(result.findings.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("URLhaus active listing becomes a critical finding", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ query_status: "ok", urls: [{ url: "https://shop.example/payload", url_status: "online", threat: "malware_download" }] });
  try {
    const result = await new ThreatReputationProvider().execute(context);
    assert.equal(result.status, "completed");
    assert.equal(result.metadata.activeListingCount, 1);
    assert.equal(result.findings[0]?.severity, "critical");
    assert.match(result.findings[0]?.title || "", /malware/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
