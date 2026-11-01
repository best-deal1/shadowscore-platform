import assert from "node:assert/strict";
import test from "node:test";
import { extractSourceReportedIdentityFacts, publicEmailObservations, publicPhoneObservations, sourceReportedNamesDisagree, summarizeSourceReportedFacts } from "../lib/identityPublicFacts.ts";

const email = "dana.example421@gmail.com";
const input = { title: "Dana Example | LinkedIn", observedName: "Dana Example", anchors: [email], sourceUrl: "https://linkedin.com/in/dana-example", sourceFamily: "linkedin.com" };

test("source employment facts require an observed name and an independently present submitted anchor", () => {
  const result = extractSourceReportedIdentityFacts({ ...input, description: `Dana Example. Product manager at Example Labs. Contact ${email}.` });
  assert.equal(result.ambiguousSubject, false);
  assert.deepEqual(result.facts.map(({ attribute, value }) => [attribute, value]), [["name", "Dana Example"], ["role", "Product manager"], ["organization", "Example Labs"]]);
  assert.ok(result.facts.every((fact) => fact.subjectName === "Dana Example" && fact.sourceUrl === input.sourceUrl && fact.excerpt));
  assert.deepEqual(extractSourceReportedIdentityFacts({ ...input, description: "Product manager at Example Labs." }).facts, []);
  assert.deepEqual(extractSourceReportedIdentityFacts({ ...input, observedName: undefined, description: email }).facts, []);
  assert.deepEqual(extractSourceReportedIdentityFacts({ ...input, title: "Example Labs", observedName: "Example Labs", description: `Product manager at Other Company. ${email}` }).facts, []);
});

test("qualified employment and labelled subject blocks retain the correct owner", () => {
  const qualified = extractSourceReportedIdentityFacts({ ...input, description: `Dana Example, Product manager at Example Labs. ${email}` });
  assert.deepEqual(qualified.facts.filter((fact) => fact.attribute === "role").map((fact) => fact.value), ["Product manager"]);
  const title = extractSourceReportedIdentityFacts({ ...input, title: "Dana Example - Product manager at Example Labs", description: email });
  assert.ok(title.facts.some((fact) => fact.attribute === "organization" && fact.value === "Example Labs"));
  const blocks = extractSourceReportedIdentityFacts({ ...input, description: `Name: Casey Other; Role: Chief engineer; Company: Other Labs; Email: casey@other.invalid. Name: Dana Example; Role: Product manager; Company: Example Labs; Email: ${email}` });
  assert.equal(blocks.ambiguousSubject, false);
  assert.ok(blocks.facts.some((fact) => fact.value === "Example Labs"));
  assert.equal(JSON.stringify(blocks.facts).includes("Other Labs"), false);
});

test("multi-person excerpts with uncertain attribution suppress profile facts", () => {
  for (const description of [
    `Dana Example. Casey Other, Chief engineer at Other Labs. Contact ${email}.`,
    `Dana Example. Casey Other. Product manager at Other Labs. ${email}`,
    `Name: Casey Other; Role: Chief engineer; Company: Other Labs; Email: ${email}`,
    `Name: Casey Other; Company: Other Labs; Email: ${email}. Name: Dana Example; Company: Example Labs; Email: other@example.invalid`,
  ]) {
    const result = extractSourceReportedIdentityFacts({ ...input, description });
    assert.equal(result.ambiguousSubject, true, description);
    assert.deepEqual(result.facts, []);
  }
});

test("source names are compared with each other, allowing bounded middle-name variants", () => {
  const facts = (names) => names.map((value) => ({ attribute: "name", value, subjectName: value, sourceUrl: input.sourceUrl, sourceFamily: input.sourceFamily, excerpt: value }));
  assert.equal(sourceReportedNamesDisagree(facts(["Dana Example", "Dana Lee Example"])), false);
  assert.equal(sourceReportedNamesDisagree(facts(["Dana Example", "Casey Other"])), true);
  assert.equal(sourceReportedNamesDisagree(facts(["Dana Example", "Dana Another Example", "Dana Lee Example"])), true);
});

test("explicit public (at) notation is recognized without interpreting ordinary prose as email", () => {
  // Public professional speaking contact, https://addyosmani.com/talks/, checked 2026-11-01.
  const excerpt = "For inquiries about speaking engagements, I am addyosmani(at)gmail.com";
  assert.deepEqual(publicEmailObservations(excerpt), [{ value: "addyosmani@gmail.com", method: "explicit_at_dot" }]);
  assert.deepEqual(publicEmailObservations("dana[at]gmail[dot]com"), [{ value: "dana@gmail.com", method: "explicit_at_dot" }]);
  assert.deepEqual(publicEmailObservations(`Contact ${email}.`), [{ value: email, method: "literal" }]);
  assert.deepEqual(publicEmailObservations("Dana at Example dot com"), []);
  assert.equal(publicEmailObservations("addyosmani(at)gmail.com.evil").some((item) => item.value === "addyosmani@gmail.com"), false);
});

test("dates and unformatted identifiers are not reported as phone numbers", () => {
  assert.deepEqual(publicPhoneObservations("Record 123456789012. Updated 2026-10-30. Reference 2026-10-30123."), []);
  assert.deepEqual(publicPhoneObservations("Phone: 0501234567"), ["0501234567"]);
  assert.deepEqual(publicPhoneObservations("Call +1 (212) 555-0123"), ["+1 (212) 555-0123"]);
  assert.deepEqual(publicPhoneObservations("Contact 052-1234567"), ["052-1234567"]);
});

test("each reported fact counts independent source families rather than pages", () => {
  const fact = { attribute: "role", value: "Product manager", subjectName: "Dana Example", sourceUrl: input.sourceUrl, sourceFamily: input.sourceFamily, excerpt: "Product manager at Example Labs" };
  const summary = summarizeSourceReportedFacts([fact, { ...fact, sourceUrl: `${fact.sourceUrl}/about` }, { ...fact, sourceUrl: "https://example.org/dana", sourceFamily: "example.org" }]);
  assert.equal(summary.length, 1);
  assert.equal(summary[0].sources.length, 3);
  assert.equal(summary[0].sourceFamilyCount, 2);
});
