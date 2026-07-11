import assert from "node:assert/strict";
import { buildVerificationDecision } from "./model";
import type { ProviderResult } from "../providers/types";
import { correlateEvidence } from "../correlation";
import { isValidPhoneCandidate } from "../correlation/relationships";

function result(providerId: string, evidence: ProviderResult["evidence"] = [], findings: ProviderResult["findings"] = [], metadata: Record<string, unknown> = {}, status: ProviderResult["status"] = "completed"): ProviderResult {
  const now = "2026-07-11T00:00:00.000Z";
  return { providerId, providerVersion: "integrity-v1", status, startedAt: now, completedAt: now, duration: 0, findings, evidence, metadata: { integrationStatus: "connected", lookupPerformed: true, ...metadata }, errors: [] };
}

const dns = (domain: string, txt: string[] = []) => result("dns", [
  { id: "dns-domain", type: "observation", label: "Normalized domain", value: domain, source: "node:dns" },
  { id: "dns-a-records", type: "observation", label: "A records", value: "203.0.113.10", source: "node:dns" },
  { id: "dns-aaaa-records", type: "observation", label: "AAAA records", value: "unavailable", source: "node:dns" },
  { id: "dns-cname-records", type: "observation", label: "CNAME records", value: "unavailable", source: "node:dns" },
], [], { records: { A: ["203.0.113.10"], NS: ["ns1.test"], MX: ["mail.test"], TXT: txt, AAAA: [], CNAME: [] } });
const whois = () => result("whois", [{ id: "whois-created", type: "document", label: "WHOIS creation date", value: "2015-01-01", source: "rdap" }], [], { registrationDate: "2015-01-01", ageDays: 4200 });
const profile = (domain: string, name: string) => result("business-profile", [
  { id: "profile-domain", type: "observation", label: "Business website domain", value: domain, source: `https://${domain}` },
  { id: "profile-organization", type: "document", label: "Business name", value: name, source: `https://${domain}` },
]);
const reputation = () => result("reputation", [{ id: "reputation-signal", type: "placeholder", label: "Reputation source not checked", value: "Not Checked", source: "local-reputation-abstraction" }], [], { integrationStatus: "not_connected", lookupPerformed: false, abstraction: true });

export function runDecisionIntegrityValidationSuite() {
  const realDomains = [
    ["stripe.com", "Stripe"],
    ["ynet.co.il", "Ynet"],
    ["bankhapoalim.co.il", "Bank Hapoalim"],
    ["gadgetdeals.co.il", "Gadget Deals"],
  ] as const;
  const rows = realDomains.map(([domain, name]) => {
    const output = buildVerificationDecision({ providerResults: [dns(domain, ["v=spf1 include:test -all"]), whois(), profile(domain, name), reputation()], audience: "free", targetType: "website" });
    assert.notEqual(output.decision, "FAIL", `${domain} must never be CONFIRMED RISK`);
    assert.ok(!output.blockingIssues.includes("Marketplace seller differs from company"), `${domain} marketplace contradiction`);
    assert.ok(!output.missingSignals.some((s) => /marketplace|payment|compliance|aaaa|cname/i.test(s)), `${domain} has invalid material gap`);
    assert.ok(!output.reasons.some((s) => /high-trust public domain/i.test(s)), `${domain} local reputation increased trust`);
    return { domain, before: "CONFIRMED RISK from Marketplace seller differs from company", after: output.decision, blockingIssues: output.blockingIssues };
  });

  const negative = buildVerificationDecision({ providerResults: [profile("market.example", "Example LLC"), result("marketplace", [{ id: "seller", type: "document", label: "Marketplace seller identity", value: "Different Seller", source: "explicit-marketplace-evidence" }])], audience: "paid", targetType: "marketplaceSeller" });
  assert.equal(negative.decision, "FAIL", "explicit marketplace contradiction must still block");
  assert.ok(negative.blockingIssues.includes("Marketplace seller differs from company"));

  const missingDmarc = buildVerificationDecision({ providerResults: [dns("missing-dmarc.example", ["v=spf1 include:test -all"]), result("dmarc", [{ id: "dmarc-record", type: "configuration", label: "DMARC record", value: "unavailable", source: "node:dns" }], [{ id: "dmarc-missing", title: "DMARC record missing", description: "No DMARC", severity: "medium" }])], audience: "free", targetType: "website" });
  assert.notEqual(missingDmarc.decision, "FAIL", "DMARC absence alone must not be CONFIRMED RISK");

  assert.equal(isValidPhoneCandidate("2026-07-11"), false, "date rejected as phone");
  assert.equal(isValidPhoneCandidate("123456789012"), false, "numeric ID rejected as phone");

  const websiteCorrelation = correlateEvidence({ evidenceItems: [], targetType: "website" });
  assert.equal(websiteCorrelation.contradictions.some((c) => c.title === "Marketplace seller differs from company"), false);
  return { rows, negativeFixture: { decision: negative.decision, blockingIssues: negative.blockingIssues }, missingDmarc: missingDmarc.decision };
}
