import type { EntityCandidate, EntityIdentifier, EvidenceAssertion, InvestigationContradiction, InvestigationEngineInput, InvestigationGraph, InvestigationInputKind, ResolvedEntity, ResolutionStatus } from "./types";

export const INVESTIGATION_ENGINE_VERSION = "investigation-graph@1.0.0";
const STRONG_IDENTIFIERS = new Set<InvestigationInputKind>(["email", "phone", "registration_number", "domain", "marketplace_identity", "payment_identifier", "social_profile"]);
const CONFLICTING_RELATIONSHIPS = new Set(["address", "registered_address", "owner", "director", "company_age", "domain_owner", "seller_name"]);

function normalize(identifier: EntityIdentifier) {
  let value = identifier.value.trim().toLowerCase();
  if (identifier.kind === "domain") value = value.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  if (identifier.kind === "phone") value = value.replace(/[^\d+]/g, "");
  return `${identifier.kind}:${value}`;
}

function freshness(observedAt: string, now: Date) {
  const age = now.getTime() - new Date(observedAt).getTime();
  if (age > 730 * 86_400_000) return "stale" as const;
  if (age > 365 * 86_400_000) return "aging" as const;
  return "current" as const;
}

function status(confidence: number, conflicting = false): ResolutionStatus {
  if (conflicting) return "conflicting";
  if (confidence >= 85) return "confirmed";
  if (confidence >= 65) return "probable";
  if (confidence >= 40) return "possible";
  return "unresolved";
}

function validate(input: InvestigationEngineInput) {
  if (!input.seed.value.trim()) throw new Error("Investigation seed value is required.");
  const candidateIds = new Set<string>();
  for (const candidate of input.candidates) {
    if (!candidate.candidateId || candidateIds.has(candidate.candidateId)) throw new Error(`Candidate IDs must be unique: ${candidate.candidateId || "<empty>"}.`);
    candidateIds.add(candidate.candidateId);
  }
  for (const item of input.evidence) {
    if (!item.evidenceId.trim() || !item.relationship.trim() || !item.source.sourceId.trim() || !item.source.retrievedAt) throw new Error("Every evidence assertion requires an ID, relationship, source, and retrieval time.");
    if (!candidateIds.has(item.subjectCandidateId) || (item.objectCandidateId && !candidateIds.has(item.objectCandidateId))) throw new Error(`Evidence ${item.evidenceId} refers to an unknown candidate.`);
    if (item.confidence < 0 || item.confidence > 100 || item.source.reliability < 0 || item.source.reliability > 100) throw new Error(`Evidence ${item.evidenceId} confidence and source reliability must be between 0 and 100.`);
    if (!Number.isFinite(new Date(item.source.observedAt).getTime())) throw new Error(`Evidence ${item.evidenceId} has an invalid observation timestamp.`);
    for (const parentId of item.derivedFromEvidenceIds || []) if (!input.evidence.some((candidate) => candidate.evidenceId === parentId)) throw new Error(`Evidence ${item.evidenceId} derives from unknown evidence ${parentId}.`);
  }
}

function family(item: EvidenceAssertion) { return item.source.sourceFamily || item.source.sourceId; }
function isSubjectEvidence(item: EvidenceAssertion) { return item.lifecycle === "corroborated" || item.lifecycle === "verified"; }

