import assert from "node:assert/strict";
const { buildAcquisitionHealthReport, classifyAcquisitionFailure } = await import("../lib/acquisitionHealth.ts");
const { buildBusinessProfile } = await import("../lib/businessProfileEngine/index.ts");

const observedAt = "2026-07-16T00:00:00.000Z";
const targets = [
  "microsoft.com", "stripe.com", "apple.com", "amazon.com", "google.com", "meta.com", "netflix.com", "shopify.com", "salesforce.com", "adobe.com",
  "walmart.com", "target.com", "nike.com", "paypal.com", "squareup.com", "uber.com", "airbnb.com", "spotify.com", "zoom.us", "github.com",
  "cloudflare.com", "bankhapoalim.co.il", "ksp.co.il", "bug.co.il", "ivory.co.il", "woocommerce-store.example", "saas-private.example", "gadgetdeals.co.il", "shopify-store.example", "unknown-bank-looking.example",
];
function result(providerId, status, evidence = [], metadata = {}, errors = [], duration = 20) { return { providerId, providerVersion: "test", status, startedAt: observedAt, completedAt: observedAt, duration, findings: [], evidence, metadata, errors }; }
function ev(id, label, value, source = id) { return { id, type: "document", label, value, source }; }
const rows = targets.map((target, index) => {
  const business = result("business-profile", "completed", [ev("name", "Business name", index >= 27 ? "" : `${target.split(".")[0]} Legal Entity`), ev("country", "Country", "US")], { category: "business_profile", providerConfidenceWeight: 0.82 }, [], 35 + index);
  const dns = result("dns", "completed", [ev("a", "DNS A record", "203.0.113.10"), ev("mx", "MX record", "mail.example.com")], { category: "dns", providerConfidenceWeight: 0.62, records: { A: ["203.0.113.10"], MX: ["mail.example.com"] } }, [], 10 + index);
  const whois = index % 3 === 0 ? result("whois", "skipped", [], { category: "whois", failureReason: "Timeout", lookupPerformed: false }, ["WHOIS timed out"], 5000) : result("whois", "completed", [ev("created", "Domain registration date", "2010-01-01")], { category: "whois", providerConfidenceWeight: 0.62, registrationDate: "2010-01-01" }, [], 80);
  const ssl = index % 5 === 0 ? result("ssl", "skipped", [], { category: "ssl", failureReason: "Source Unavailable", lookupPerformed: false }, ["certificate source unavailable"], 900) : result("ssl", "completed", [ev("cert", "SSL certificate organization", target)], { category: "ssl", providerConfidenceWeight: 0.62 }, [], 75);
  const providerResults = [business, dns, whois, ssl];
  const health = buildAcquisitionHealthReport(providerResults, observedAt);
  const profile = buildBusinessProfile({ providerResults, target, generatedAt: observedAt });
  return { target, providerResults, health, profile };
});

assert.equal(rows.length, 30, "corpus must contain 30 targets");
assert.ok(rows.some((row) => row.health.providerAvailability.some((p) => p.failureKind === "network_failure")), "network failures must be classified separately");
assert.ok(rows.some((row) => row.health.providerAvailability.some((p) => p.failureKind === "source_unavailable")), "source unavailable must be classified separately");
assert.ok(rows.every((row) => row.health.businessEvidence.collected > 0), "provider failures must not erase independently collected business evidence");
assert.ok(rows.filter((row) => row.providerResults.some((r) => r.providerId === "whois" && r.status !== "completed") && row.profile.identityConfidence !== "Low").length > 0, "WHOIS timeout alone must not force low-confidence review when other evidence exists");
assert.equal(classifyAcquisitionFailure(result("empty", "completed", [], { category: "business_profile" })), "evidence_missing");
console.table(rows.map((row) => ({ target: row.target, identityConfidence: row.profile.identityConfidence, businessEvidence: row.health.businessEvidence.collected, providerFailuresExcluded: row.health.businessEvidence.providerFailuresExcluded, unavailableProviders: row.health.providerAvailability.filter((p) => p.availability === "unavailable").map((p) => `${p.providerId}:${p.failureKind}`).join(" | ") })));
console.log("Acquisition Health 30-target corpus passed");
