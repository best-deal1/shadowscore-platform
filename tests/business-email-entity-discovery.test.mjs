import test from "node:test";
import assert from "node:assert/strict";
import { BraveBusinessWebInvestigationProvider, extractBusinessWebClaims, investigateLive } from "../lib/investigationCollection/index.ts";
import { buildBusinessIntelligence } from "../lib/businessIntelligence/index.ts";

const NOW = new Date("2026-08-31T12:00:00.000Z");
const benchmarkResults = [
  { title: "לשם שפר איכות הסביבה בע\"מ", url: "https://shl.co.il/about", description: "לשם שפר איכות הסביבה בע\"מ, ח.פ. 514131291, contact sharon@shl.co.il" },
  { title: "Municipal supplier record", url: "https://contracts.tel-aviv.muni.il/vendor/514131291", description: "חברה: לשם שפר איכות הסביבה בע\"מ, מספר חברה: 514131291" },
  { title: "Ram Matan - Co CEO at Leshem-Sheffer Environmental", url: "https://www.linkedin.com/in/ram-matan", description: "Ram Matan - Co CEO at Leshem-Sheffer Environmental" },
  { title: "Unrelated same-name record", url: "https://directory.example/unrelated", description: "Sharon Services LLC, company number 99887766" },
];

test("business extraction keeps legal entities, registration IDs, and roles out of person-name typing", () => {
  const claims = extractBusinessWebClaims(`${benchmarkResults[0].title}. ${benchmarkResults[0].description}. ${benchmarkResults[2].title}`);
  assert.ok(claims.some((item) => item.kind === "legal_name" && /בע[\"״']?מ/.test(item.value)));
  assert.ok(claims.some((item) => item.kind === "registration_number" && item.value === "514131291"));
  assert.deepEqual(claims.find((item) => item.kind === "person_role"), { kind: "person_role", value: "Ram Matan: Co CEO", person: "Ram Matan", role: "Co CEO", company: "Leshem-Sheffer Environmental" });
  assert.equal(claims.some((item) => /** @type {any} */ (item).kind === "person_name"), false);
});

test("business intelligence uses evidence source families within one provider", () => {
  const result = buildBusinessIntelligence([{ providerId: "public-business-discovery", providerVersion: "1", status: "completed", startedAt: NOW, completedAt: NOW, duration: 0, findings: [], errors: [], metadata: {}, evidence: [
    { id: "first-party", type: "observation", label: "Company name", value: "SHL", source: "https://shl.co.il", sourceFamily: "first-party:shl.co.il" },
    { id: "government", type: "observation", label: "Company name", value: "SHL", source: "https://contracts.tel-aviv.muni.il", sourceFamily: "israeli-government:contracts.tel-aviv.muni.il" },
  ] }]);
  assert.ok(result.findings.some((item) => item.category === "credibility_support"));

  const sameFamily = buildBusinessIntelligence([{ providerId: "public-business-discovery", providerVersion: "1", status: "completed", startedAt: NOW, completedAt: NOW, duration: 0, findings: [], errors: [], metadata: {}, evidence: [
    { id: "one", type: "observation", label: "Company name", value: "SHL", source: "https://shl.co.il/about", sourceFamily: "first-party:shl.co.il" },
    { id: "two", type: "observation", label: "Company name", value: "SHL", source: "https://shl.co.il/contact", sourceFamily: "first-party:shl.co.il" },
  ] }]);
  assert.equal(sameFamily.findings.length, 0);
});

test("corporate email follows email to domain, entity, registration, and officer candidates with provenance", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ web: { results: benchmarkResults } });
  try {
    const output = await investigateLive({ kind: "email", value: "sharon@shl.co.il" }, { providers: [new BraveBusinessWebInvestigationProvider({ BRAVE_SEARCH_API_KEY: "test" })], now: () => NOW, maxDepth: 0 });
    assert.ok(output.graph.entities.some((item) => item.kind === "email" && item.label === "sharon@shl.co.il"));
    assert.ok(output.graph.entities.some((item) => item.kind === "domain" && item.label === "shl.co.il"));
    const company = output.graph.entities.find((item) => item.kind === "company" && item.label.includes("לשם שפר"));
    assert.ok(company); assert.ok(company.identifiers.some((item) => item.kind === "registration_number" && item.value === "514131291"));
    assert.equal(company.identifiers.some((item) => item.value === "99887766"), false);
    assert.ok(output.graph.entities.some((item) => item.kind === "person" && item.label === "Ram Matan"));
    for (const relationship of ["uses_domain", "legal_entity_candidate", "company_registration_id_candidate", "officer_role_candidate"]) {
      const edge = output.graph.evidence.find((item) => item.relationship === relationship); assert.ok(edge, relationship); assert.ok(edge.source.sourceFamily); assert.ok(edge.source.observedAt);
    }
    const unrelated = output.graph.entities.find((item) => item.kind === "company" && item.label.includes("Sharon Services LLC"));
    assert.ok(unrelated, "same-name unrelated company remains a separate candidate");
    assert.ok(unrelated.identifiers.some((item) => item.value === "99887766"));
    assert.equal(output.graph.decision.outcome, "investigate");
    assert.equal(output.graph.decision.verifiedEvidenceCount, 0);
    assert.match(output.graph.decision.coverageGaps.join(" "), /Israeli company-registry coverage is not configured/);
    assert.ok(output.graph.evidence.filter((item) => item.source.sourceName.includes("search result")).every((item) => item.lifecycle === "lead"));
    assert.ok(output.graph.evidence.filter((item) => ["legal_entity_candidate", "company_registration_id_candidate"].includes(item.relationship)).every((item) => item.evidenceType === "other"));
  } finally { globalThis.fetch = originalFetch; }
});

