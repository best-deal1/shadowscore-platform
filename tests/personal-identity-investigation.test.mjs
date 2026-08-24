import test from "node:test";
import assert from "node:assert/strict";
import { buildPersonalIdentityQueries, rankExternalIdentityCandidates } from "../lib/providers/externalIdentityProvider.ts";
import { createPersonalIdentitySignals, hasIdentityField, personalIdentityGaps } from "../lib/personalIdentity.ts";
import { groupExecutiveEvidence, materialEvidenceGaps } from "../lib/executiveReport.ts";

const lead = (overrides = {}) => ({ platform: "Instagram", profileUrl: "https://instagram.com/unrelated.profile", observedDisplayName: "Unrelated Profile", matchedIdentifiers: [], matchType: "username", status: "Candidate", matchLevel: "unverified_candidate", matchBasis: "Discovery lead", confidence: 0, evidenceUrl: "https://search.brave.com/search?q=test", evidenceQuery: "test", evidenceSnippet: "Unrelated Profile", methods: ["search"], sourceProvider: "Brave Search", evidenceReference: "https://search.brave.com/search?q=test", discoveryPath: ["test", "Instagram"], supportingEvidence: [{ query: "test", snippet: "Unrelated Profile", url: "https://search.brave.com/search?q=test", hop: 0 }], candidateDiscoveryConfidence: 19, identityAttributionConfidence: null, ...overrides });

test("email-only, phone-only, and combined identity signals remain optional individually", () => {
  assert.equal(hasIdentityField(createPersonalIdentitySignals({ email: "person@gmail.com" })), true);
  assert.equal(hasIdentityField(createPersonalIdentitySignals({ phone: "+1 202 555 0114" })), true);
  assert.equal(hasIdentityField(createPersonalIdentitySignals({ name: "Ada Person", phone: "+1 202 555 0114" })), true);
  assert.equal(hasIdentityField(createPersonalIdentitySignals({})), false);
});

test("bounded discovery creates relevant signal combinations", () => {
  const queries = buildPersonalIdentityQueries(createPersonalIdentitySignals({ email: "ada.person@gmail.com", phone: "+1 202 555 0114", name: "Ada Person", username: "ada_person" }));
  assert.ok(queries.some((query) => query.includes('"Ada Person" "+1 202 555 0114"')));
  assert.ok(queries.some((query) => query.includes('"Ada Person" "ada_person"')));
  assert.ok(queries.some((query) => query.includes('"ada.person" "Ada Person"')));
  assert.ok(queries.some((query) => query.includes("site:instagram.com")));
  assert.ok(queries.length <= 12);
});

test("19% discovery relevance contributes 0% identity evidence without a match", () => {
  const [candidate] = rankExternalIdentityCandidates(createPersonalIdentitySignals({ email: "person@gmail.com", username: "person_known" }), [lead()]);
  assert.equal(candidate.candidateDiscoveryConfidence, 19);
  assert.equal(candidate.resolutionEvidenceScore, 0);
  assert.equal(candidate.identityAttributionConfidence, null);
  assert.ok(["NO_MATCH", "ABSTAIN"].includes(candidate.resolverOutcome));
});

test("an exact submitted identifier can increase resolver-backed identity evidence", () => {
  const email = "person@gmail.com";
  const [candidate] = rankExternalIdentityCandidates(createPersonalIdentitySignals({ email }), [lead({ matchedIdentifiers: [email], evidenceSnippet: `Contact ${email}` })]);
  assert.ok(candidate.resolutionEvidenceScore > 0);
  assert.ok(candidate.identityAttributionConfidence > 0);
  assert.deepEqual(candidate.exactMatchingSignals, [email]);
});

test("a generic name fragment never becomes positive identity evidence", () => {
  const [candidate] = rankExternalIdentityCandidates(createPersonalIdentitySignals({ name: "John Smith" }), [lead({ observedDisplayName: "John", matchedIdentifiers: ["John"] })]);
  assert.equal(candidate.resolutionEvidenceScore, 0);
  assert.equal(candidate.identityAttributionConfidence, null);
});

test("personal reports suppress website and business infrastructure evidence and gaps", () => {
  const report = { reportSummary: { investigationType: "PERSONAL_IDENTITY", personalIdentityGaps: ["Phone corroboration was not supplied or observed."], businessIntelligence: { findings: [{ id: "dns", category: "Infrastructure", title: "DNS", statement: "DNS missing", direction: "needs_review", evidence: [{ id: "dns-1", field: "DNS", label: "WHOIS SSL DNS website", value: "missing", source: "whois", observedAt: "2026-08-24T00:00:00Z" }] }] } } };
  assert.deepEqual(groupExecutiveEvidence(report), []);
  assert.doesNotMatch(JSON.stringify(materialEvidenceGaps(report)), /DNS|WHOIS|SSL|website|ownership/i);
});

test("business reports retain infrastructure evidence", () => {
  const report = { reportSummary: { investigationType: "WEBSITE", businessIntelligence: { findings: [{ id: "dns", category: "Infrastructure", title: "DNS", statement: "DNS observed", direction: "supports_credibility", evidence: [{ id: "dns-1", field: "DNS", label: "DNS record", value: "observed", source: "dns", observedAt: "2026-08-24T00:00:00Z" }] }] } } };
  assert.equal(groupExecutiveEvidence(report)[0].category, "DNS");
});

test("reference image is provenance-labeled and comparison remains unavailable", () => {
  const signals = createPersonalIdentitySignals({ username: "known_user", referenceImage: { fileName: "reference.jpg", mediaType: "image/jpeg", size: 2048 } });
  assert.equal(signals.referenceImage.provenance, "user_submitted_reference_image");
  assert.equal(signals.referenceImage.comparisonStatus, "not_operational");
  assert.match(personalIdentityGaps(signals, 0).join(" "), /image comparison is not operational/i);
});
