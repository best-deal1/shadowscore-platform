import assert from "node:assert/strict";
import test from "node:test";
import { detectWebsiteChanges, getWebsiteChangeTimeline, persistWebsiteScan } from "../lib/websiteIntelligence/history.ts";

function report(scannedAt, values) {
  const modules = Object.entries(values).map(([moduleId, evidence]) => ({
    moduleId,
    moduleName: moduleId,
    status: "completed",
    source: "test",
    confidence: 1,
    findings: [],
    evidence: Object.entries(evidence).map(([id, [label, value]]) => ({ id, label, value, source: "test", observedAt: scannedAt })),
    executiveSummary: "Test module.",
    durationMs: 1,
  }));
  return { target: "example.com", scannedAt, modules, findings: [], evidence: modules.flatMap((item) => item.evidence), executiveSummary: "Test report.", recommendedActions: [], technicalHealth: "Test", securityPosture: "Test", infrastructureMaturity: "Test", trustIndicators: "Test" };
}

const previous = report("2026-07-01T00:00:00.000Z", {
  ssl: { "ssl:expires": ["Certificate expiration", "2026-08-01"] },
  dns: { "dns:a": ["A records", "192.0.2.1"] },
  security_headers: { "headers:csp": ["content-security-policy", "Not published"], "headers:hsts": ["strict-transport-security", "max-age=100"] },
  domain: { "domain:expires": ["Expiration date", "2027-01-01"] },
  http: { "http:status": ["HTTPS response status", "200"] },
  reputation: { "reputation:score": ["Reputation score", "80"] },
});

const current = report("2026-07-02T00:00:00.000Z", {
  ssl: { "ssl:expires": ["Certificate expiration", "2027-08-01"] },
  dns: { "dns:a": ["A records", "192.0.2.2"] },
  security_headers: { "headers:csp": ["content-security-policy", "default-src 'self'"] },
  domain: { "domain:expires": ["Expiration date", "2028-01-01"] },
  http: { "http:status": ["HTTPS response status", "503"] },
  reputation: { "reputation:score": ["Reputation score", "50"] },
});

test("detects every required Website Intelligence change category", () => {
  const changes = detectWebsiteChanges(previous, current);
  assert.deepEqual(new Set(changes.map((change) => change.category)), new Set(["SSL/TLS", "DNS", "Security headers", "WHOIS", "HTTP", "Reputation"]));
});

test("classifies improved, regressed, removed, and new changes", () => {
  const changes = detectWebsiteChanges(previous, current);
  assert.equal(changes.find((change) => change.label === "Certificate expiration").classification, "Improved");
  assert.equal(changes.find((change) => change.label === "HTTPS response status").classification, "Regressed");
  assert.equal(changes.find((change) => change.label === "strict-transport-security").classification, "Removed");
  assert.equal(changes.find((change) => change.label === "A records").classification, "New");
});

test("appends scans, compares with the immediately previous scan, and retains the timeline", async () => {
  const userId = "history-test-user";
  const first = await persistWebsiteScan({ userId, report: previous });
  const second = await persistWebsiteScan({ userId, report: current });
  assert.equal(first.changeReport.previousScanId, undefined);
  assert.equal(first.changeReport.changes.length, 0);
  assert.equal(second.changeReport.previousScanId, first.id);
  assert.ok(second.changeReport.changes.length > 0);
  assert.deepEqual(getWebsiteChangeTimeline(userId, "example.com"), second.changeReport.changes);
});
