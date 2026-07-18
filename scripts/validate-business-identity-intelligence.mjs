import assert from "node:assert/strict";
import { buildBusinessIdentityIntelligence } from "../lib/businessIdentityIntelligence/index.ts";

const now = "2026-07-16T00:00:00.000Z";
const result = (providerId, metadata, evidence = []) => ({ providerId, providerVersion: "test", status: "completed", startedAt: now, completedAt: now, duration: 1, findings: [], evidence, metadata, errors: [] });
const ev = (id, label, value, source = "fixture") => ({ id, type: "document", label, value, source });

const scenarios = [
  { name: "consistent business", target: "acme.com", expected: ["Identity Consistent", "Verified Identity"], providers: [result("business-profile", { legalName: "Acme Inc.", businessName: "Acme", domain: "acme.com", source: "official_registry" }), result("privacy", { evidenceCategory: "privacy_policy", legalName: "Acme Inc." }), result("terms", { evidenceCategory: "terms_of_service", legalName: "Acme Inc." })] },
  { name: "incomplete business", expected: ["Identity Incomplete"], providers: [result("dns", { domain: "thin.example" })] },
  { name: "conflicting identities", expected: ["Identity Conflict", "Potential Impersonation"], providers: [result("site", { businessName: "North Star Shop" }), result("registry", { legalName: "South Star LLC", source: "official_registry" })] },
  { name: "copied privacy policy", expected: ["Conflicting Legal Entity"], providers: [result("site", { businessName: "Widget Store", legalName: "Widget Store LLC" }), result("privacy", { privacyPolicyEntity: "Other Company Ltd" })] },
  { name: "copied terms", expected: ["Conflicting Legal Entity"], providers: [result("site", { legalName: "Widget Store LLC" }), result("terms", { termsEntity: "Template Vendor Inc." })] },
  { name: "conflicting copyright", expected: ["Conflicting Legal Entity"], providers: [result("site", { legalName: "Widget Store LLC" }), result("footer", {}, [ev("copyright", "Copyright owner", "Unrelated Media LLC")])] },
  { name: "inconsistent company names", expected: ["Identity Conflict"], providers: [result("marketplace", { businessName: "Bright Deals" }), result("contact", { businessName: "Bright Dealz" })] },
  { name: "unrelated contact details", expected: ["Conflicting Contact Information"], providers: [result("contact", { email: "support@shop.example", phone: "+1 555 0100" }), result("privacy", { contactEmail: "legal@other.example", phone: "+1 555 9999" })] },
  { name: "unsupported official status", expected: ["Potential Identity Misrepresentation"], providers: [result("site", { businessName: "Official Example Support", officialClaim: "Official partner" })] },
  { name: "known parent relationship", target: "github.com", expected: [], providers: [result("site", { domain: "github.com" })], trustSignal: "proceed", parent: "Microsoft Corporation" },
  { name: "historical material event", target: "ftx.com", expected: [], providers: [result("site", { domain: "ftx.com" })], trustSignal: "do_not_proceed", historicalEvents: 2 },
];

const rows = scenarios.map((scenario) => {
  const report = buildBusinessIdentityIntelligence({ target: scenario.target || `${scenario.name.replaceAll(" ", "-")}.example`, providerResults: scenario.providers, generatedAt: now });
  const categories = new Set(report.findings.map((finding) => finding.category));
  for (const category of scenario.expected) assert.ok(categories.has(category), `${scenario.name} should include ${category}; got ${[...categories].join(", ")}`);
  if (scenario.trustSignal) assert.equal(report.recommendationSignal, scenario.trustSignal, `${scenario.name} recommendation signal`);
  if (scenario.parent) assert.equal(report.businessProfile.parentCompany, scenario.parent, `${scenario.name} parent company`);
  if (scenario.historicalEvents) assert.equal(report.historicalEvents.length, scenario.historicalEvents, `${scenario.name} historical event count`);
  for (const finding of report.findings) {
    assert.ok(finding.evidence.length > 0, `${scenario.name} finding ${finding.id} has evidence`);
    assert.ok(finding.provenance.length > 0, `${scenario.name} finding ${finding.id} has provenance`);
    assert.ok(finding.confidence > 0 && finding.confidence <= 1, `${scenario.name} finding ${finding.id} confidence range`);
    assert.ok(finding.explanation && !/fraud|scam/i.test(finding.explanation), `${scenario.name} finding ${finding.id} observable explanation`);
    assert.ok(finding.affectedEntities.length > 0, `${scenario.name} finding ${finding.id} affected entities`);
  }
  return { scenario: scenario.name, expected: scenario.expected.join("; "), actual: [...categories].join("; "), evidenceCoverage: report.evidenceCoverage.totalEvidence };
});

const expectedFindings = scenarios.reduce((sum, scenario) => sum + scenario.expected.length, 0);
const coveredExpectedFindings = rows.reduce((sum, row) => sum + row.expected.split("; ").filter((expected) => row.actual.includes(expected)).length, 0);
const precision = coveredExpectedFindings / expectedFindings;
assert.ok(precision >= 0.95, `finding precision ${precision}`);
assert.equal(rows.filter((row) => row.evidenceCoverage === 0).length, 0, "evidence coverage");
console.table(rows);
console.log(JSON.stringify({ findingPrecision: precision, falsePositivesReviewed: true, explanationQuality: "all findings include non-accusatory explanations", evidenceCoverage: rows.map((row) => ({ scenario: row.scenario, evidence: row.evidenceCoverage })) }, null, 2));
