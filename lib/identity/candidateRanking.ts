import { createObservation, resolveEntities } from "../entityIntelligence/resolver";
import type { Entity, Observation, ObservationAttribute, ResolutionFeature } from "../entityIntelligence/types";
import type { ExternalIdentityCandidate } from "../providers/externalIdentityProvider";

export type InvestigationIdentityInputs = { email?: string; phone?: string; name?: string; username?: string; referenceLabels?: string[] };
export type RankedIdentityCandidate = ExternalIdentityCandidate & {
  rank: number; combinedEvidenceScore: number; verificationStatus: "verified" | "unverified";
  matchingSignals: Array<{ signal: string; subjectValue: string; candidateValue: string; similarity: number; evidenceSources: string[] }>;
  contradictions: Array<{ signal: string; subjectValue: string; candidateValue: string; evidenceSources: string[] }>;
  evidenceSources: string[]; suggestionExplanation: string;
  comparisonModel: { resolverVersion: string; policyVersion: string; outcome: string };
};

const emails = (value: string) => [...value.matchAll(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/giu)].map((item) => item[0]);
const phones = (value: string) => [...value.matchAll(/(?:\+?\d[\d ().-]{7,}\d)/g)].map((item) => item[0]);

function entity(id: string, input: { names?: string[]; emails?: string[]; phones?: string[] }): Entity {
  const names = [...new Set((input.names || []).map((value) => value.trim()).filter(Boolean))];
  return { entityId: id, workspaceId: "investigation", entityType: "person", canonicalName: names[0] || "Unknown", aliases: names.slice(1), domains: [], addresses: [], phoneNumbers: [...new Set(input.phones || [])], emailAddresses: [...new Set(input.emails || [])], registrationIdentifiers: [], peopleAndDirectors: [], relationships: [], status: "unknown", jurisdiction: null, observationIds: [] };
}

function observations(candidate: ExternalIdentityCandidate, candidateEntity: Entity): Observation[] {
  const source = candidate.evidenceReference || candidate.evidenceUrl;
  const values: Array<[ObservationAttribute, string]> = [
    ...[candidateEntity.canonicalName, ...candidateEntity.aliases].filter((value) => value !== "Unknown").map((value): [ObservationAttribute, string] => ["name", value]),
    ...candidateEntity.emailAddresses.map((value): [ObservationAttribute, string] => ["email", value]),
    ...candidateEntity.phoneNumbers.map((value): [ObservationAttribute, string] => ["phone", value]),
  ];
  return values.map(([attribute, observedValue], index) => createObservation({ observationId: `${candidate.profileUrl}:${attribute}:${index}`, workspaceId: "investigation", source: candidate.sourceProvider, sourceRecordId: candidate.profileUrl, attribute, observedValue, observedAt: "1970-01-01T00:00:00.000Z", jurisdiction: null, evidenceReference: source, reliability: .55 }));
}

function signal(feature: ResolutionFeature) {
  return { signal: feature.attribute, subjectValue: feature.left, candidateValue: feature.right, similarity: Number(feature.similarity.toFixed(2)), evidenceSources: feature.evidenceReferences };
}

/** Adapts discovery candidates to the existing weighted entity resolver. Discovery and attribution remain separate. */
export function rankIdentityCandidates(inputs: InvestigationIdentityInputs, candidates: ExternalIdentityCandidate[]): RankedIdentityCandidate[] {
  const subject = entity("investigation-subject", { names: [inputs.name, inputs.username].filter((value): value is string => Boolean(value?.trim())), emails: inputs.email ? [inputs.email] : [], phones: inputs.phone ? [inputs.phone] : [] });
  const ranked = candidates.map((candidate) => {
    const evidenceText = candidate.supportingEvidence.map((item) => `${item.snippet} ${item.url}`).join(" ");
    const urlHandle = (() => { try { return new URL(candidate.profileUrl).pathname.split("/").filter(Boolean).at(-1) || ""; } catch { return ""; } })();
    const candidateEntity = entity(`candidate:${candidate.profileUrl}`, { names: [candidate.observedDisplayName, urlHandle].filter((value): value is string => Boolean(value)), emails: [...candidate.matchedIdentifiers.filter((value) => value.includes("@")), ...emails(evidenceText)], phones: phones(evidenceText) });
    const decision = resolveEntities(subject, candidateEntity, observations(candidate, candidateEntity), { now: "1970-01-01T00:00:00.000Z" });
    const matchingSignals = decision.matchedAttributes.map(signal);
    const modelContradictions = decision.conflictingAttributes.filter((item) => ["email", "phone", "name"].includes(item.attribute)).map(signal);
    const explicitContradictions = [
      ...(inputs.email && candidateEntity.emailAddresses.length && !candidateEntity.emailAddresses.some((value) => value.toLowerCase() === inputs.email!.toLowerCase()) ? [{ signal: "email", subjectValue: inputs.email, candidateValue: candidateEntity.emailAddresses.join(", "), evidenceSources: [candidate.evidenceReference] }] : []),
      ...(inputs.phone && candidateEntity.phoneNumbers.length && !candidateEntity.phoneNumbers.some((value) => value.replace(/\D/g, "") === inputs.phone!.replace(/\D/g, "")) ? [{ signal: "phone", subjectValue: inputs.phone, candidateValue: candidateEntity.phoneNumbers.join(", "), evidenceSources: [candidate.evidenceReference] }] : []),
    ];
    const contradictions = [...modelContradictions, ...explicitContradictions].filter((item, index, all) => all.findIndex((other) => other.signal === item.signal && other.candidateValue === item.candidateValue) === index);
    const modelScore = decision.outcome === "ABSTAIN" ? 0 : decision.confidence * 100;
    const combinedEvidenceScore = Math.round(Math.min(100, modelScore * .7 + candidate.candidateDiscoveryConfidence * .3));
    const evidenceSources = [...new Set([candidate.evidenceReference, candidate.evidenceUrl, ...candidate.supportingEvidence.map((item) => item.url)].filter(Boolean))];
    const labels = matchingSignals.map((item) => item.signal.replace("_", " "));
    const suggestionExplanation = labels.length ? `Suggested because the comparison model found matching ${labels.join(", ")} signals. Review the cited evidence and contradictions before attribution.` : "Suggested from bounded public discovery. The comparison model found no strong identity match in the available signals.";
    return { ...candidate, rank: 0, combinedEvidenceScore, verificationStatus: candidate.status === "Verified" && candidate.identityAttributionConfidence !== null ? "verified" as const : "unverified" as const, matchingSignals, contradictions, evidenceSources, suggestionExplanation, comparisonModel: { resolverVersion: decision.resolverVersion, policyVersion: decision.policyVersion, outcome: decision.outcome } };
  });
  return ranked.sort((a, b) => b.combinedEvidenceScore - a.combinedEvidenceScore || b.candidateDiscoveryConfidence - a.candidateDiscoveryConfidence || a.profileUrl.localeCompare(b.profileUrl)).map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}
