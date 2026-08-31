import test from "node:test";
import assert from "node:assert/strict";
import { BraveBusinessWebInvestigationProvider, extractBusinessWebClaims, investigateLive } from "../lib/investigationCollection/index.ts";

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
