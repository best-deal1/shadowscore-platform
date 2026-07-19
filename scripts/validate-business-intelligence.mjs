import assert from "node:assert/strict";
import { buildBusinessIntelligence } from "../lib/businessIntelligence/index.ts";

const at = "2026-07-19T00:00:00.000Z";
const result = (providerId, evidence) => ({ providerId, providerVersion: "test", status: "completed", startedAt: at, completedAt: at, duration: 1, findings: [], metadata: {}, errors: [], evidence });
const evidence = (id, label, value) => ({ id, type: "observation", label, value, source: "fixture" });
const report = buildBusinessIntelligence([
  result("website", [evidence("name", "Business name", "North Store"), evidence("payment", "Payment provider", "Stripe"), evidence("ip", "IP address", "203.0.113.4")]),
  result("registry", [evidence("name", "Legal entity", "South Store LLC")]),
  result("checkout", [evidence("payment", "Payment provider", "PayPal")]),
  result("dns", [evidence("ip", "IP address", "203.0.113.4"), evidence("name", "Business name", "Other Store")]),
], at);
for (const category of ["identity_mismatch", "payment_inconsistency", "suspicious_infrastructure_reuse", "credibility_weakening"]) assert.ok(report.findings.some((item) => item.category === category), `missing ${category}`);
for (const item of report.findings) assert.ok(item.evidence.length > 0 && item.evidence.every((ref) => ref.providerId && ref.source), `${item.id} needs provenance`);
assert.ok(!buildBusinessIntelligence([result("one", [evidence("name", "Business name", "Only Store")])], at).findings.length, "one provider must not create a business finding");
console.log(`Validated ${report.findings.length} evidence-backed business findings.`);
