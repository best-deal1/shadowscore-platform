import assert from "node:assert/strict";
import test from "node:test";
import { createWebsiteChangeReport, MemoryWebsiteScanHistoryRepository } from "../lib/websiteIntelligence/history.ts";

function report(scannedAt, overrides = {}) {
  const evidence = (moduleId, label, value) => ({ id: `${moduleId}:${label}`, label, value, source: "test", observedAt: scannedAt });
  const moduleResult = (moduleId, label, value) => ({ moduleId, moduleName: moduleId, status: "completed", source: "test", confidence: 1, findings: [], evidence: [evidence(moduleId, label, value)], executiveSummary: "Test result.", durationMs: 1 });
  return { target: "example.com", scannedAt, modules: [
    moduleResult("ssl", "Certificate issuer", overrides.ssl || "Issuer A"),
    moduleResult("dns", "A records", overrides.dns || "192.0.2.1"),
    moduleResult("http", "HTTPS response status", overrides.http || "200"),
    moduleResult("domain", "Expiration date", overrides.whois || "2027-01-01"),
    moduleResult("security_headers", "content-security-policy", overrides.headers || "default-src 'self'"),
    moduleResult("reputation", "Reputation provider", overrides.reputation || "Clear"),
  ], findings: [], evidence: [], executiveSummary: "Test.", recommendedActions: [], technicalHealth: "Test.", securityPosture: "Test.", infrastructureMaturity: "Test.", trustIndicators: "Test." };
}

function snapshot(scanId, value) {
  const current = report("2026-07-25T10:00:00.000Z", value);
  return { scanId, target: current.target, scannedAt: current.scannedAt, report: current, changeReport: createWebsiteChangeReport(undefined, current, scanId) };
}

test("compares all monitored Website Intelligence categories", () => {
  const prior = snapshot("scan-1", {});
  const current = report("2026-07-25T11:00:00.000Z", { ssl: "Issuer B", dns: "192.0.2.2", http: "503", whois: "2028-01-01", headers: "Not published", reputation: "Listed" });
  const changes = createWebsiteChangeReport(prior, current, "scan-2");
  assert.deepEqual(new Set(changes.changes.map((item) => item.category)), new Set(["SSL/TLS", "DNS", "HTTP", "WHOIS", "Security Headers", "Reputation"]));
  assert.equal(changes.previousScanId, "scan-1");
  assert.equal(changes.changes.length, 6);
});

test("records an immutable baseline and returns defensive history copies", async () => {
  const repository = new MemoryWebsiteScanHistoryRepository();
  const target = `immutable-${Date.now()}.example`;
  const first = snapshot("immutable-scan", {}); first.target = target; first.report.target = target;
  await repository.append(first);
  first.report.modules[0].evidence[0].value = "mutated outside repository";
  const history = await repository.list(target);
  assert.equal(history[0].report.modules[0].evidence[0].value, "Issuer A");
  history[0].report.modules[0].evidence[0].value = "mutated returned copy";
  assert.equal((await repository.latest(target)).report.modules[0].evidence[0].value, "Issuer A");
  await assert.rejects(repository.append(first), /immutable/);
});