function resolveEntities(candidates: EntityCandidate[], evidence: EvidenceAssertion[]) {
  const parent = new Map(candidates.map((candidate) => [candidate.candidateId, candidate.candidateId]));
  const find = (id: string): string => parent.get(id) === id ? id : find(parent.get(id)!);
  const join = (left: string, right: string) => parent.set(find(right), find(left));
  const owners = new Map<string, EntityCandidate>();

  for (const candidate of candidates) {
    for (const identifier of candidate.identifiers.filter((item) => STRONG_IDENTIFIERS.has(item.kind as InvestigationInputKind))) {
      const key = normalize(identifier);
      const owner = owners.get(key);
      if (owner && owner.kind === candidate.kind) join(owner.candidateId, candidate.candidateId);
      else owners.set(key, candidate);
    }
  }

  const grouped = new Map<string, EntityCandidate[]>();
  for (const candidate of candidates) grouped.set(find(candidate.candidateId), [...(grouped.get(find(candidate.candidateId)) || []), candidate]);
  const entities: ResolvedEntity[] = [...grouped.values()].map((group) => {
    const evidenceIds = [...new Set(group.flatMap((item) => item.evidenceIds))];
    const sourceCount = new Set(evidence.filter((item) => evidenceIds.includes(item.evidenceId) && isSubjectEvidence(item)).map(family)).size;
    const strongMatches = group.flatMap((item) => item.identifiers).filter((item) => STRONG_IDENTIFIERS.has(item.kind as InvestigationInputKind)).length;
    const score = Math.min(98, 35 + sourceCount * 15 + strongMatches * 10 + (group.length > 1 ? 15 : 0));
    return { entityId: `entity:${group.map((item) => item.candidateId).sort()[0]}`, kind: group[0].kind, label: group[0].label, aliases: [...new Set(group.map((item) => item.label))], candidateIds: group.map((item) => item.candidateId), identifiers: [...new Map(group.flatMap((item) => item.identifiers).map((item) => [normalize(item), item])).values()], resolution: status(score), confidence: score, evidenceIds };
  });
  return { entities, entityByCandidate: new Map(entities.flatMap((entity) => entity.candidateIds.map((id) => [id, entity]))) };
}

function detectContradictions(evidence: EvidenceAssertion[], entityByCandidate: Map<string, ResolvedEntity>) {
  const contradictions: InvestigationContradiction[] = [];
  const groups = new Map<string, EvidenceAssertion[]>();
  for (const item of evidence.filter((entry) => isSubjectEvidence(entry) && CONFLICTING_RELATIONSHIPS.has(entry.relationship))) {
    const entity = entityByCandidate.get(item.subjectCandidateId)!;
    const key = `${entity.entityId}:${item.relationship}`;
    groups.set(key, [...(groups.get(key) || []), item]);
  }
  for (const [key, items] of groups) {
    const values = new Set(items.map((item) => item.value.trim().toLowerCase()));
    const sources = new Set(items.map(family));
    if (values.size > 1 && sources.size > 1) {
      const entityId = key.slice(0, key.lastIndexOf(":"));
      contradictions.push({ contradictionId: `contradiction:${items.map((item) => item.evidenceId).sort().join(":")}`, type: items[0].relationship === "seller_name" ? "identity_change" : "conflicting_value", title: `Conflicting ${items[0].relationship.replace(/_/g, " ")}`, explanation: `${sources.size} independent sources report ${values.size} different values.`, severity: items[0].relationship === "owner" || items[0].relationship === "domain_owner" ? "high" : "medium", entityIds: [entityId], evidenceIds: items.map((item) => item.evidenceId) });
    }
  }
  const identifierOwners = new Map<string, Set<string>>();
  const verifiedIds = new Set(evidence.filter(isSubjectEvidence).map((item) => item.evidenceId));
  for (const entity of new Set(entityByCandidate.values())) for (const identifier of entity.identifiers.filter((item) => entity.evidenceIds.some((id) => verifiedIds.has(id)) && ["email", "phone", "domain"].includes(item.kind))) {
    const key = normalize(identifier);
    identifierOwners.set(key, new Set([...(identifierOwners.get(key) || []), entity.entityId]));
  }
  for (const [identifier, entityIds] of identifierOwners) if (entityIds.size > 1) contradictions.push({ contradictionId: `contradiction:reuse:${identifier}`, type: "identifier_reuse", title: "Identifier reused across entities", explanation: `${identifier.split(":")[0]} evidence connects multiple entities that were not automatically merged.`, severity: "high", entityIds: [...entityIds], evidenceIds: [...entityIds].flatMap((id) => [...new Set(entityByCandidate.values())].find((entity) => entity.entityId === id)?.evidenceIds || []) });
  return contradictions;
}

