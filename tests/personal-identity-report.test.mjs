import assert from "node:assert/strict";
import test from "node:test";
import { emailReportFixture, fixtureEmail, fixtureSource, fixtureSnippet } from "./helpers/email-report-fixture.mjs";
import { renderPersonalReport } from "./helpers/render-personal-report.mjs";
import { discoverExternalIdentityGraph } from "../lib/providers/externalIdentityProvider.ts";

test("email-only customer report preserves execution counts after internal traces are removed", async () => {
  const { customer, queries } = await emailReportFixture();
  assert.equal(customer.reportSummary.discoveryDiagnostics, undefined);
  assert.deepEqual(customer.reportSummary.identitySignals.emails, [fixtureEmail]);
  assert.equal(customer.reportSummary.discoveryExecution.searchesCompleted, queries.length);
  assert.ok(queries.length > 0);
  assert.equal(customer.reportSummary.discoveryExecution.providerStatus, "completed");
  assert.equal(JSON.stringify(customer.reportSummary.discoveryExecution).includes("query"), false);
});

test("email-only customer report shows the observed person, evidence excerpt, and discovery path", async () => {
  const { customer } = await emailReportFixture();
  const html = await renderPersonalReport(customer);
  assert.ok(html.includes("Dana Example"));
  assert.ok(html.includes(fixtureSnippet));
  assert.ok(html.includes("Discovery path"));
  assert.ok(html.includes(fixtureSource));
  assert.ok(html.includes("Unverified Candidate"));
  assert.equal(html.includes("Verified Candidate"), false);
  assert.ok(html.includes("Public candidates returned"));
  assert.equal(html.includes("No evidence, result withheld"), false);
  assert.equal(customer.reportSummary.publicIdentityCandidates[0].matchType, "exact_email");
  assert.ok(customer.reportSummary.publicIdentityCandidates[0].matchBasis.includes("exact submitted email"));
});

test("a later search failure preserves earlier email evidence and marks incomplete coverage", async () => {
  const { stored, customer, queries } = await emailReportFixture({ scenario: "partial" });
  assert.equal(queries.length, 2);
  assert.ok(customer.reportSummary.publicIdentityCandidates.some((candidate) => candidate.profileUrl === fixtureSource));
  assert.equal(customer.reportSummary.completionStatus, "COVERAGE_GAP");
  assert.equal(customer.reportSummary.discoveryExecution.providerStatus, "partial");
  assert.equal(customer.reportSummary.discoveryExecution.searchesCompleted, 1);
  assert.equal(customer.reportSummary.discoveryExecution.searchesAttempted, 2);
  assert.equal(customer.reportSummary.discoveryExecution.stopReason, "rate_limited");
  assert.ok(stored.reportSummary.discoveryDiagnostics.providerFailure);
  assert.equal(customer.reportSummary.discoveryDiagnostics, undefined);
});

test("no match and unavailable coverage remain distinct in the customer report", async () => {
  const empty = await emailReportFixture({ scenario: "empty" });
  assert.equal(empty.customer.reportSummary.publicIdentityCandidates.length, 0);
  assert.equal(empty.customer.reportSummary.discoveryExecution.providerStatus, "completed");
  assert.ok(empty.customer.reportSummary.discoveryExecution.searchesCompleted > 0);
  const unavailable = await emailReportFixture({ scenario: "unavailable" });
  assert.equal(unavailable.queries.length, 0);
  assert.equal(unavailable.customer.reportSummary.completionStatus, "PROVIDER_UNAVAILABLE");
  assert.equal(unavailable.customer.reportSummary.discoveryExecution.providerStatus, "unavailable");
  assert.equal(unavailable.customer.reportSummary.discoveryExecution.searchesCompleted, 0);
});

test("a source-stated dotted social handle is followed from email without verifying the alias", async () => {
  const { customer, queries } = await emailReportFixture({ scenario: "multi_hop" });
  assert.ok(queries.some((query) => query.includes('"dana.river"')));
  assert.ok(queries.length <= 12);
  const candidate = customer.reportSummary.publicIdentityCandidates.find((entry) => entry.profileUrl === "https://instagram.com/dana.river");
  assert.ok(candidate, "The explicit handle should remain reachable within the existing search budget.");
  assert.notEqual(candidate.resolutionOutcome, "MATCH");
  assert.ok(customer.reportSummary.publicIdentityCandidates.every((entry) => (entry.resolverConflictingSignals || []).every((signal) => signal.attribute !== "name")));
  assert.equal(queries.some((query) => query.includes('"dana example421 gmail com"')), false);
  assert.ok(candidate.discoveryPath[0].includes(fixtureEmail));
  assert.ok(candidate.discoveryPath.some((step) => step.includes("dana.river")));
  const html = await renderPersonalReport(customer);
  assert.ok(html.includes("https://instagram.com/dana.river"));
  assert.equal(html.includes("Verified Candidate"), false);
  assert.equal(html.includes("name: submitted dana example421 gmail com"), false);
});

test("timeouts retain collected candidates and an initial failure remains unavailable", async () => {
  const partial = await emailReportFixture({ scenario: "timeout" });
  assert.ok(partial.customer.reportSummary.publicIdentityCandidates.length > 0);
  assert.equal(partial.customer.reportSummary.completionStatus, "COVERAGE_GAP");
  assert.equal(partial.customer.reportSummary.discoveryExecution.stopReason, "timeout");
  const failure = await emailReportFixture({ scenario: "first_failure" });
  assert.equal(failure.customer.reportSummary.discoveryExecution.providerStatus, "unavailable");
  assert.equal(failure.customer.reportSummary.discoveryExecution.searchesCompleted, 0);
  assert.equal(failure.customer.reportSummary.discoveryExecution.searchesAttempted, 1);
  assert.equal(failure.customer.reportSummary.completionStatus, "COVERAGE_GAP");
});

test("legacy reports without execution facts show unknown counts instead of zero", async () => {
  const { customer } = await emailReportFixture();
  delete customer.reportSummary.discoveryExecution;
  const html = await renderPersonalReport(customer);
  assert.match(html, /Searches completed<\/dt><dd[^>]*>Not recorded<\/dd>/);
});

test("email sentence punctuation is accepted while longer email tokens cannot match the submitted mailbox", async () => {
  for (const [observed, expected] of [
    [`${fixtureEmail}.`, true], [`(${fixtureEmail}),`, true],
    [`other.${fixtureEmail}`, false], [`${fixtureEmail}.evil`, false], [`${fixtureEmail}.au`, false],
    [`${fixtureEmail}42`, false], [`${fixtureEmail}-extra`, false], [`${fixtureEmail}.evil123`, false], [`${fixtureEmail}@other.example`, false],
  ]) {
    const graph = await discoverExternalIdentityGraph(fixtureEmail, "fixture-key", new AbortController().signal, {
      limits: { maxSearches: 1 },
      search: async () => [{ title: "Dana Example | LinkedIn", url: fixtureSource, description: `Contact ${observed}` }],
    });
    assert.equal(graph.candidates.some((candidate) => candidate.matchType === "exact_email"), expected, observed);
    assert.ok(graph.candidates.every((candidate) => candidate.status !== "Verified"));
  }
});
