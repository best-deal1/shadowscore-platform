import assert from "node:assert/strict";
import test from "node:test";
import { rankIdentityCandidates } from "../lib/identity/candidateRanking.ts";

function candidate(overrides = {}) {
  return { platform: "GitHub", profileUrl: "https://github.com/alice-rowan", observedDisplayName: "Alice Rowan", matchedIdentifiers: [], matchType: "alias", status: "Candidate", matchLevel: "unverified_candidate", matchBasis: "Public search lead", confidence: 0, evidenceUrl: "https://search.brave.com/search?q=alice", evidenceQuery: '"alice"', evidenceSnippet: "Alice Rowan public profile", methods: ["public_search"], sourceProvider: "Brave Search", evidenceReference: "https://search.brave.com/search?q=alice", discoveryPath: ["Alice Rowan", "GitHub"], supportingEvidence: [{ query: '"alice"', snippet: "Alice Rowan public profile", url: "https://github.com/alice-rowan", hop: 0 }], candidateDiscoveryConfidence: 60, identityAttributionConfidence: null, ...overrides };
}

test("candidate ranking reuses weighted entity resolution and preserves unverified attribution", () => {
  const exact = candidate({ profileUrl: "https://github.com/alice", matchedIdentifiers: ["alice@example.com"], supportingEvidence: [{ query: '"alice@example.com"', snippet: "Contact alice@example.com", url: "https://github.com/alice", hop: 0 }] });
  const weak = candidate({ profileUrl: "https://github.com/unrelated", observedDisplayName: "Unrelated Person", candidateDiscoveryConfidence: 75 });
  const ranked = rankIdentityCandidates({ email: "alice@example.com", name: "Alice Rowan" }, [weak, exact]);
  assert.equal(ranked[0].profileUrl, exact.profileUrl);
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[0].verificationStatus, "unverified");
  assert.ok(ranked[0].matchingSignals.some((signal) => signal.signal === "email"));
  assert.match(ranked[0].suggestionExplanation, /comparison model found matching/i);
  assert.match(ranked[0].comparisonModel.resolverVersion, /entity-resolver/);
  assert.ok(ranked[0].evidenceSources.includes("https://github.com/alice"));
});

test("different accessible identifiers are exposed as contradictions without claiming certainty", () => {
  const ranked = rankIdentityCandidates({ email: "alice@example.com", phone: "+1 202 555 0101" }, [candidate({ supportingEvidence: [{ query: "alice", snippet: "Contact bob@example.net or +1 202 555 0199", url: "https://github.com/alice-rowan", hop: 0 }] })]);
  assert.equal(ranked[0].verificationStatus, "unverified");
  assert.ok(ranked[0].contradictions.some((signal) => signal.signal === "email"));
  assert.ok(ranked[0].contradictions.some((signal) => signal.signal === "phone"));
});

test("ranking is deterministic when evidence scores tie", () => {
  const ranked = rankIdentityCandidates({ username: "alice" }, [candidate({ profileUrl: "https://x.com/z" }), candidate({ profileUrl: "https://x.com/a" })]);
  assert.deepEqual(ranked.map((item) => item.profileUrl), ["https://x.com/a", "https://x.com/z"]);
});