export function buildInvestigationGraph(input: InvestigationEngineInput): InvestigationGraph {
  validate(input);
  const now = new Date(input.now || new Date().toISOString());
  const { entities, entityByCandidate } = resolveEntities(input.candidates, input.evidence);
  const contradictions = detectContradictions(input.evidence, entityByCandidate);
  const evidence = input.evidence.map((item) => {
    const from = entityByCandidate.get(item.subjectCandidateId)!;
    const sourceAdjusted = Math.round((item.confidence * 0.7) + (item.source.reliability * 0.3));
    const age = freshness(item.source.observedAt, now);
    const adjusted = Math.max(0, sourceAdjusted - (age === "stale" ? 20 : age === "aging" ? 8 : 0));
    const contradictionIds = contradictions.filter((entry) => entry.evidenceIds.includes(item.evidenceId)).map((entry) => entry.contradictionId);
    return { edgeId: `edge:${item.evidenceId}`, fromEntityId: from.entityId, toEntityId: item.objectCandidateId ? entityByCandidate.get(item.objectCandidateId)?.entityId : undefined, relationship: item.relationship, value: item.value, confidence: adjusted, status: status(adjusted, contradictionIds.length > 0), contradictionIds, source: item.source, evidenceId: item.evidenceId, freshness: age };
  });
  const marketplaceEntities = entities.filter((entity) => entity.kind === "marketplace_account");
  const marketplaceEvidence = evidence.filter((item) => input.evidence.find((source) => source.evidenceId === item.evidenceId)?.evidenceType === "marketplace" || marketplaceEntities.some((entity) => entity.entityId === item.fromEntityId || entity.entityId === item.toEntityId));
  const verifiedEvidence = input.evidence.filter(isSubjectEvidence);
  const independentFamilies = new Set(verifiedEvidence.map(family));
  const critical = contradictions.some((item) => item.severity === "critical");
  const high = contradictions.some((item) => item.severity === "high");
  const verifiedEdges = evidence.filter((edge) => verifiedEvidence.some((item) => item.evidenceId === edge.evidenceId));
  const average = verifiedEdges.length ? Math.round(verifiedEdges.reduce((sum, item) => sum + item.confidence, 0) / verifiedEdges.length) : 0;
  const coverageGaps = verifiedEvidence.length ? [] : ["No corroborated or verified subject evidence was collected."];
  const decisionBase = verifiedEvidence.length === 0
    ? { outcome: "investigate" as const, confidence: 0, summary: "The investigation has insufficient verified subject evidence for a transaction decision.", nextActions: ["Collect corroborated subject evidence from an independent source."] }
    : critical ? { outcome: "stop" as const, confidence: average, summary: "Critical verified contradictions require the transaction to stop pending resolution.", nextActions: ["Resolve the critical evidence conflicts with primary-source records."] }
    : high ? { outcome: "investigate" as const, confidence: average, summary: "Material verified identity conflicts require further investigation.", nextActions: ["Verify reused identifiers and ownership against independent primary sources."] }
    : average >= 75 && independentFamilies.size >= 2 ? { outcome: "proceed" as const, confidence: average, summary: "Independent evidence supports the resolved entity and its relationships.", nextActions: ["Retain the evidence trail with the customer decision."] }
    : { outcome: "proceed_with_conditions" as const, confidence: average, summary: "Verified evidence is limited to one source family or has incomplete coverage.", nextActions: ["Collect another independent source for unresolved relationships."] };
  const decision = { ...decisionBase, verifiedEvidenceCount: verifiedEvidence.length, independentSourceFamilyCount: independentFamilies.size, coverageGaps };
  input.logger?.info("investigation_graph_built", { seedKind: input.seed.kind, entities: entities.length, marketplaceEntities: marketplaceEntities.length, contradictions: contradictions.length, decision: decision.outcome });
  if (contradictions.length) input.logger?.warn("investigation_graph_contradictions", { count: contradictions.length, ids: contradictions.map((item) => item.contradictionId) });
  return { engineVersion: INVESTIGATION_ENGINE_VERSION, generatedAt: now.toISOString(), seed: input.seed, entities, evidence, contradictions, marketplace: { entityIds: marketplaceEntities.map((item) => item.entityId), evidenceIds: marketplaceEvidence.map((item) => item.evidenceId), connectedEntityIds: [...new Set(marketplaceEvidence.flatMap((item) => [item.fromEntityId, item.toEntityId]).filter((id): id is string => Boolean(id) && !marketplaceEntities.some((entity) => entity.entityId === id)))] }, decision };
}