test("an ambiguous registration number remains unbound when a result names two companies", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ web: { results: [{ title: "Alpha Holdings LLC and Beta Trading LLC", url: "https://directory.example/record", description: "Company number 12345678" }] } });
  try {
    const output = await investigateLive({ kind: "domain", value: "example.com" }, { providers: [new BraveBusinessWebInvestigationProvider({ BRAVE_SEARCH_API_KEY: "test" })], now: () => NOW, maxDepth: 0 });
    const companies = output.graph.entities.filter((item) => item.kind === "company");
    assert.equal(companies.length, 2);
    assert.ok(companies.every((item) => item.identifiers.every((identifier) => identifier.value !== "12345678")));
    const claim = output.graph.evidence.find((item) => item.relationship === "company_registration_id_candidate" && item.value === "12345678");
    assert.ok(claim);
    assert.equal(claim.fromEntityId, output.graph.entities.find((item) => item.kind === "domain")?.entityId);
    assert.equal(claim.evidenceType, "other");
    assert.equal(claim.lifecycle, "lead");
  } finally { globalThis.fetch = originalFetch; }
});

test("first-party and government search results do not self-confirm a business", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ web: { results: benchmarkResults.slice(0, 2) } });
  try {
    const output = await investigateLive({ kind: "domain", value: "shl.co.il" }, { providers: [new BraveBusinessWebInvestigationProvider({ BRAVE_SEARCH_API_KEY: "test" })], now: () => NOW, maxDepth: 0 });
    assert.equal(output.graph.decision.verifiedEvidenceCount, 0);
    assert.equal(output.graph.decision.independentSourceFamilyCount, 0);
    assert.equal(output.graph.decision.outcome, "investigate");
    assert.ok(output.graph.evidence.some((item) => item.source.sourceFamily === "first-party:shl.co.il"));
    assert.ok(output.graph.evidence.some((item) => item.source.sourceFamily.startsWith("israeli-government:")));
    assert.ok(output.graph.evidence.every((item) => item.lifecycle === "lead"));
  } finally { globalThis.fetch = originalFetch; }
});

