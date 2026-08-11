import assert from "node:assert/strict";
import test from "node:test";

import { buildQuickCheckReport } from "../lib/quickCheck/report.ts";

function result(providerId, category, evidence = [], options = {}) {
  return {
    providerId,
    providerVersion: "test",
    status: options.status || "completed",
    startedAt: new Date(0).toISOString(),
    completedAt: new Date(1).toISOString(),
    duration: 1,
    findings: options.findings || [],
    evidence: evidence.map(([id, label, value, source = providerId]) => ({ id, type: "observation", label, value, source })),
    metadata: { category, providerName: options.name || providerId, lookupPerformed: options.lookupPerformed ?? true },
    errors: [],
  };
}

test("website and DNS evidence cannot produce PROCEED", () => {
  const report = buildQuickCheckReport([
    result("dns", "dns", [["dns-a-records", "A records", "203.0.113.2"], ["dns-ns-records", "NS records", "ns.example"]]),
    result("ssl", "ssl", [["ssl-issuer", "SSL issuer", "Example CA"], ["ssl-valid-to", "SSL expiration", "2030-01-01"]]),
    result("website-commerce", "payment", [["commerce-payment-methods", "Payment methods", "Visa"], ["commerce-returns-policy", "Returns policy", "https://example.test/returns"]]),
  ]);

  assert.equal(report.decision, "VERIFY BEFORE PAYING");
  assert.equal(report.confidence, "Low");
  assert.ok(report.score <= 34);
  assert.ok(report.evidenceGaps.includes("Legal or business identity"));
  assert.ok(report.evidenceGaps.includes("Malware and phishing reputation"));
});

test("every unavailable category remains explicitly Not verified", () => {
  const report = buildQuickCheckReport([]);
  assert.equal(report.categories.length, 10);
  assert.ok(report.categories.every((category) => category.status === "Not verified"));
  assert.equal(report.evidenceCoverage, 0);
  assert.equal(report.score, 0);
});

test("a clean threat lookup is evidence of a completed query, not a safety guarantee", () => {
  const report = buildQuickCheckReport([
    result("threat-reputation", "reputation", [["urlhaus-host-status", "URLhaus host lookup", "No URLhaus listings returned", "https://urlhaus-api.abuse.ch/v1/host/"]], { name: "URLhaus Threat Reputation" }),
  ]);
  const category = report.categories.find((item) => item.id === "threat_reputation");
  assert.equal(category?.status, "Verified");
  assert.match(category?.summary || "", /not that the site is guaranteed safe/i);
  assert.deepEqual(report.sourcesSuccessfullyQueried, ["URLhaus Threat Reputation"]);
  assert.notEqual(report.decision, "PROCEED");
});

test("an active malware listing forces AVOID and a low score", () => {
  const report = buildQuickCheckReport([
    result("threat-reputation", "reputation", [["urlhaus-host-status", "URLhaus host lookup", "1 historical listing; 1 currently online"]], {
      findings: [{ id: "active", title: "Active malware URL reported by URLhaus", description: "Malware listing is online.", severity: "critical" }],
    }),
  ]);
  assert.equal(report.decision, "AVOID");
  assert.ok(report.score <= 20);
});

test("first-party identity remains partial without authoritative registry evidence", () => {
  const report = buildQuickCheckReport([
    result("website-commerce", "payment", [["commerce-observed-registration-number", "Website-published registration number", "123456789"]]),
  ]);
  const identity = report.categories.find((item) => item.id === "legal_identity");
  assert.equal(identity?.status, "Partially verified");
  assert.equal(identity?.sourceQuality, "first_party");
  assert.notEqual(report.decision, "PROCEED");
});