test("candidate IDs hash the complete normalized company name", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ web: { results: [{ title: "Company directory", url: "https://directory.example/companies", description: "International Business Machines Alpha LLC | International Business Machines Beta LLC" }] } });
  try {
    const output = await investigateLive({ kind: "domain", value: "example.com" }, { providers: [new BraveBusinessWebInvestigationProvider({ BRAVE_SEARCH_API_KEY: "test" })], now: () => NOW, maxDepth: 0 });
    const companies = output.graph.entities.filter((item) => item.kind === "company");
    assert.ok(companies.some((item) => item.label.includes("Alpha LLC")));
    assert.ok(companies.some((item) => item.label.includes("Beta LLC")));
    assert.equal(new Set(companies.map((item) => item.entityId)).size, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test("an officer role never falls back to an earlier unrelated company", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ web: { results: [
    { title: "Unrelated Holdings LLC", url: "https://directory.example/unrelated", description: "Unrelated Holdings LLC" },
    { title: "Jane Doe - CEO at OtherCo", url: "https://directory.example/jane" },
  ] } });
  try {
    const output = await investigateLive({ kind: "domain", value: "example.com" }, { providers: [new BraveBusinessWebInvestigationProvider({ BRAVE_SEARCH_API_KEY: "test" })], now: () => NOW, maxDepth: 0 });
    const role = output.graph.evidence.find((item) => item.relationship === "officer_role_candidate");
    const otherCo = output.graph.entities.find((item) => item.kind === "company" && item.label === "OtherCo");
    const unrelated = output.graph.entities.find((item) => item.kind === "company" && item.label.includes("Unrelated Holdings"));
    assert.ok(role && otherCo && unrelated);
    assert.equal(role.fromEntityId, otherCo.entityId);
    assert.notEqual(role.fromEntityId, unrelated.entityId);
  } finally { globalThis.fetch = originalFetch; }
});

test("identical claims from separate collection results retain distinct provenance", async () => {
  const originalFetch = globalThis.fetch;
  let call = 0;
  globalThis.fetch = async () => Response.json({ web: { results: [{ title: "Acme LLC", url: `https://source${++call}.example/acme`, description: "Acme LLC" }] } });
  try {
    const provider = new BraveBusinessWebInvestigationProvider({ BRAVE_SEARCH_API_KEY: "test" });
    const context = { now: NOW, depth: 1, signal: new AbortController().signal };
    const first = await provider.collect({ kind: "company", value: "Acme" }, context);
    const second = await provider.collect({ kind: "company", value: "Acme" }, context);
    const firstClaim = first.evidence.find((item) => item.relationship === "legal_entity_candidate");
    const secondClaim = second.evidence.find((item) => item.relationship === "legal_entity_candidate");
    assert.ok(firstClaim && secondClaim);
    assert.notEqual(firstClaim.evidenceId, secondClaim.evidenceId);
    assert.equal(firstClaim.source.sourceUrl, "https://source1.example/acme");
    assert.equal(secondClaim.source.sourceUrl, "https://source2.example/acme");
  } finally { globalThis.fetch = originalFetch; }
});

test("business emails and addresses become attributable lead contacts", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ web: { results: [{ title: "Acme LLC", url: "https://acme.example/contact", description: "Contact office@acme.example, business address: 10 Market Street" }] } });
  try {
    const output = await investigateLive({ kind: "domain", value: "acme.example" }, { providers: [new BraveBusinessWebInvestigationProvider({ BRAVE_SEARCH_API_KEY: "test" })], now: () => NOW, maxDepth: 0 });
    const company = output.graph.entities.find((item) => item.kind === "company" && item.label.includes("Acme LLC"));
    assert.ok(company);
    assert.ok(output.graph.entities.some((item) => item.kind === "email" && item.label === "office@acme.example"));
    assert.ok(output.graph.entities.some((item) => item.kind === "address" && item.label === "10 Market Street"));
    for (const relationship of ["business_email_candidate", "business_address_candidate"]) {
      const edge = output.graph.evidence.find((item) => item.relationship === relationship);
      assert.ok(edge);
      assert.equal(edge.fromEntityId, company.entityId);
      assert.equal(edge.lifecycle, "lead");
      assert.equal(edge.evidenceType, "contact");
    }
    assert.equal(output.graph.decision.verifiedEvidenceCount, 0);
  } finally { globalThis.fetch = originalFetch; }
});
