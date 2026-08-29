import { BaseProvider } from "./BaseProvider";
import type { ProviderEvidence, ProviderExecutionContext, ProviderFailureReason, ProviderResult } from "./types";
import { isPublicMailboxDomain } from "../emailDomains";
import { createObservation, rankResolutionCandidates, resolveEntities } from "../entityIntelligence/resolver";
import type { Entity, Observation, ObservationAttribute, ResolutionDecision } from "../entityIntelligence/types";

const SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const SOCIAL_HOSTS: Record<string, string> = { "facebook.com": "Facebook", "instagram.com": "Instagram", "linkedin.com": "LinkedIn", "x.com": "X", "twitter.com": "X", "tiktok.com": "TikTok", "github.com": "GitHub", "youtube.com": "YouTube" };

export type IdentityDiscoveryLimits = { maxHops: number; maxIdentifiers: number; maxSearches: number; maxResultsPerSearch: number; maxVisibleCandidates: number; reservedExpansionSearches: number };
export const DEFAULT_IDENTITY_DISCOVERY_LIMITS: IdentityDiscoveryLimits = { maxHops: 3, maxIdentifiers: 12, maxSearches: 12, maxResultsPerSearch: 10, maxVisibleCandidates: 8, reservedExpansionSearches: 4 };
export type EntityClueType = "person_name" | "username" | "social_profile" | "email" | "phone" | "domain" | "company_name" | "location" | "role_title" | "unknown";
export type SearchIntent = "social_profile_discovery" | "open_web_identity" | "corroboration" | "graph_neighbor_expansion";
export type SourceClass = "social_profile" | "editorial" | "company_site" | "registry" | "directory" | "other_open_web";
export type EntityClue = {
  id: string; type: EntityClueType; normalizedValue: string; displayValue: string; source: string;
  discoveryPath: string[]; hop: number; derivation: "submitted" | "derived_email_stem" | DiscoveryPivot["derivation"] | "director" | "domain" | "company";
  evidenceStrength: "lead" | "observed" | "strong"; attributionState: "discovery" | "corroborated" | "verified";
  adjacentClueIds: string[]; observedBy: string[];
  qualityScore: number; searchPriority: number; enqueueDecision: "enqueued" | "rejected";
  rejectionReason?: string; queriesPlanned: string[]; queriesExecuted: string[]; queriesSkipped: string[];
  pivotStrength: number; pivotAdmissionDecision: "admitted" | "lead_only" | "rejected";
  pivotAdmissionReason: string; distanceFromRoot: number; independentAnchorCount: number;
  sourceFamily?: string; parentSubmittedIdentifier?: string;
  lifecycleState?: "admitted" | "rejected"; admissionState?: "discovery_only" | "evidence_eligible";
};
export type EntityConvergence = { clueId: string; convergingPaths: string[][]; sharedIdentifiers: string[]; loopStrength: number; sourceClasses: SourceClass[] };
export type IdentityDiscoveryEdge = {
  from: string; to: string; relation: "search_result" | "discovery_lead" | "uses_handle_candidate" | "corroborated_identifier" | "verified_identifier"; hop: number;
  evidence: { query: string; url: string; snippet: string; provider: "Brave Search"; sourceClass?: SourceClass; searchIntent?: SearchIntent; derivation?: DiscoveryPivot["derivation"] };
};
export type ExternalIdentityCandidate = {
  platform: string; profileUrl: string; observedDisplayName?: string; matchedIdentifiers: string[];
  matchType: "exact_email" | "username" | "alias"; status: "Candidate" | "Corroborated" | "Verified";
  matchLevel: "exact_match" | "unverified_candidate"; matchBasis: string; confidence: number;
  evidenceUrl: string; evidenceQuery: string; evidenceSnippet: string; methods: string[];
  sourceProvider: "Brave Search"; evidenceReference: string; discoveryPath: string[];
  supportingEvidence: Array<{ query: string; snippet: string; url: string; sourceUrl?: string; hop: number }>;
  discoveryScore?: number;
  candidateDiscoveryConfidence: number; identityAttributionConfidence: number | null;
  resolutionRank?: number; resolutionEvidenceScore?: number;
  resolutionOutcome?: ResolutionDecision["outcome"];
  resolverMatchedSignals?: Array<{ attribute: string; submitted: string; observed: string; similarity: number }>;
  resolverConflictingSignals?: Array<{ attribute: string; submitted: string; observed: string; similarity: number }>;
  observedEmails?: string[]; observedPhoneNumbers?: string[];
  sourceProvenance?: Array<{ url: string; family: string; query: string }>;
  independentSourceFamilyCount?: number;
  discoveryOnlyAlias?: boolean;
  convergingPaths?: string[][]; sharedIdentifiers?: string[]; loopStrength?: number;
};

export type PersonalIdentitySignals = { email: string; name?: string; username?: string; phone?: string };

const resolverEntity = (entityId: string): Entity => ({ entityId, workspaceId: "external-identity", entityType: "person", canonicalName: "", aliases: [], domains: [], addresses: [], phoneNumbers: [], emailAddresses: [], registrationIdentifiers: [], peopleAndDirectors: [], relationships: [], status: "unknown", jurisdiction: null, observationIds: [] });

function observedIdentityAttribute(value: string): ObservationAttribute {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
  if (/^\+?[\d\s().-]{7,}$/.test(value)) return "phone";
  return "name";
}

/** Convert discovery output into the resolver model without promoting discovery relevance to identity evidence. */
export function rankExternalIdentityCandidates(input: string | PersonalIdentitySignals, candidates: ExternalIdentityCandidate[]): ExternalIdentityCandidate[] {
  const signals: PersonalIdentitySignals = typeof input === "string" ? { email: input } : input;
  const email = signals.email.trim().toLowerCase();
  const subject = resolverEntity("investigated-subject");
  const observations: Observation[] = [];
  const observe = (entity: Entity, attribute: ObservationAttribute, value: string, evidenceReference: string, reliability: number) => {
    const observedValue = value.trim();
    if (!observedValue) return;
    if (attribute === "email") entity.emailAddresses.push(observedValue);
    else if (attribute === "phone") entity.phoneNumbers.push(observedValue);
    else entity.aliases.push(observedValue);
    const observationId = `resolver-observation-${observations.length + 1}`;
    entity.observationIds.push(observationId);
    observations.push(createObservation({ observationId, workspaceId: entity.workspaceId, source: "Brave Search", sourceRecordId: entity.entityId, attribute, observedValue, observedAt: "1970-01-01T00:00:00.000Z", jurisdiction: null, evidenceReference, reliability }));
  };
  observe(subject, "email", email, "submitted-target", 0);
  if (signals.name) observe(subject, "name", signals.name, "submitted-target", 0);
  // Email local-parts and usernames remain discovery identifiers. The resolver
  // has no username attribute, so typing either as a submitted name would
  // manufacture name matches and contradictions.
  if (signals.phone) observe(subject, "phone", signals.phone, "submitted-target", 0);
  const entities = candidates.map((candidate) => {
    const entity = resolverEntity(candidate.profileUrl);
    const handle = socialUrlHandle(candidate.profileUrl);
    if (handle) observe(entity, "name", handle, candidate.evidenceReference, .7);
    if (candidate.observedDisplayName && !candidate.discoveryOnlyAlias) observe(entity, "name", candidate.observedDisplayName, candidate.evidenceReference, .7);
    for (const identifier of candidate.matchedIdentifiers) observe(entity, observedIdentityAttribute(identifier), identifier, candidate.evidenceReference, .85);
    for (const observedEmail of candidate.observedEmails || []) observe(entity, "email", observedEmail, candidate.evidenceReference, .85);
    for (const observedPhone of candidate.observedPhoneNumbers || []) observe(entity, "phone", observedPhone, candidate.evidenceReference, .8);
    return entity;
  });
  const decisions = entities.map((entity) => resolveEntities(subject, entity, observations, { now: "1970-01-01T00:00:00.000Z" }));
  const ranked = rankResolutionCandidates(subject.entityId, decisions);
  const resolverRank = new Map(ranked.map((item) => [item.entityId, item]));
  return candidates.map((candidate, index) => {
    const decision = decisions[index];
    return { ...candidate, resolutionRank: resolverRank.get(entities[index].entityId)?.rank, resolutionEvidenceScore: resolverRank.get(entities[index].entityId)?.combinedEvidenceScore,
      resolutionOutcome: decision.outcome,
      resolverMatchedSignals: decision.matchedAttributes.map((item) => ({ attribute: item.attribute, submitted: item.left, observed: item.right, similarity: item.similarity })),
      resolverConflictingSignals: decision.conflictingAttributes.map((item) => ({ attribute: item.attribute, submitted: item.left, observed: item.right, similarity: item.similarity })),
    };
  })
    .sort((a, b) => (a.resolutionRank || Number.MAX_SAFE_INTEGER) - (b.resolutionRank || Number.MAX_SAFE_INTEGER) || a.profileUrl.localeCompare(b.profileUrl))
    .map((candidate, index) => ({ ...candidate, resolutionRank: index + 1 }));
}
export type IdentityDiscoverySearchDiagnostic = {
  query: string; hop: number; pivot: string; schedulingGeneration: number; queryPass: number; originalTargetContext: { email: string; localPart: string; domain: string };
  resultCount: number; producedNewIdentifiers: boolean; newIdentifiers: string[];
  clueType: EntityClueType; clueQualityScore: number; searchPriority: number;
  remainingBudget: number; informationGain: number;
  searchIntent: SearchIntent; sourceClasses: SourceClass[]; extractedEntityClues: string[]; prioritizationReason: string;
  pivotStrength: number; pivotAdmissionDecision: "admitted" | "lead_only" | "rejected";
  pivotAdmissionReason: string; distanceFromRoot: number; independentAnchorCount: number;
  results: ResultAdmissionDiagnostic[];
};
export type ResultAdmissionDiagnostic = {
  url: string; title: string; description: string; admissionScore: number; admissionDecision: "admitted" | "rejected";
  admissionReason: string; matchedAnchors: string[]; extractedClues: string[];
  discoveryAdmissionScore: number; discoveryAdmissionDecision: "DISCOVERY_ADMITTED" | "REJECTED";
  evidenceAdmissionScore: number; evidenceAdmissionDecision: "EVIDENCE_ADMITTED" | "REJECTED";
  discoveryAdmissionReason: string; evidenceAdmissionReason: string; queryProvenanceContribution: number;
  extractedDiscoveryClues: string[]; extractedEvidenceClues: string[];
  branchPriority: number; siblingRank: number; remainingBudget: number;
  canonicalDisplayName?: string; canonicalHandle?: string; previewIdentitySignals: PreviewIdentitySignal[];
  identityInformationValue: number; beamRank: number;
  beamDecision: "ADMITTED" | "OUTSIDE_BEAM" | "NOT_ELIGIBLE"; beamDecisionReason: string;
  identifierEvaluations: Array<{ identifier: string; type: EntityClueType; derivation: DiscoveryPivot["derivation"]; decision: "extracted" | "rejected"; reason: string }>;
};
export type IdentitySchedulingDiagnostic = {
  pivot: string; clueType: EntityClueType; hop: number; query?: string; schedulingGeneration?: number; queryPass?: number;
  decision: "created" | "admitted" | "scheduled" | "skipped"; reason: "seed_plan" | "pivot_admitted" | "evidence_continuation_created" | "evidence_continuation_deduplicated" | "deduplicated" | "identifier_budget" | "beam_deferred" | "search_budget" | "closure";
  remainingSearchBudget: number;
};
export type PreviewIdentitySignal = { type: "person_name" | "alias" | "handle" | "company_name" | "domain" | "director"; value: string };
type SearchResult = { title: string; url: string; description?: string };
type SearchFn = (query: string, apiKey: string, signal: AbortSignal, limit: number) => Promise<SearchResult[]>;
export type EntityInvestigationSeed = { type: EntityClueType; value: string };
export type EntityRelationship = { from: string; to: string; relationship: "resolved_as" | "director" | "domain" | "related_entity"; discoveryPath: string[] };

function evidenceAdmissionForResult(result: SearchResult, active: EntityClue, original: string, neighbors: string[]) {
  const text = `${result.title} ${result.description || ""} ${result.url}`;
  const anchors: Array<{ label: string; score: number }> = [];
  if (containsIdentifier(text, original)) anchors.push({ label: "original_target", score: 100 });
  const originalLocalPart = original.includes("@") ? original.split("@")[0] : undefined;
  if (originalLocalPart && containsIdentifier(text, originalLocalPart)) anchors.push({ label: "original_local_part", score: 65 });
  const activeMatch = containsIdentifier(text, active.displayValue);
  // A submitted clue is a subject identifier. A discovered clue is only the
  // search pivot, so seeing it again cannot independently establish identity.
  if (active.derivation === "submitted" && activeMatch) anchors.push({ label: "active_clue", score: active.type === "person_name" || active.type === "company_name" ? 75 : 65 });
  const matchedNeighbors = [...new Set(neighbors.filter((neighbor) => normalizeIdentifier(neighbor) !== active.normalizedValue && containsIdentifier(text, neighbor)))];
  matchedNeighbors.forEach((neighbor) => anchors.push({ label: `graph_neighbor:${neighbor}`, score: 30 }));
  if (matchedNeighbors.length >= 2) anchors.push({ label: "multiple_graph_neighbors", score: 35 });
  const urlHandle = socialUrlHandle(result.url);
  const canonicalPivotMatch = Boolean(urlHandle && normalizeIdentifier(urlHandle) === active.normalizedValue);
  const score = Math.min(100, anchors.reduce((sum, anchor) => sum + anchor.score, 0));
  return { score, admitted: score >= 60, anchors: anchors.map((anchor) => anchor.label), pivotConfirmation: activeMatch || canonicalPivotMatch, reason: score >= 60 ? `Subject relevance established by ${anchors.map((anchor) => anchor.label).join(", ")}.` : activeMatch || canonicalPivotMatch ? "The result confirms the search pivot, but contains no independent subject-linking identifier." : "No strong subject identifier or sufficient graph-neighbor evidence appears in the result." };
}

function discoveryAdmissionForResult(result: SearchResult, evidence: ReturnType<typeof evidenceAdmissionForResult>, context: { hop: number; intent: SearchIntent; query: string }) {
  if (evidence.admitted) return { score: 100, admitted: true, provenance: 0, reason: "Result has subject-local evidence and is suitable for discovery." };
  const profile = platformFor(result.url); const handle = socialUrlHandle(result.url); const aliases = titleAliases(result.title);
  const text = `${result.title} ${result.description || ""}`;
  const explicitIdentityLabel = /\b(?:person|director|company|organisation|organization|employer|handle|username|alias|known as)\s*:/iu.test(text);
  const explicitlyUnrelated = /\bunrelated\b/iu.test(text);
  const queryEmail = context.query.match(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/iu)?.[0].toLowerCase();
  const conflictingEmail = [...text.matchAll(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/giu)].some((match) => !queryEmail || match[0].toLowerCase() !== queryEmail);
  const titleConsistency = Boolean(handle && (containsIdentifier(result.title, handle) || aliases.length));
  const seedIntent = context.hop === 0 && (context.intent === "social_profile_discovery" || context.intent === "open_web_identity");
  const querySpecificity = seedIntent && /(?:site:|"[^\"]{3,}")/i.test(context.query) ? 15 : 0;
  let structural = 0;
  if (profile && handle) structural += 42;
  if (aliases.length) structural += aliases.some(plausiblePersonName) ? 28 : 18;
  if (/@[\p{L}\p{N}][\p{L}\p{N}_.-]{2,39}\b/u.test(text)) structural += 20;
  if (explicitIdentityLabel) structural += 28;
  if (explicitIdentityLabel && ["directory", "company_site", "registry"].includes(sourceClassFor(result.url))) structural += 20;
  if (titleConsistency) structural += 12;
  if (sourceClassFor(result.url) === "registry") structural += 20;
  const provenance = seedIntent && structural >= 40 ? querySpecificity : 0;
  // Reproducing the pivot is useful for discovery even though it contributes
  // zero attribution evidence. Keep that distinction explicit in diagnostics.
  const score = Math.min(100, Math.max(structural + provenance, evidence.pivotConfirmation ? 75 : 0));
  const admitted = (seedIntent || evidence.pivotConfirmation) && score >= 60 && !explicitlyUnrelated && !conflictingEmail;
  return { score, admitted, provenance, reason: admitted ? `Structurally strong discovery lead admitted for investigation${provenance ? " with a bounded targeted-query prior" : ""}.` : "Result lacks subject evidence and sufficient structured identity signals for discovery." };
}

function admissionDiagnostic(result: SearchResult, active: EntityClue, original: string, neighbors: string[], context: { hop: number; intent: SearchIntent; query: string }, branchPriority: number, siblingRank: number, remainingBudget: number): ResultAdmissionDiagnostic {
  const evidence = evidenceAdmissionForResult(result, active, original, neighbors);
  const discovery = discoveryAdmissionForResult(result, evidence, context);
  const identity = extractPreviewIdentitySignals(result);
  return { url: result.url, title: result.title, description: result.description || "", admissionScore: evidence.score, admissionDecision: evidence.admitted ? "admitted" : "rejected", admissionReason: evidence.reason, matchedAnchors: evidence.anchors, extractedClues: [], discoveryAdmissionScore: discovery.score, discoveryAdmissionDecision: discovery.admitted ? "DISCOVERY_ADMITTED" : "REJECTED", evidenceAdmissionScore: evidence.score, evidenceAdmissionDecision: evidence.admitted ? "EVIDENCE_ADMITTED" : "REJECTED", discoveryAdmissionReason: discovery.reason, evidenceAdmissionReason: evidence.reason, queryProvenanceContribution: discovery.provenance, extractedDiscoveryClues: [], extractedEvidenceClues: [], branchPriority, siblingRank, remainingBudget, ...identity, beamRank: 0, beamDecision: discovery.admitted ? "ADMITTED" : "NOT_ELIGIBLE", beamDecisionReason: discovery.admitted ? "Admitted without discovery beam competition." : "Result was not eligible for the discovery beam.", identifierEvaluations: [] };
}

/** Generic bounded loop used for non-email entity investigations and provider adapters. */
export async function investigateEntityClues(seed: EntityInvestigationSeed, search: (query: string, clue: EntityClue) => Promise<SearchResult[]>, limits: Pick<IdentityDiscoveryLimits, "maxHops" | "maxIdentifiers" | "maxSearches"> = DEFAULT_IDENTITY_DISCOVERY_LIMITS) {
  const seedValue = seed.value.trim(); const seedId = `${seed.type}:${normalizeIdentifier(seedValue)}`;
  const clues = new Map<string, EntityClue>(); const relationships: EntityRelationship[] = []; const diagnostics: Array<Omit<IdentityDiscoverySearchDiagnostic, "originalTargetContext">> = [];
  const queue: EntityClue[] = [{ id: seedId, type: seed.type, normalizedValue: normalizeIdentifier(seedValue), displayValue: seedValue, source: "submitted-target", discoveryPath: [seedValue], hop: 0, derivation: "submitted", evidenceStrength: "strong", attributionState: "verified", adjacentClueIds: [], observedBy: ["submitted-target"], ...schedulingFields({ type: seed.type, value: seedValue, derivation: "submitted" }) }];
  clues.set(seedId, queue[0]); let searchCount = 0;
  const patterns: Array<{ type: EntityClueType; relationship: EntityRelationship["relationship"]; derivation: EntityClue["derivation"]; expression: RegExp }> = [
    { type: "company_name", relationship: "resolved_as", derivation: "company", expression: /(?:legal company|company)\s*:\s*([^|;.!?]+?)(?=[.!?](?:\s+\p{Lu}|\s*$)|[|;]|$)/giu },
    { type: "person_name", relationship: "director", derivation: "director", expression: /(?:director|person)\s*:\s*([^|;.!?]+?)(?=[.!?](?:\s+\p{Lu}|\s*$)|[|;]|$)/giu },
    { type: "domain", relationship: "domain", derivation: "domain", expression: /(?:domain|website)\s*:\s*((?:[\p{L}\p{N}-]+\.)+[\p{L}\p{N}-]+)/giu },
    { type: "company_name", relationship: "related_entity", derivation: "company", expression: /related (?:company|entity)\s*:\s*([^|;.!?]+?)(?=[.!?](?:\s+\p{Lu}|\s*$)|[|;]|$)/giu },
  ];
  while (queue.length && searchCount < limits.maxSearches && clues.size < limits.maxIdentifiers) {
    queue.sort((a, b) => b.searchPriority - a.searchPriority || a.hop - b.hop);
    const clue = queue.shift()!; if (clue.hop >= limits.maxHops) continue;
    const neighbors = clue.adjacentClueIds.map((id) => clues.get(id)?.displayValue).filter(Boolean) as string[];
    const query = [clue.displayValue, ...neighbors.slice(0, 2)].map((value) => `"${value.replace(/["\\]/g, " ")}"`).join(" ");
    clue.queriesPlanned.push(query); clue.queriesExecuted.push(query);
    const results = await search(query, clue); searchCount += 1; const produced: string[] = [];
    const resultDiagnostics: ResultAdmissionDiagnostic[] = [];
    const assessedResults = results.map((result, siblingIndex) => ({ result, siblingIndex, diagnostic: admissionDiagnostic(result, clue, seedValue, neighbors, { hop: clue.hop, intent: "open_web_identity", query }, clue.searchPriority, siblingIndex + 1, limits.maxSearches - searchCount) }));
    const discoveryBeam = applyDiscoveryBeam(assessedResults, (item) => item.siblingIndex);
    for (const { result, siblingIndex, diagnostic: resultDiagnostic } of assessedResults) {
      if (resultDiagnostic.discoveryAdmissionDecision === "DISCOVERY_ADMITTED" && resultDiagnostic.evidenceAdmissionDecision === "REJECTED" && !discoveryBeam.has(siblingIndex)) {
        resultDiagnostic.discoveryAdmissionDecision = "REJECTED";
        resultDiagnostic.discoveryAdmissionReason = "Structurally relevant lead fell outside the bounded top-three seed discovery beam.";
      }
      resultDiagnostics.push(resultDiagnostic);
      if (resultDiagnostic.discoveryAdmissionDecision === "REJECTED") {
        resultDiagnostic.previewIdentitySignals.forEach((signal) => resultDiagnostic.identifierEvaluations.push({ identifier: signal.value, type: signal.type === "handle" || signal.type === "alias" ? "username" : signal.type === "director" ? "person_name" : signal.type, derivation: signal.type === "handle" ? "explicit_handle" : "display_name", decision: "rejected", reason: `result_rejected: ${resultDiagnostic.discoveryAdmissionReason}` }));
        continue;
      }
      const text = `${result.title} | ${result.description || ""}`;
      for (const pattern of patterns) for (const match of text.matchAll(new RegExp(pattern.expression.source, pattern.expression.flags))) {
        const value = match[1].trim(); const id = `${pattern.type}:${normalizeIdentifier(value)}`; const path = [...clue.discoveryPath, value];
        relationships.push({ from: clue.id, to: id, relationship: pattern.relationship, discoveryPath: path });
        const prior = clues.get(id);
        if (prior) { prior.observedBy = [...new Set([...prior.observedBy, `${query}|${result.url}`])]; prior.adjacentClueIds = [...new Set([...prior.adjacentClueIds, clue.id])]; continue; }
        const next: EntityClue = { id, type: pattern.type, normalizedValue: normalizeIdentifier(value), displayValue: value, source: result.url, discoveryPath: path, hop: clue.hop + 1, derivation: pattern.derivation, evidenceStrength: "observed", attributionState: "discovery", adjacentClueIds: [clue.id, ...clue.adjacentClueIds], observedBy: [`${query}|${result.url}`], ...schedulingFields({ type: pattern.type, value, derivation: pattern.derivation, adjacency: clue.adjacentClueIds.length + 1, distanceFromRoot: clue.hop + 1, independentAnchorCount: resultDiagnostic.evidenceAdmissionDecision === "EVIDENCE_ADMITTED" ? 1 : 0, strongAnchor: resultDiagnostic.evidenceAdmissionDecision === "EVIDENCE_ADMITTED" }) };
        clues.set(id, next); produced.push(value); resultDiagnostic.extractedClues.push(value); resultDiagnostic.extractedDiscoveryClues.push(value); if (resultDiagnostic.evidenceAdmissionDecision === "EVIDENCE_ADMITTED") resultDiagnostic.extractedEvidenceClues.push(value); if (next.hop < limits.maxHops && next.enqueueDecision === "enqueued") queue.push(next);
      }
    }
    diagnostics.push({ query, hop: clue.hop, pivot: clue.displayValue, schedulingGeneration: -1, queryPass: 0, resultCount: results.length, producedNewIdentifiers: produced.length > 0, newIdentifiers: produced, clueType: clue.type, clueQualityScore: clue.qualityScore, searchPriority: clue.searchPriority, remainingBudget: limits.maxSearches - searchCount, informationGain: produced.length, searchIntent: "graph_neighbor_expansion", sourceClasses: [...new Set(results.map((result) => sourceClassFor(result.url)))], extractedEntityClues: produced, prioritizationReason: "Highest-quality typed clue with adjacent graph context.", pivotStrength: clue.pivotStrength, pivotAdmissionDecision: clue.pivotAdmissionDecision, pivotAdmissionReason: clue.pivotAdmissionReason, distanceFromRoot: clue.distanceFromRoot, independentAnchorCount: clue.independentAnchorCount, results: resultDiagnostics });
  }
  const convergences = [...clues.values()].filter((clue) => clue.observedBy.length > 1).map((clue) => ({ clueId: clue.id, convergingPaths: relationships.filter((edge) => edge.to === clue.id).map((edge) => edge.discoveryPath), sharedIdentifiers: [clue.normalizedValue], loopStrength: Math.min(100, clue.observedBy.length * 20), sourceClasses: [...new Set(clue.observedBy.map((observation) => sourceClassFor(observation.split("|").at(-1) || "")))] }));
  const anyAdmissible = diagnostics.some((entry) => entry.results.some((result) => result.discoveryAdmissionDecision === "DISCOVERY_ADMITTED"));
  const budgetExhaustionReason = searchCount >= limits.maxSearches && queue.length ? "max_searches" : clues.size >= limits.maxIdentifiers && queue.length ? "max_identifiers" : !anyAdmissible && diagnostics.some((entry) => entry.resultCount > 0) ? "no_admissible_leads" : "closure_reached";
  return { clues: [...clues.values()], relationships, convergences, diagnostics, metrics: { searchCount, identifierCount: clues.size, budgetExhaustionReason } };
}

function emailFromContext(context: ProviderExecutionContext) { const values = [context.requestedTarget, context.target, context.email].filter(Boolean) as string[]; return values.map((value) => value.trim().toLowerCase()).find((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)); }
function containsExactEmailToken(text: string, email: string) { const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return new RegExp(`(^|[^A-Z0-9._%+\\-])${escaped}($|[^A-Z0-9._%+\\-])`, "i").test(text); }
function platformFor(url: string) { try {
  const parsed = new URL(url); const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (!/^https?:$/.test(parsed.protocol) || /\/(?:login|signin|signup|search|discover|explore|directory|tag|hashtag)(?:\/|$)/i.test(parsed.pathname) || !parsed.pathname.replace(/\/+$/, "")) return undefined;
  return Object.entries(SOCIAL_HOSTS).find(([domain]) => host === domain || host.endsWith(`.${domain}`))?.[1] || (/\/(?:profile|people|member|team|author)\b/i.test(parsed.pathname) ? "Public profile" : undefined);
} catch { return undefined; } }
function canonicalUrl(url: string) { try { const parsed = new URL(url); parsed.hash = ""; for (const key of [...parsed.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(key)) parsed.searchParams.delete(key); return parsed.toString().replace(/\/$/, ""); } catch { return url; } }
function sourceClassFor(url: string): SourceClass { try {
  const parsed = new URL(url); const host = parsed.hostname.toLowerCase();
  if (Object.keys(SOCIAL_HOSTS).some((domain) => host === domain || host.endsWith(`.${domain}`))) return "social_profile";
  if (/(?:registry|companieshouse|sec\.gov)/i.test(host)) return "registry";
  if (/(?:directory|people|profiles)/i.test(host) || /\/(?:directory|people|profile)\b/i.test(parsed.pathname)) return "directory";
  if (/\/(?:news|article|story|interview|author|blog)\b/i.test(parsed.pathname)) return "editorial";
  if (/\b(?:about|team|company|contact)\b/i.test(parsed.pathname)) return "company_site";
  return "other_open_web";
} catch { return "other_open_web"; } }
function publicSearchEvidenceUrl(query: string) { const url = new URL("https://search.brave.com/search"); url.searchParams.set("q", query); return url.toString(); }
function normalizeIdentifier(value: string) { return value.trim().replace(/^@/, "").replace(/\s+/g, " ").toLowerCase(); }
const NOISE_IDENTIFIERS = new Set([
  "a", "about", "account", "accounts", "an", "and", "are", "author", "bunch", "by", "candidate", "click", "color", "contact", "coolness", "directory", "discover", "explore", "facebook", "for", "for you", "from", "github", "has", "have", "home", "in", "instagram", "is", "learn", "like", "linkedin", "login", "member", "more", "official", "on", "open", "or", "page", "people", "photo", "photos", "profile", "public", "public profile", "search", "short", "signin", "signup", "social", "the", "this", "tiktok", "to", "twitter", "user", "username", "video", "videos", "watch", "with", "x", "youtube",
]);
function rejectionReason(value: string) {
  const normalized = normalizeIdentifier(value);
  if (!normalized || normalized.length < 3) return "too_short";
  if (normalized.length > 60) return "too_long";
  if (NOISE_IDENTIFIERS.has(normalized)) return "generic_lexical_noise";
  if (/^#|^\d+[km]?$/i.test(normalized)) return "hashtag_or_counter";
  if (/^[^\p{L}\p{N}]+$/u.test(normalized)) return "non_identifier";
  return undefined;
}
function usefulIdentifier(value: string, original: Set<string>) {
  const normalized = normalizeIdentifier(value);
  return !rejectionReason(value) && !original.has(normalized)
    && !/^(?:www\.)?[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+(?:\/.*)?$/iu.test(normalized)
    && !/^https?:|^[^\p{L}\p{N}]+$/iu.test(normalized)
    && !/^(?:(?:facebook|instagram|linkedin|tiktok|twitter|github|youtube)\s+)?(?:public\s+)?profile(?:\s+[a-z])?$|^unrelated(?:\s+(?:user|account|profile))?$/i.test(normalized)
    && !/^(?:log\s*in|sign\s*(?:in|up)|search results?|click here|learn more)$/i.test(normalized);
}
function containsIdentifier(text: string, identifier: string) {
  const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}_.-])@?${escaped}($|[^\\p{L}\\p{N}_.-])`, "iu").test(text);
}
type DiscoveryPivot = { value: string; type?: EntityClueType; relation: "discovery_lead" | "corroborated_identifier"; derivation: "explicit_assertion" | "social_url" | "explicit_handle" | "display_name" | "title" | "page_entity" | "subject_name_expansion" | "derived_alias" };
function clueQuality(input: { type: EntityClueType; value: string; derivation: EntityClue["derivation"]; observations?: number; adjacency?: number; originalOverlap?: boolean }) {
  const typeScore: Record<EntityClueType, number> = { person_name: 82, social_profile: 84, username: 76, company_name: 84, domain: 80, email: 86, phone: 88, location: 68, role_title: 68, unknown: 45 };
  const derivationScore: Record<EntityClue["derivation"], number> = { submitted: 10, derived_email_stem: 2, explicit_assertion: 12, social_url: 10, explicit_handle: 10, display_name: 6, title: -22, page_entity: 8, subject_name_expansion: 16, derived_alias: 12, director: 12, domain: 12, company: 12 };
  const value = normalizeIdentifier(input.value); const rejection = rejectionReason(value);
  if (rejection) return { score: 0, priority: 0, decision: "rejected" as const, rejection };
  const specificity = /[_.-]|\d/.test(value) ? 5 : value.includes(" ") ? 7 : 2;
  const score = Math.max(0, Math.min(100, typeScore[input.type] + derivationScore[input.derivation] + specificity + Math.min(8, ((input.observations || 1) - 1) * 4) + Math.min(6, input.adjacency || 0) - (input.originalOverlap ? 8 : 0)));
  return { score, priority: Math.max(0, score - (input.originalOverlap ? 5 : 0)), decision: score >= 55 ? "enqueued" as const : "rejected" as const, rejection: score >= 55 ? undefined : "low_quality" };
}
function schedulingFields(input: { type: EntityClueType; value: string; derivation: EntityClue["derivation"]; observations?: number; adjacency?: number; originalOverlap?: boolean; distanceFromRoot?: number; independentAnchorCount?: number; strongAnchor?: boolean }) {
  const quality = clueQuality(input);
  const distanceFromRoot = input.distanceFromRoot || 0;
  const independentAnchorCount = input.independentAnchorCount || 0;
  const distancePenalty = Math.max(0, distanceFromRoot - independentAnchorCount) * 12;
  const pivotStrength = Math.max(0, Math.min(100, quality.score + independentAnchorCount * 18 + (input.strongAnchor ? 18 : 0) - distancePenalty));
  const personNeedsAnchor = input.type === "person_name" && input.derivation !== "submitted";
  const pivotAdmissionDecision = personNeedsAnchor && !input.strongAnchor && independentAnchorCount < 2 ? "lead_only" as const : quality.decision === "enqueued" ? "admitted" as const : "rejected" as const;
  const pivotAdmissionReason = pivotAdmissionDecision === "lead_only"
    ? "Person-name lead retained, but expansion requires a strong root anchor or two independent source families."
    : pivotAdmissionDecision === "admitted" ? "Pivot has sufficient identifier quality and corroboration for bounded expansion." : `Pivot rejected: ${quality.rejection || "low quality"}.`;
  const corroboration = { pivotStrength, pivotAdmissionDecision, pivotAdmissionReason, distanceFromRoot, independentAnchorCount };
  if (input.type === "location" || input.type === "role_title") {
    return { qualityScore: quality.score, searchPriority: 0, enqueueDecision: "rejected" as const, rejectionReason: "context_only", queriesPlanned: [] as string[], queriesExecuted: [] as string[], queriesSkipped: [] as string[], ...corroboration, pivotAdmissionDecision: "rejected" as const, pivotAdmissionReason: "Context-only clues cannot become expansion pivots." };
  }
  return { qualityScore: quality.score, searchPriority: pivotAdmissionDecision === "admitted" ? Math.max(0, quality.priority - distancePenalty) : 0, enqueueDecision: pivotAdmissionDecision === "admitted" ? quality.decision : "rejected" as const, rejectionReason: pivotAdmissionDecision === "lead_only" ? "insufficient_corroboration" : quality.rejection, queriesPlanned: [] as string[], queriesExecuted: [] as string[], queriesSkipped: [] as string[], ...corroboration };
}
function socialUrlHandle(url: string) { try {
  const parsed = new URL(url); const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (!Object.keys(SOCIAL_HOSTS).some((domain) => host === domain || host.endsWith(`.${domain}`))) return undefined;
  const parts = parsed.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (!parts.length) return undefined;
  const first = parts[0].replace(/^@/, "");
  if (/^(?:accounts?|login|signin|signup|search|discover|explore|directory|people|posts?|reels?|watch|hashtag|tag|share)$/i.test(first)) return undefined;
  if (host.endsWith("tiktok.com") && !parts[0].startsWith("@")) return undefined;
  if (host === "youtube.com" && /^(?:channel|c|user)$/i.test(first)) return parts[1]?.replace(/^@/, "");
  return first;
} catch { return undefined; } }
function identityProfileUrl(url: string) { try {
  const parsed = new URL(url); const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    const handle = socialUrlHandle(url); if (!handle) return undefined;
    return `https://${parsed.hostname}/@${handle}`;
  }
  return canonicalUrl(url);
} catch { return undefined; } }
function titleLead(title: string) {
  return title
    .replace(/[\s|·•/\-–:]+(?:Instagram\s+photos\s+and\s+videos|Posts\s*\/\s*X|TikTok\s+(?:profile|videos?)|Facebook\s+(?:profile|posts?)|LinkedIn\s+(?:profile|posts?))\s*$/giu, "")
    .replace(/[\s|·•/\-–:]+(?:\d[\d,.]*[KMB]?\s*)?(?:followers?|following|likes?|posts?|photos?|videos?|content)\s*$/giu, "")
    .replace(/\s*[|·•\-–:]\s*(?:Facebook|Instagram|LinkedIn|TikTok|Twitter|X|GitHub|YouTube)(?:\s*(?:profile|account))?\s*$/i, "")
    .replace(/\s*[|·\-–:]\s*(?:profile|public profile|official site)\s*$/i, "")
    .replace(/^(?:profile|public profile)(?:\s+(?:for|of))?\s*[:\-]?\s*/i, "")
    .replace(/^(?:Facebook|Instagram|LinkedIn|TikTok|Twitter|X|GitHub|YouTube)\s*[|·•:\-]\s*/i, "")
    .trim();
}
function stripDecorations(value: string) {
  // Preserve letters, combining marks, name punctuation, and internal spacing.
  return value.replace(/^[^\p{L}\p{N}@]+|[^\p{L}\p{N})'’_.-]+$/gu, "").trim();
}
const LOWERCASE_NAME_PARTICLES = new Set(["al", "bin", "da", "de", "del", "della", "den", "der", "di", "dos", "du", "el", "la", "le", "van", "von", "y"]);
function plausiblePersonName(value: string) {
  const words = value.split(/\s+/u);
  if (words.length < 2 || words.length > 4) return false;
  if (words.some((word) => !/^[\p{L}\p{M}'’-]+$/u.test(word) || NOISE_IDENTIFIERS.has(normalizeIdentifier(word)))) return false;
  const hasCasedLetters = words.some((word) => /[\p{Lu}\p{Ll}]/u.test(word));
  if (!hasCasedLetters) return true;
  return words.every((word, index) => {
    if (/^\p{Lu}/u.test(word)) return true;
    return index > 0 && index < words.length - 1 && LOWERCASE_NAME_PARTICLES.has(normalizeIdentifier(word));
  });
}
function titleAliases(title: string) {
  const cleaned = titleLead(title).trim();
  // Identity information normally precedes descriptive title copy. Parse those
  // segments instead of promoting every word in a result title to an identifier.
  const identityRegion = cleaned.split(/\s+[–—-]\s+/)[0];
  const segments = identityRegion.split(/\s*[|·•:]\s*/).map((part) => stripDecorations(part)).filter(Boolean);
  return [...new Set(segments.flatMap((segment) => {
    const withoutHandle = stripDecorations(segment.replace(/\s*\(@[\p{L}\p{N}_.-]+\)\s*/gu, ""));
    if (!withoutHandle || rejectionReason(withoutHandle)) return [];
    if (SUBJECT_NAME_CONTEXT_LABELS.has(normalizeIdentifier(withoutHandle)) || new RegExp(`^(?:${SUBJECT_NAME_LIST_ROLE_LABEL.source})$`, "iu").test(withoutHandle)) return [];
    if (/^[\p{L}\p{N}_.@-]{3,30}$/u.test(withoutHandle) && (/[_.@-]|\d|^\p{Lu}/u.test(withoutHandle))) return [withoutHandle];
    if (plausiblePersonName(withoutHandle)) return [withoutHandle];
    return [];
  }))].slice(0, 3);
}

const SUBJECT_NAME_CONTEXT_LABELS = new Set([
  "academy", "artist", "author", "category", "company", "date", "editor", "fashion", "home", "location", "magazine", "news", "page", "photo", "profile", "publication", "site", "team", "video",
]);
const SUBJECT_NAME_ROLE_LABELS = new Set([
  "actor", "artist", "author", "chef", "designer", "director", "doctor", "editor", "musician", "photographer", "professor", "writer",
]);
const SUBJECT_NAME_LIST_ROLE_LABEL = /(?:actors?|artists?|authors?|cast|contributors?|guests?|members?|models?|panelists?|performers?|presenters?|speakers?)/iu;

function roleScopedListExpansions(text: string, subjectTokens: string[], subjectNormalized: string[]) {
  const expansions: string[] = [];
  // A role label and colon bound the human list. Each comma or semicolon then
  // bounds one person, so an expansion cannot consume an adjacent list member.
  const listPattern = new RegExp(`(?:^|[.!?|]\\s*)(${SUBJECT_NAME_LIST_ROLE_LABEL.source})\\s*:\\s*([^.!?|]+)`, "giu");
  for (const listMatch of text.matchAll(listPattern)) {
    for (const rawItem of listMatch[2].split(/[,;]/u)) {
      const item = stripDecorations(rawItem);
      const tokens = [...item.matchAll(/[\p{L}\p{M}'’-]+/gu)].map((match) => match[0]);
      if (tokens.length !== subjectTokens.length + 1) continue;
      for (let index = 0; index <= tokens.length - subjectTokens.length; index += 1) {
        if (!subjectNormalized.every((token, offset) => normalizeIdentifier(tokens[index + offset]) === token)) continue;
        const neighborIndex = index === 0 ? subjectTokens.length : index - 1;
        const neighbor = tokens[neighborIndex];
        if (!neighbor || !/^\p{Lu}[\p{L}\p{M}'’-]{1,29}$/u.test(neighbor)) continue;
        if (SUBJECT_NAME_CONTEXT_LABELS.has(normalizeIdentifier(neighbor)) || NOISE_IDENTIFIERS.has(normalizeIdentifier(neighbor))) continue;
        const value = tokens.join(" ");
        if (plausiblePersonName(value) && !rejectionReason(value)) expansions.push(value);
      }
    }
  }
  return expansions;
}

/** Extract one bounded name expansion around the exact submitted-name token sequence. */
function subjectNameExpansions(result: SearchResult, submittedName?: string) {
  if (!submittedName || !plausiblePersonName(submittedName)) return [];
  const subjectTokens = submittedName.split(/\s+/u);
  const subjectNormalized = subjectTokens.map(normalizeIdentifier);
  const regions = [result.title, ...(result.description || "").split(/[.!?;|]/u)].slice(0, 5);
  const expansions = roleScopedListExpansions(`${result.title}. ${result.description || ""}`, subjectTokens, subjectNormalized);
  for (const region of regions) {
    const tokenMatches = [...region.matchAll(/[\p{L}\p{M}'’-]+/gu)];
    const tokens = tokenMatches.map((match) => match[0]);
    for (let index = 0; index <= tokens.length - subjectTokens.length; index += 1) {
      if (!subjectNormalized.every((token, offset) => normalizeIdentifier(tokens[index + offset]) === token)) continue;
      // Prefer a single adjacent alias component. This keeps expansion finite
      // and avoids absorbing publication names, roles, and neighboring people.
      for (const neighborIndex of [index - 1, index + subjectTokens.length]) {
        const neighbor = tokens[neighborIndex];
        if (!neighbor || !/^\p{Lu}[\p{L}\p{M}'’-]{1,29}$/u.test(neighbor)) continue;
        if (SUBJECT_NAME_CONTEXT_LABELS.has(normalizeIdentifier(neighbor)) || NOISE_IDENTIFIERS.has(normalizeIdentifier(neighbor))) continue;
        const beforeSubject = neighborIndex < index;
        const previousToken = beforeSubject ? tokens[neighborIndex - 1] : undefined;
        const neighborMatch = tokenMatches[neighborIndex];
        const neighborEnd = (neighborMatch.index || 0) + neighbor.length;
        const parenthesized = region.slice(0, neighborMatch.index).trimEnd().endsWith("(")
          && region.slice(neighborEnd).trimStart().startsWith(")");
        const hasNameBoundaryEvidence = beforeSubject
          && (neighborIndex === 0 || SUBJECT_NAME_ROLE_LABELS.has(normalizeIdentifier(previousToken || "")));
        // Capitalization alone is weak evidence in prose such as "Jane Smith
        // Wins Award". Admit only a leading name component at a sentence or
        // role boundary, or an adjacent component explicitly in parentheses.
        if (!hasNameBoundaryEvidence && !parenthesized) continue;
        const value = neighborIndex < index ? [neighbor, ...subjectTokens].join(" ") : [...subjectTokens, neighbor].join(" ");
        if (plausiblePersonName(value) && !rejectionReason(value)) expansions.push(value);
      }
    }
  }
  return [...new Set(expansions)].slice(0, 1);
}

function extractPreviewIdentitySignals(result: SearchResult) {
  const canonicalHandle = socialUrlHandle(result.url);
  const explicitHandles = [...`${result.title} ${result.description || ""}`.matchAll(/(?:^|[^\p{L}\p{N}_.])@([\p{L}\p{N}][\p{L}\p{N}_.-]{2,39})\b/giu)].map((match) => match[1]);
  const relationshipHandles = socialRelationshipHandles(result);
  const aliases = titleAliases(result.title);
  const labelledCompanies = [...`${result.title} ${result.description || ""}`.matchAll(/\b(?:company|organisation|organization)\s*:\s*([^|;.!?]{3,60})/giu)].map((match) => match[1].trim());
  const domains = [...`${result.title} ${result.description || ""}`.matchAll(/\b(?:domain|website)\s*:\s*((?:[\p{L}\p{N}-]+\.)+[\p{L}\p{N}-]+)/giu)].map((match) => match[1]);
  const directors = [...`${result.title} ${result.description || ""}`.matchAll(/\bdirector\s*:\s*([^|;.!?]{3,60})/giu)].map((match) => match[1].trim());
  const signals: PreviewIdentitySignal[] = [
    ...(canonicalHandle ? [{ type: "handle" as const, value: canonicalHandle }] : []),
    ...explicitHandles.map((value) => ({ type: "handle" as const, value })),
    ...relationshipHandles.map((value) => ({ type: "handle" as const, value })),
    ...aliases.map((value) => ({ type: plausiblePersonName(value) || /^\p{Lu}[\p{L}\p{M}'’-]{2,}$/u.test(value) ? "person_name" as const : "alias" as const, value })),
    ...labelledCompanies.map((value) => ({ type: "company_name" as const, value })),
    ...domains.map((value) => ({ type: "domain" as const, value })),
    ...directors.map((value) => ({ type: "director" as const, value })),
  ].filter((signal, index, all) => all.findIndex((candidate) => candidate.type === signal.type && normalizeIdentifier(candidate.value) === normalizeIdentifier(signal.value)) === index);
  const distinctAliases = signals.filter((signal) => signal.type === "alias" || signal.type === "person_name").filter((signal) => normalizeIdentifier(signal.value) !== normalizeIdentifier(canonicalHandle || ""));
  const families = new Set(signals.map((signal) => signal.type === "director" ? "person_name" : signal.type));
  const profileQuality = platformFor(result.url) ? 10 : ["registry", "company_site", "editorial"].includes(sourceClassFor(result.url)) ? 8 : 3;
  const titleConsistency = canonicalHandle && containsIdentifier(result.title, canonicalHandle) ? 8 : 0;
  const identityInformationValue = Math.min(100, profileQuality + (canonicalHandle ? 14 : 0) + (explicitHandles.length ? 10 : 0) + (relationshipHandles.length ? 18 : 0) + (signals.some((signal) => signal.type === "person_name") ? 30 : 0) + (signals.some((signal) => signal.type === "company_name") ? 22 : 0) + (signals.some((signal) => signal.type === "domain") ? 20 : 0) + (signals.some((signal) => signal.type === "director") ? 24 : 0) + Math.min(20, distinctAliases.length * 10) + (families.size > 1 ? (families.size - 1) * 8 : 0) + titleConsistency);
  const canonicalDisplayName = aliases.find((alias) => normalizeIdentifier(alias) !== normalizeIdentifier(canonicalHandle || ""));
  return { canonicalDisplayName, canonicalHandle, previewIdentitySignals: signals, identityInformationValue };
}

function socialRelationshipHandles(hit: SearchResult) {
  const text = `${hit.title} ${hit.description || ""}`;
  // Search previews commonly omit @ from handles in relationship copy. Keep
  // extraction bounded to explicit social relations instead of treating every
  // underscore-bearing token in prose as an identity pivot.
  const expressions = [
    /\b(?:followed by|following|followers? include|friends? with|connected (?:to|with)|featuring)\s+@?([\p{L}\p{N}][\p{L}\p{N}_.-]{2,39})\b/giu,
    /\b(?:and|,)\s+@?([\p{L}\p{N}][\p{L}\p{N}_.-]{2,39})\s+(?:follow|follows|are following)\b/giu,
  ];
  return [...new Set(expressions.flatMap((expression) => [...text.matchAll(expression)].map((match) => match[1])))]
    .filter((value) => /[_.\d]/u.test(value) && !rejectionReason(value));
}

function applyDiscoveryBeam<T extends { diagnostic: ResultAdmissionDiagnostic }>(results: T[], indexFor: (item: T) => number) {
  const eligible = results.filter(({ diagnostic }) => diagnostic.discoveryAdmissionDecision === "DISCOVERY_ADMITTED" && diagnostic.evidenceAdmissionDecision === "REJECTED");
  const selected: T[] = []; const families = new Set<string>();
  while (selected.length < 3 && selected.length < eligible.length) {
    const remaining = eligible.filter((item) => !selected.includes(item));
    remaining.sort((a, b) => {
      const familyBonus = (item: T) => [...new Set(item.diagnostic.previewIdentitySignals.map((signal) => signal.type === "director" ? "person_name" : signal.type))].filter((family) => !families.has(family)).length * 12;
      const av = a.diagnostic.identityInformationValue + familyBonus(a); const bv = b.diagnostic.identityInformationValue + familyBonus(b);
      return bv - av || b.diagnostic.discoveryAdmissionScore - a.diagnostic.discoveryAdmissionScore || b.diagnostic.queryProvenanceContribution - a.diagnostic.queryProvenanceContribution || indexFor(a) - indexFor(b);
    });
    const chosen = remaining[0]; selected.push(chosen);
    chosen.diagnostic.previewIdentitySignals.forEach((signal) => families.add(signal.type === "director" ? "person_name" : signal.type));
  }
  const beam = new Set(selected.map(indexFor));
  eligible.filter((item) => !beam.has(indexFor(item))).sort((a, b) => b.diagnostic.identityInformationValue - a.diagnostic.identityInformationValue || indexFor(a) - indexFor(b)).forEach((item, index) => { item.diagnostic.beamRank = selected.length + index + 1; });
  selected.forEach((item, index) => { item.diagnostic.beamRank = index + 1; item.diagnostic.beamDecision = "ADMITTED"; item.diagnostic.beamDecisionReason = "Selected by identity information value, clue diversity, source quality, and admission strength."; });
  for (const item of eligible) if (!beam.has(indexFor(item))) { item.diagnostic.beamDecision = "OUTSIDE_BEAM"; item.diagnostic.beamDecisionReason = "A higher-information or more diverse result filled the bounded discovery beam."; }
  return beam;
}
function observedIdentifiers(hit: SearchResult, originals: Set<string>, evaluations?: ResultAdmissionDiagnostic["identifierEvaluations"], submittedName?: string) {
  const text = `${hit.title} ${hit.description || ""}`;
  const explicit = [...text.matchAll(/\b(?:alias|aka|known as)\s*[:\-]?\s*["']?(@?[\p{L}\p{N}_. -]{3,40})["']?/giu)]
    .map((match) => match[1].trim().replace(/[.,;:]$/, ""));
  const namedHandles = [...text.matchAll(/\b(?:handle|username)\s*[:\-]?\s*@?([\p{L}\p{N}][\p{L}\p{N}_.-]{2,39})\b/giu)].map((match) => match[1]);
  const handles = [...text.matchAll(/(^|[^\p{L}\p{N}_.])@([\p{L}\p{N}][\p{L}\p{N}_.-]{2,39})\b/giu)].map((match) => match[2]);
  const labelledHandles = [...text.matchAll(/\b(?:Instagram|TikTok|Twitter|LinkedIn|GitHub)\s*(?::|@)\s*@?([\p{L}\p{N}][\p{L}\p{N}_.-]{2,39})\b/giu)].map((match) => match[1]);
  const linkedHandles = [...text.matchAll(/\b(?:instagram|tiktok|twitter|x|github)\.com\/(?:@)?([\p{L}\p{N}][\p{L}\p{N}_.-]{2,39})\b/giu)].map((match) => match[1]);
  const relationshipHandles = socialRelationshipHandles(hit);
  const typedEntities: DiscoveryPivot[] = [];
  const entityPatterns: Array<{ type: EntityClueType; expression: RegExp }> = [
    { type: "company_name", expression: /\b(?:company|organisation|organization|employer)\s*:\s*([^|;.!?]{3,60}?)(?=[.!?](?:\s+\p{Lu}|\s*$)|[|;]|$)/giu },
    { type: "person_name", expression: /\b(?:person|director)\s*:\s*([^|;.!?]{3,60}?)(?=[.!?](?:\s+\p{Lu}|\s*$)|[|;]|$)/giu },
    { type: "domain", expression: /\b(?:website|domain)\s*:\s*((?:[\p{L}\p{N}-]+\.)+[\p{L}\p{N}-]+)/giu },
    { type: "location", expression: /\b(?:location|based in)\s*:\s*([^|;.!?]{3,50}?)(?=[.!?](?:\s+\p{Lu}|\s*$)|[|;]|$)/giu },
    { type: "role_title", expression: /\b(?:role|title|position)\s*:\s*([^|;.!?]{3,50}?)(?=[.!?](?:\s+\p{Lu}|\s*$)|[|;]|$)/giu },
  ];
  for (const pattern of entityPatterns) for (const match of text.matchAll(pattern.expression)) typedEntities.push({ value: match[1].trim().replace(/[.,]$/, ""), type: pattern.type, relation: "discovery_lead", derivation: "page_entity" });
  const urlHandle = socialUrlHandle(hit.url);
  const aliases = titleAliases(hit.title);
  const subjectAliases = subjectNameExpansions(hit, submittedName);
  const pivots: DiscoveryPivot[] = [
    ...subjectAliases.map((value) => ({ value, type: "person_name" as const, relation: "discovery_lead" as const, derivation: "subject_name_expansion" as const })),
    ...explicit.map((value) => ({ value, type: "person_name" as const, relation: "corroborated_identifier" as const, derivation: "explicit_assertion" as const })),
    ...namedHandles.map((value) => ({ value, type: "username" as const, relation: "discovery_lead" as const, derivation: "explicit_handle" as const })),
    ...labelledHandles.map((value) => ({ value, type: "username" as const, relation: "discovery_lead" as const, derivation: "explicit_handle" as const })),
    ...linkedHandles.map((value) => ({ value, type: "username" as const, relation: "discovery_lead" as const, derivation: "explicit_handle" as const })),
    ...relationshipHandles.map((value) => ({ value, type: "username" as const, relation: "discovery_lead" as const, derivation: "explicit_handle" as const })),
    ...(urlHandle ? [{ value: urlHandle, type: "username" as const, relation: "discovery_lead" as const, derivation: "social_url" as const }] : []),
    ...handles.map((value) => ({ value, type: "username" as const, relation: "discovery_lead" as const, derivation: "explicit_handle" as const })),
    ...typedEntities,
    ...aliases.map((value) => ({ value, type: "person_name" as const, relation: "discovery_lead" as const, derivation: "display_name" as const })),
  ];
  const seen = new Set<string>();
  const admitted = pivots.filter((pivot) => {
    const id = normalizeIdentifier(pivot.value);
    const useful = pivot.type === "domain" ? !rejectionReason(pivot.value) && !originals.has(id) : usefulIdentifier(pivot.value, originals);
    if (!useful) { evaluations?.push({ identifier: pivot.value, type: pivot.type || "unknown", derivation: pivot.derivation, decision: "rejected", reason: rejectionReason(pivot.value) || (originals.has(id) ? "matches_submitted_identifier" : "identifier_quality_rule") }); return false; }
    if (seen.has(id)) { evaluations?.push({ identifier: pivot.value, type: pivot.type || "unknown", derivation: pivot.derivation, decision: "rejected", reason: "duplicate_within_result" }); return false; }
    seen.add(id); return true;
  });
  admitted.forEach((pivot, index) => evaluations?.push({ identifier: pivot.value, type: pivot.type || "unknown", derivation: pivot.derivation, decision: index < 5 ? "extracted" : "rejected", reason: index < 5 ? "passed_identifier_and_result_admission" : "per_result_identifier_limit" }));
  return admitted.slice(0, 5);
}

function observedContacts(hit: SearchResult) {
  const text = `${hit.title} ${hit.description || ""}`;
  const emails = [...new Set([...text.matchAll(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/giu)].map((match) => match[0].toLowerCase()))];
  const phoneNumbers = [...new Set([...text.matchAll(/(?:^|\s)(\+?\d[\d\s().-]{6,}\d)(?=$|\s|[.,;])/gu)].map((match) => match[1].trim()))];
  return { emails, phoneNumbers };
}

function underlyingSourceFamily(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const parts = host.split(".");
    return parts.length > 2 ? parts.slice(-2).join(".") : host;
  } catch { return url; }
}
async function braveSearch(query: string, apiKey: string, signal: AbortSignal, limit: number): Promise<SearchResult[]> { const url = new URL(SEARCH_ENDPOINT); url.searchParams.set("q", query); url.searchParams.set("count", String(limit)); url.searchParams.set("safesearch", "strict"); const response = await fetch(url, { signal, headers: { accept: "application/json", "x-subscription-token": apiKey } }); if (!response.ok) throw new Error(`Public search returned HTTP ${response.status}.`); const payload = await response.json() as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } }; return (payload.web?.results || []).filter((item): item is SearchResult => Boolean(item.title && item.url)).slice(0, limit); }

type SchedulingTier = 1 | 2 | 3 | 4;
type QueueItem = { id: string; label: string; hop: number; path: string[]; query: string; method: string; intent: SearchIntent; identifierStrength?: "discovery_lead" | "corroborated_identifier"; qualityScore: number; priority: number; clueType: EntityClueType; derivation?: DiscoveryPivot["derivation"]; schedulingTier?: SchedulingTier; siblingRank?: number; queryPass?: number; schedulingGeneration?: number; branchPriority?: number; firstPassProducedIdentifiers?: boolean; requiredResultIdentifier?: string; evidenceContinuation?: boolean };
type PendingIdentifier = Omit<QueueItem, "query" | "method" | "intent"> & { exactSource: boolean; order: number; derivation: DiscoveryPivot["derivation"]; adjacentLabels: string[] };

function schedulingTierForPivot(input: { clueType: EntityClueType; derivation: DiscoveryPivot["derivation"]; evidenceAdmitted: boolean; directStemEvidence: boolean; identifierStrength: QueueItem["identifierStrength"] }): SchedulingTier {
  if (input.derivation === "subject_name_expansion") return 1;
  const strongEntity = ["company_name", "domain"].includes(input.clueType) && input.evidenceAdmitted;
  if (strongEntity || input.identifierStrength === "corroborated_identifier") return 1;
  if (input.directStemEvidence && input.evidenceAdmitted && input.derivation === "explicit_handle" && ["username", "social_profile"].includes(input.clueType)) return 2;
  if (input.directStemEvidence && input.derivation === "social_url" && ["username", "social_profile"].includes(input.clueType)) return 4;
  if (["username", "social_profile"].includes(input.clueType)) return input.derivation === "explicit_handle" || input.evidenceAdmitted ? 3 : 4;
  return input.evidenceAdmitted ? 1 : 3;
}

function compareSchedulingTier(a: { schedulingTier?: SchedulingTier }, b: { schedulingTier?: SchedulingTier }) {
  return (a.schedulingTier || 3) - (b.schedulingTier || 3);
}

function contextualQueries(pivot: PendingIdentifier, localPart: string) {
  const value = pivot.label.replace(/["\\]/g, " ").trim();
  const graphNeighbors = [...pivot.adjacentLabels].reverse().filter((item) => !item.includes("@") && normalizeIdentifier(item) !== normalizeIdentifier(value));
  const neighbors = [...new Set([...graphNeighbors, localPart])].slice(0, 3);
  const queries: Array<{ query: string; method: string; intent: SearchIntent }> = [
    ...neighbors.slice(0, 1).map((neighbor) => ({ query: `"${value}" "${neighbor.replace(/["\\]/g, " ")}"`, method: `${pivot.identifierStrength}_graph_neighbor`, intent: "graph_neighbor_expansion" as const })),
    { query: `"${value}"`, method: `${pivot.identifierStrength}_open_web_exact`, intent: "open_web_identity" as const },
    { query: `site:instagram.com OR site:tiktok.com OR site:linkedin.com "${value}"`, method: `${pivot.identifierStrength}_social_context`, intent: "social_profile_discovery" as const },
  ];
  if (pivot.derivation === "social_url" || pivot.derivation === "explicit_handle") queries.push({ query: `"${value}" "${neighbors[0] || localPart}"`, method: `${pivot.identifierStrength}_corroboration`, intent: "corroboration" });
  if (pivot.derivation === "explicit_handle") queries.sort((a, b) => Number(b.intent === "social_profile_discovery") - Number(a.intent === "social_profile_discovery"));
  return queries;
}

function budgetedContextualQueries(pivot: PendingIdentifier, localPart: string) {
  const variants = contextualQueries(pivot, localPart);
  if (pivot.evidenceContinuation) return variants.slice(0, 1);
  if (pivot.derivation === "explicit_handle") return variants.slice(0, 2);
  const socialVariant = variants.find((variant) => variant.intent === "social_profile_discovery");
  return socialVariant ? [variants[0], socialVariant].filter((variant, index, selected) => selected.indexOf(variant) === index) : variants.slice(0, 2);
}

function numericFreeUsernameStem(localPart: string) {
  if (!/\d/u.test(localPart)) return undefined;
  const stem = localPart.replace(/\d+/gu, "").replace(/[._+-]{2,}/gu, (separator) => separator[0]).replace(/^[._+-]+|[._+-]+$/gu, "");
  return stem.length >= 4 && stem.length <= 40 && /\p{L}/u.test(stem) ? stem : undefined;
}

export async function discoverExternalIdentityGraph(email: string, apiKey: string, signal: AbortSignal, options: { limits?: Partial<IdentityDiscoveryLimits>; search?: SearchFn; signals?: Omit<PersonalIdentitySignals, "email"> } = {}) {
  const limits = { ...DEFAULT_IDENTITY_DISCOVERY_LIMITS, ...options.limits };
  const search = options.search || braveSearch;
  const normalized = email.trim().toLowerCase(); const localPart = normalized.split("@")[0]; const domain = normalized.split("@")[1]; const usernameStem = numericFreeUsernameStem(localPart);
  const submittedSignals = { email: normalized, ...options.signals };
  const escapedName = options.signals?.name?.replace(/["\\]/g, " ").trim();
  const nameAndEmailClue = escapedName
    ? `"${escapedName}" "${usernameStem || localPart}"`
    : undefined;
  const originals = new Set([normalized, normalizeIdentifier(localPart), normalizeIdentifier(domain), ...(usernameStem ? [normalizeIdentifier(usernameStem)] : []), ...(options.signals?.name ? [normalizeIdentifier(options.signals.name)] : [])]);
  const seedQueue: QueueItem[] = [
    { id: normalized, label: normalized, hop: 0, path: [normalized], query: `"${normalized}"`, method: "exact_email", intent: "open_web_identity", qualityScore: 96, priority: 96, clueType: "email" },
    ...(escapedName ? [
      { id: escapedName, label: escapedName, hop: 0, path: [normalized, escapedName], query: `"${escapedName}"`, method: "submitted_name_exact", intent: "open_web_identity" as const, qualityScore: 94, priority: 95, clueType: "person_name" as const },
      { id: escapedName, label: escapedName, hop: 0, path: [normalized, escapedName], query: `"${escapedName}" site:facebook.com OR site:instagram.com OR site:linkedin.com OR site:x.com OR site:tiktok.com`, method: "submitted_name_social", intent: "social_profile_discovery" as const, qualityScore: 94, priority: 94, clueType: "person_name" as const },
      { id: escapedName, label: escapedName, hop: 0, path: [normalized, escapedName, usernameStem || localPart], query: nameAndEmailClue!, method: "submitted_name_email_clue", intent: "corroboration" as const, qualityScore: 92, priority: 93, clueType: "person_name" as const },
    ] : []),
    { id: normalized, label: normalized, hop: 0, path: [normalized], query: `"${normalized}" profile OR social`, method: "exact_email_profile", intent: "social_profile_discovery", qualityScore: 96, priority: 95, clueType: "email" },
    { id: localPart, label: localPart, hop: 0, path: [normalized], query: `"${localPart}" profile`, method: "username_open_web", intent: "open_web_identity", qualityScore: 83, priority: 84, clueType: "username" },
    { id: localPart, label: localPart, hop: 0, path: [normalized], query: `"${localPart}" site:facebook.com OR site:instagram.com OR site:linkedin.com OR site:x.com OR site:tiktok.com`, method: "social_profile", intent: "social_profile_discovery", qualityScore: 83, priority: 82, clueType: "username" },
    ...(usernameStem ? [
      { id: usernameStem, label: usernameStem, hop: 0, path: [normalized, usernameStem], query: `"${usernameStem}" profile`, method: "numeric_free_username_stem_open_web", intent: "open_web_identity" as const, qualityScore: 76, priority: 79, clueType: "username" as const, requiredResultIdentifier: usernameStem },
    ] : []),
    ...([
      { value: options.signals?.username, method: "submitted_username", clueType: "username" as const, priority: 92 },
      { value: options.signals?.phone, method: "submitted_phone", clueType: "phone" as const, priority: 90 },
    ].flatMap(({ value, ...seed }) => value ? [{ ...seed, id: normalizeIdentifier(value), label: value, hop: 0, path: [normalized, value], query: `"${value.replace(/["\\]/g, " ")}" profile`, intent: "open_web_identity" as const, qualityScore: seed.priority }] : [])),
  ];
  // Seed collection cannot consume the searches reserved for high-value clues,
  // graph-neighbor expansion, and convergence attempts.
  const seedSearchLimit = Math.max(1, limits.maxSearches - Math.min(limits.reservedExpansionSearches, limits.maxSearches - 1));
  const queue: QueueItem[] = seedQueue.slice(0, seedSearchLimit);
  const omittedSeeds = seedQueue.slice(seedSearchLimit);
  const searched = new Set<string>(); const queuedIdentifiers = new Set<string>(); const continuedDirectPivots = new Set<string>(); const candidates = new Map<string, ExternalIdentityCandidate>();
  const clues = new Map<string, EntityClue>();
  const edges: IdentityDiscoveryEdge[] = []; const pendingIdentifiers: PendingIdentifier[] = [];
  const searches: IdentityDiscoverySearchDiagnostic[] = [];
  const schedulingDiagnostics: IdentitySchedulingDiagnostic[] = queue.map((item) => ({ pivot: item.label, clueType: item.clueType, hop: item.hop, query: item.query, decision: "scheduled", reason: "seed_plan", remainingSearchBudget: limits.maxSearches }));
  let searchCount = 0; let identifierCount = usernameStem ? 3 : 2; let observationOrder = 0; let seedSearchesRemaining = queue.length; let schedulingGeneration = 0;
  const addClue = (clue: EntityClue) => {
    const prior = clues.get(clue.id);
    if (!prior) { clues.set(clue.id, clue); return; }
    prior.observedBy = [...new Set([...prior.observedBy, ...clue.observedBy])];
    prior.adjacentClueIds = [...new Set([...prior.adjacentClueIds, ...clue.adjacentClueIds])];
    const admissionRank = { rejected: 0, lead_only: 1, admitted: 2 } as const;
    const priorAdmissionRank = admissionRank[prior.pivotAdmissionDecision];
    const nextAdmissionRank = admissionRank[clue.pivotAdmissionDecision];
    if (nextAdmissionRank > priorAdmissionRank
      || (nextAdmissionRank === priorAdmissionRank && (clue.independentAnchorCount > prior.independentAnchorCount || clue.pivotStrength > prior.pivotStrength))) {
      prior.qualityScore = clue.qualityScore;
      prior.searchPriority = clue.searchPriority;
      prior.enqueueDecision = clue.enqueueDecision;
      prior.rejectionReason = clue.rejectionReason;
      prior.pivotStrength = clue.pivotStrength;
      prior.pivotAdmissionDecision = clue.pivotAdmissionDecision;
      prior.pivotAdmissionReason = clue.pivotAdmissionReason;
      prior.distanceFromRoot = clue.distanceFromRoot;
      prior.independentAnchorCount = clue.independentAnchorCount;
    }
    if (!prior.discoveryPath.some((step, index) => step !== clue.discoveryPath[index])) return;
  };
  addClue({ id: `email:${normalized}`, type: "email", normalizedValue: normalized, displayValue: normalized, source: "submitted-target", discoveryPath: [normalized], hop: 0, derivation: "submitted", evidenceStrength: "strong", attributionState: "verified", adjacentClueIds: [`username:${localPart}`, `domain:${domain}`], observedBy: ["submitted-target"], ...schedulingFields({ type: "email", value: normalized, derivation: "submitted" }) });
  if (options.signals?.name) addClue({ id: `person_name:${normalizeIdentifier(options.signals.name)}`, type: "person_name", normalizedValue: normalizeIdentifier(options.signals.name), displayValue: options.signals.name, source: "submitted-target", discoveryPath: [normalized, options.signals.name], hop: 0, derivation: "submitted", evidenceStrength: "strong", attributionState: "verified", adjacentClueIds: [`email:${normalized}`], observedBy: ["submitted-target"], ...schedulingFields({ type: "person_name", value: options.signals.name, derivation: "submitted" }) });
  addClue({ id: `username:${localPart}`, type: "username", normalizedValue: normalizeIdentifier(localPart), displayValue: localPart, source: "derived-email-local-part", discoveryPath: [normalized, localPart], hop: 0, derivation: "derived_email_stem", evidenceStrength: "lead", attributionState: "discovery", adjacentClueIds: [`email:${normalized}`], observedBy: ["derived-email-local-part"], ...schedulingFields({ type: "username", value: localPart, derivation: "derived_email_stem", originalOverlap: true }) });
  if (usernameStem) addClue({ id: `username:${usernameStem}`, type: "username", normalizedValue: normalizeIdentifier(usernameStem), displayValue: usernameStem, source: "derived-email-stem", discoveryPath: [normalized, usernameStem], hop: 0, derivation: "derived_email_stem", evidenceStrength: "lead", attributionState: "discovery", adjacentClueIds: [`email:${normalized}`, `username:${localPart}`], observedBy: ["derived-email-stem"], ...schedulingFields({ type: "username", value: usernameStem, derivation: "derived_email_stem", originalOverlap: true }) });
  addClue({ id: `domain:${domain}`, type: "domain", normalizedValue: domain, displayValue: domain, source: "submitted-target", discoveryPath: [normalized, domain], hop: 0, derivation: "submitted", evidenceStrength: "observed", attributionState: "discovery", adjacentClueIds: [`email:${normalized}`], observedBy: ["submitted-target"], ...schedulingFields({ type: "domain", value: domain, derivation: "submitted", originalOverlap: true }) });

  const enqueuePending = () => {
    pendingIdentifiers.sort((a, b) => compareSchedulingTier(a, b) || b.priority - a.priority || Number(b.exactSource) - Number(a.exactSource) || a.order - b.order);
    const accepted: Array<{ item: PendingIdentifier; variants: ReturnType<typeof contextualQueries> }> = [];
    const deferred: PendingIdentifier[] = []; const selectedFamilies = new Set<string>();
    for (const item of pendingIdentifiers.splice(0)) {
      const id = normalizeIdentifier(item.id);
      if (queuedIdentifiers.has(id)) { schedulingDiagnostics.push({ pivot: item.label, clueType: item.clueType, hop: item.hop, decision: "skipped", reason: "deduplicated", remainingSearchBudget: limits.maxSearches - searchCount }); continue; }
      if (identifierCount >= limits.maxIdentifiers) { schedulingDiagnostics.push({ pivot: item.label, clueType: item.clueType, hop: item.hop, decision: "skipped", reason: "identifier_budget", remainingSearchBudget: limits.maxSearches - searchCount }); continue; }
      const family = item.clueType === "username" || item.clueType === "social_profile" ? "social_handle" : item.clueType;
      // Admit a small, diverse beam. A single result family cannot schedule a
      // long run of equivalent handles ahead of person, company, or domain clues.
      if (accepted.length >= 3 || (selectedFamilies.has(family) && family === "social_handle")) { deferred.push(item); schedulingDiagnostics.push({ pivot: item.label, clueType: item.clueType, hop: item.hop, decision: "skipped", reason: "beam_deferred", remainingSearchBudget: limits.maxSearches - searchCount }); continue; }
      selectedFamilies.add(family);
      queuedIdentifiers.add(id); identifierCount += 1;
      const variants = budgetedContextualQueries(item, localPart); accepted.push({ item, variants });
      schedulingDiagnostics.push({ pivot: item.label, clueType: item.clueType, hop: item.hop, decision: "admitted", reason: "pivot_admitted", remainingSearchBudget: limits.maxSearches - searchCount });
      const clue = clues.get(`${item.clueType}:${id}`); if (clue) clue.queriesPlanned = variants.map((variant) => variant.query);
    }
    pendingIdentifiers.push(...deferred);
    if (accepted.length === 0) return;
    const generation = schedulingGeneration++;
    for (let variantIndex = 0; variantIndex < 2; variantIndex += 1) for (const [siblingIndex, { item, variants }] of accepted.entries()) {
      const variant = variants[variantIndex]; if (variant) { schedulingDiagnostics.push({ pivot: item.label, clueType: item.clueType, hop: item.hop, query: variant.query, schedulingGeneration: generation, queryPass: variantIndex, decision: "scheduled", reason: "pivot_admitted", remainingSearchBudget: limits.maxSearches - searchCount }); queue.push({ ...item, ...variant, siblingRank: siblingIndex + 1, queryPass: variantIndex, schedulingGeneration: generation, branchPriority: item.priority, priority: item.priority - variantIndex * 30 }); }
    }
  };

  while (queue.length && searchCount < limits.maxSearches) {
    // Expand each admitted sibling cohort in rounds. Descendants enter a new
    // generation, while stronger unresolved social variants retain priority.
    queue.sort((a, b) => {
      const effectiveTier = (candidate: QueueItem) => candidate.queryPass === 1 && candidate.firstPassProducedIdentifiers === true ? Math.max(3, candidate.schedulingTier || 3) : candidate.schedulingTier || 3;
      const tierOrder = effectiveTier(a) - effectiveTier(b);
      if (tierOrder) return tierOrder;
      if (a.schedulingGeneration !== undefined && a.schedulingGeneration === b.schedulingGeneration) {
        return (a.queryPass || 0) - (b.queryPass || 0) || a.hop - b.hop || b.priority - a.priority;
      }
      const protectsImportantSecondVariant = (candidate: QueueItem, competitor: QueueItem) => candidate.queryPass === 1
        && candidate.firstPassProducedIdentifiers === false
        && candidate.intent === "social_profile_discovery"
        && ["person_name", "company_name", "domain"].includes(candidate.clueType)
        && (candidate.branchPriority || candidate.priority) > (competitor.branchPriority || competitor.priority);
      const protectA = protectsImportantSecondVariant(a, b); const protectB = protectsImportantSecondVariant(b, a);
      if (protectA !== protectB) return protectA ? -1 : 1;
      return (a.queryPass || 0) - (b.queryPass || 0) || b.priority - a.priority || a.hop - b.hop || (a.schedulingGeneration || 0) - (b.schedulingGeneration || 0);
    });
    const item = queue.shift()!;
    const expansionKey = `${item.hop}:${normalizeIdentifier(item.query)}`;
    if (searched.has(expansionKey)) { schedulingDiagnostics.push({ pivot: item.label, clueType: item.clueType, hop: item.hop, query: item.query, schedulingGeneration: item.schedulingGeneration, queryPass: item.queryPass, decision: "skipped", reason: "deduplicated", remainingSearchBudget: limits.maxSearches - searchCount }); continue; }
    searched.add(expansionKey); searchCount += 1;
    const scheduledClue = clues.get(`${item.clueType}:${normalizeIdentifier(item.label)}`);
    if (scheduledClue) scheduledClue.queriesExecuted.push(item.query);
    let results: SearchResult[];
    try {
      results = await search(item.query, apiKey, signal, limits.maxResultsPerSearch);
    } catch (error) {
      if (signal.aborted || (error instanceof Error && error.name === "AbortError")) break;
      throw error;
    }
    const identifiersBefore = new Set(edges.filter((edge) => edge.relation !== "search_result").map((edge) => edge.to));
    const resultDiagnostics: ResultAdmissionDiagnostic[] = [];
    const activeClue = clues.get(`${item.clueType}:${normalizeIdentifier(item.label)}`) || clues.get(`email:${normalized}`)!;
    const graphNeighbors = [...new Set([localPart, ...item.path, ...(activeClue.adjacentClueIds.map((id) => clues.get(id)?.displayValue).filter(Boolean) as string[])])];
    const assessedResults = results.map((hit, resultIndex) => ({ hit, resultIndex, diagnostic: admissionDiagnostic(hit, activeClue, normalized, graphNeighbors, { hop: item.hop, intent: item.intent, query: item.query }, item.priority, item.siblingRank || resultIndex + 1, limits.maxSearches - searchCount) }));
    if (item.requiredResultIdentifier) for (const { hit, diagnostic } of assessedResults) {
      const resultText = `${hit.title} ${hit.description || ""} ${hit.url}`;
      if (containsIdentifier(resultText, item.requiredResultIdentifier)) continue;
      diagnostic.admissionDecision = "rejected"; diagnostic.evidenceAdmissionDecision = "REJECTED"; diagnostic.admissionReason = "The numeric-free username stem does not appear in the result."; diagnostic.evidenceAdmissionReason = diagnostic.admissionReason;
      diagnostic.discoveryAdmissionDecision = "REJECTED"; diagnostic.discoveryAdmissionReason = diagnostic.admissionReason; diagnostic.beamDecision = "NOT_ELIGIBLE"; diagnostic.beamDecisionReason = diagnostic.admissionReason;
    }
    const seedDiscoveryBeam = applyDiscoveryBeam(assessedResults, (entry) => entry.resultIndex);
    for (const { resultIndex, hit, diagnostic: resultDiagnostic } of assessedResults) {
      const sourceClass = sourceClassFor(hit.url);
      const platform = platformFor(hit.url);
      if (resultDiagnostic.discoveryAdmissionDecision === "DISCOVERY_ADMITTED" && resultDiagnostic.evidenceAdmissionDecision === "REJECTED" && !seedDiscoveryBeam.has(resultIndex)) {
        resultDiagnostic.discoveryAdmissionDecision = "REJECTED";
        resultDiagnostic.discoveryAdmissionReason = "Structurally relevant lead fell outside the bounded top-three seed discovery beam.";
      }
      resultDiagnostics.push(resultDiagnostic);
      if (resultDiagnostic.discoveryAdmissionDecision === "REJECTED") continue;
      if (!platform) {
        const snippet = `${hit.title}${hit.description ? ` - ${hit.description}` : ""}`.trim();
        const pivots = observedIdentifiers(hit, originals, resultDiagnostic.identifierEvaluations, options.signals?.name);
        const personPivots = pivots.filter((pivot) => pivot.type === "person_name");
        for (const pivot of pivots) {
          const id = normalizeIdentifier(pivot.value); const clueType = pivot.type || "unknown";
          const path = [...item.path, pivot.value];
          const relatedPerson = personPivots.find((person) => normalizeIdentifier(person.value) !== id);
          const evidenceAdmitted = resultDiagnostic.evidenceAdmissionDecision === "EVIDENCE_ADMITTED";
          const discoveryOnlyAlias = pivot.derivation === "subject_name_expansion" || pivot.derivation === "derived_alias";
          const relation = clueType === "username" && relatedPerson ? "uses_handle_candidate" : discoveryOnlyAlias ? "discovery_lead" : evidenceAdmitted ? pivot.relation : "discovery_lead";
          edges.push({ from: relatedPerson ? normalizeIdentifier(relatedPerson.value) : hit.url, to: id, relation, hop: item.hop + 1, evidence: { query: item.query, url: hit.url, snippet, provider: "Brave Search", sourceClass, searchIntent: item.intent, derivation: pivot.derivation } });
          const adjacentLabels = [...new Set([item.label, ...(relatedPerson ? [relatedPerson.value] : [])])];
          const priorClue = clues.get(`${clueType}:${id}`);
          const sourceFamilies = new Set([...(priorClue?.observedBy || []).map((entry) => sourceClassFor(entry.split("|").at(-1) || "")), sourceClass]);
          const strongAnchor = discoveryOnlyAlias || resultDiagnostic.matchedAnchors.some((anchor) => anchor === "original_target" || anchor === "original_local_part");
          const scheduling = schedulingFields({ type: clueType, value: pivot.value, derivation: pivot.derivation, adjacency: adjacentLabels.length, originalOverlap: originals.has(id), distanceFromRoot: item.hop + 1, independentAnchorCount: strongAnchor ? 1 : sourceFamilies.size >= 2 ? sourceFamilies.size : 0, strongAnchor });
          addClue({ id: `${clueType}:${id}`, type: clueType, normalizedValue: id, displayValue: pivot.value, source: hit.url, sourceFamily: underlyingSourceFamily(hit.url), parentSubmittedIdentifier: options.signals?.name, lifecycleState: "admitted", admissionState: discoveryOnlyAlias ? "discovery_only" : "evidence_eligible", discoveryPath: path, hop: item.hop + 1, derivation: pivot.derivation, evidenceStrength: "observed", attributionState: "discovery", adjacentClueIds: [item.id], observedBy: [`${item.query}|${hit.url}`], ...scheduling });
          resultDiagnostic.extractedClues.push(pivot.value); resultDiagnostic.extractedDiscoveryClues.push(pivot.value); if (resultDiagnostic.evidenceAdmissionDecision === "EVIDENCE_ADMITTED" && !discoveryOnlyAlias) resultDiagnostic.extractedEvidenceClues.push(pivot.value);
          if (item.hop < limits.maxHops - 1 && scheduling.enqueueDecision === "enqueued") pendingIdentifiers.push({ id, label: pivot.value, hop: item.hop + 1, path, identifierStrength: "discovery_lead", exactSource: false, order: observationOrder++, derivation: pivot.derivation, clueType, adjacentLabels, qualityScore: scheduling.qualityScore, priority: scheduling.searchPriority + (pivot.derivation === "explicit_handle" ? 14 : clueType === "person_name" ? 8 : 0), schedulingTier: schedulingTierForPivot({ clueType, derivation: pivot.derivation, evidenceAdmitted, directStemEvidence: Boolean(item.requiredResultIdentifier), identifierStrength: "discovery_lead" }) });
        }
        continue;
      }
      const profileUrl = identityProfileUrl(hit.url); if (!profileUrl) continue;
      const snippet = `${hit.title}${hit.description ? ` - ${hit.description}` : ""}`.trim();
      const currentExact = containsExactEmailToken(snippet, normalized);
      const prior = candidates.get(profileUrl); const exact = currentExact || prior?.matchLevel === "exact_match";
      const observation = { query: item.query, snippet, url: publicSearchEvidenceUrl(item.query), sourceUrl: hit.url, hop: item.hop };
      const supportingEvidence = [...(prior?.supportingEvidence || []), observation];
      const contacts = observedContacts(hit);
      const observedEmails = [...new Set([...(prior?.observedEmails || []), ...contacts.emails])];
      const observedPhoneNumbers = [...new Set([...(prior?.observedPhoneNumbers || []), ...contacts.phoneNumbers])];
      const sourceProvenance = [...new Map([...(prior?.sourceProvenance || []), { url: hit.url, family: underlyingSourceFamily(hit.url), query: item.query }].map((entry) => [`${entry.family}|${entry.url}`, entry])).values()];
      const observedMatches = [...(prior?.matchedIdentifiers || [])];
      if (currentExact) observedMatches.push(normalized);
      else if (item.hop > 0 && item.identifierStrength === "corroborated_identifier" && containsIdentifier(snippet, item.label)) observedMatches.push(normalizeIdentifier(item.label));
      const identifiers = [...new Set(observedMatches)];
      const contextOverlap = Number(containsIdentifier(snippet, localPart)) + Number(containsIdentifier(snippet, item.label));
      const profileQuality = socialUrlHandle(profileUrl) ? 2 : 1;
      const pathRelevance = Math.max(0, 3 - item.hop);
      const distancePenalty = item.hop * 12;
      const discoveryScore = Math.max(0, (exact ? 100 : 0) + contextOverlap * 12 + profileQuality * 5 + pathRelevance * 3 - distancePenalty);
      const candidateDiscoveryConfidence = Math.max(prior?.candidateDiscoveryConfidence || 0, Math.min(100, discoveryScore));
      const identityAttributionConfidence = exact ? 75 : null;
      // `confidence` is retained for report compatibility, but now represents
      // attribution only. Unverified leads have no percentage attribution.
      const confidence = Math.max(prior?.confidence || 0, identityAttributionConfidence || 0);
      const selectedCurrent = currentExact || !prior || (prior.matchLevel !== "exact_match" && confidence > prior.confidence);
      const path = [...item.path, `${platform} ${hit.title}`];
      candidates.set(profileUrl, {
        platform, profileUrl,
        observedDisplayName: prior?.observedDisplayName || (!containsExactEmailToken(hit.title, normalized) ? resultDiagnostic.canonicalDisplayName || hit.title.trim() : undefined),
        discoveryOnlyAlias: prior?.discoveryOnlyAlias || item.derivation === "subject_name_expansion" || item.derivation === "derived_alias",
        matchedIdentifiers: identifiers,
        matchType: exact ? "exact_email" : item.hop ? "alias" : "username",
        status: "Candidate", matchLevel: exact ? "exact_match" : "unverified_candidate", confidence,
        evidenceUrl: selectedCurrent ? observation.url : prior!.evidenceUrl,
        evidenceQuery: selectedCurrent ? item.query : prior!.evidenceQuery,
        evidenceSnippet: selectedCurrent ? snippet : prior!.evidenceSnippet,
        methods: [...new Set([...(prior?.methods || []), item.method])], sourceProvider: "Brave Search",
        evidenceReference: selectedCurrent ? observation.url : prior!.evidenceReference,
        discoveryPath: selectedCurrent ? path : prior!.discoveryPath,
        supportingEvidence,
        observedEmails,
        observedPhoneNumbers,
        sourceProvenance,
        independentSourceFamilyCount: new Set(sourceProvenance.map((entry) => entry.family)).size,
        discoveryScore: Math.max(prior?.discoveryScore || 0, discoveryScore),
        candidateDiscoveryConfidence,
        identityAttributionConfidence: prior?.identityAttributionConfidence ?? identityAttributionConfidence,
        matchBasis: exact
          ? "The exact submitted email appears in public search evidence for this profile. The result remains a candidate until an independent source corroborates it."
          : item.hop
            ? `The explicit identifier “${item.label}” appears in this result and in the prior result on the preserved discovery path. This is an unverified lead.`
            : "The submitted email local-part generated this public profile candidate. Candidate only, not verified identity.",
      });
      edges.push({ from: item.id, to: profileUrl, relation: "search_result", hop: item.hop, evidence: { query: item.query, url: observation.url, snippet, provider: "Brave Search" } });
      if (item.hop >= limits.maxHops - 1) continue;
      const pivots = observedIdentifiers(hit, originals, resultDiagnostic.identifierEvaluations, options.signals?.name); const precedingPersonClues: string[] = [];
      for (const pivot of pivots) {
        const id = normalizeIdentifier(pivot.value);
        const evidence = { query: item.query, url: observation.url, snippet, provider: "Brave Search" as const, sourceClass, searchIntent: item.intent, derivation: pivot.derivation };
        // Preserve every observation edge. Search execution is deduplicated separately.
        const discoveryOnlyAlias = pivot.derivation === "subject_name_expansion" || pivot.derivation === "derived_alias";
        const admittedRelation = discoveryOnlyAlias ? "discovery_lead" : resultDiagnostic.evidenceAdmissionDecision === "EVIDENCE_ADMITTED" ? pivot.relation : "discovery_lead";
        edges.push({ from: profileUrl, to: id, relation: admittedRelation, hop: item.hop + 1, evidence });
        const clueType = pivot.type || "unknown"; const clueId = `${clueType}:${id}`;
        const adjacentLabels = [...new Set([item.label, ...item.path.filter((step) => !/^https?:/i.test(step)).map((step) => step.replace(/^.*“|”$/g, ""))])].slice(-4);
        const cluePath = clueType === "person_name" ? [...item.path, ...precedingPersonClues, pivot.value] : [...path, pivot.value];
        const priorClue = clues.get(clueId);
        const sourceFamilies = new Set([...(priorClue?.observedBy || []).map((entry) => sourceClassFor(entry.split("|").at(-1) || "")), sourceClass]);
        const strongAnchor = discoveryOnlyAlias || currentExact || resultDiagnostic.matchedAnchors.some((anchor) => anchor === "original_target" || anchor === "original_local_part");
        const scheduling = schedulingFields({ type: clueType, value: pivot.value, derivation: pivot.derivation, adjacency: adjacentLabels.length, originalOverlap: originals.has(id), distanceFromRoot: item.hop + 1, independentAnchorCount: strongAnchor ? 1 : sourceFamilies.size >= 2 ? sourceFamilies.size : 0, strongAnchor });
        addClue({ id: clueId, type: clueType, normalizedValue: id, displayValue: pivot.value, source: profileUrl, sourceFamily: underlyingSourceFamily(profileUrl), parentSubmittedIdentifier: options.signals?.name, lifecycleState: "admitted", admissionState: discoveryOnlyAlias ? "discovery_only" : "evidence_eligible", discoveryPath: cluePath, hop: item.hop + 1, derivation: pivot.derivation, evidenceStrength: admittedRelation === "corroborated_identifier" ? "strong" : "observed", attributionState: admittedRelation === "corroborated_identifier" ? "corroborated" : "discovery", adjacentClueIds: [item.id], observedBy: [`${item.query}|${profileUrl}`], ...scheduling });
        resultDiagnostic.extractedClues.push(pivot.value); resultDiagnostic.extractedDiscoveryClues.push(pivot.value); if (resultDiagnostic.evidenceAdmissionDecision === "EVIDENCE_ADMITTED" && !discoveryOnlyAlias) resultDiagnostic.extractedEvidenceClues.push(pivot.value);
        if (scheduling.enqueueDecision === "enqueued") pendingIdentifiers.push({ id, label: pivot.value, hop: item.hop + 1, path: cluePath, identifierStrength: admittedRelation, exactSource: exact, order: observationOrder++, derivation: pivot.derivation, clueType, adjacentLabels: [...adjacentLabels, ...precedingPersonClues], qualityScore: scheduling.qualityScore, priority: scheduling.searchPriority, schedulingTier: schedulingTierForPivot({ clueType, derivation: pivot.derivation, evidenceAdmitted: resultDiagnostic.evidenceAdmissionDecision === "EVIDENCE_ADMITTED", directStemEvidence: Boolean(item.requiredResultIdentifier), identifierStrength: admittedRelation }) });
        if (clueType === "person_name") precedingPersonClues.push(pivot.value);
      }
    }
    // A derived stem can justify one bounded discovery continuation, but its
    // repetition never supplies the independent evidence needed for attribution.
    if (item.requiredResultIdentifier && item.hop < limits.maxHops - 1 && assessedResults.some(({ diagnostic }) => diagnostic.discoveryAdmissionDecision === "DISCOVERY_ADMITTED")) {
      const continuationId = normalizeIdentifier(item.requiredResultIdentifier);
      if (continuedDirectPivots.has(continuationId)) {
        schedulingDiagnostics.push({ pivot: item.label, clueType: item.clueType, hop: item.hop + 1, decision: "skipped", reason: "evidence_continuation_deduplicated", remainingSearchBudget: limits.maxSearches - searchCount });
      } else {
        continuedDirectPivots.add(continuationId);
        const activeScheduling = schedulingFields({ type: item.clueType, value: item.label, derivation: "explicit_handle", originalOverlap: true, distanceFromRoot: item.hop + 1, independentAnchorCount: 1, strongAnchor: true });
        pendingIdentifiers.push({ id: continuationId, label: item.label, hop: item.hop + 1, path: [...item.path, item.label], identifierStrength: "discovery_lead", exactSource: false, order: observationOrder++, derivation: "explicit_handle", clueType: item.clueType, adjacentLabels: [...item.path], qualityScore: activeScheduling.qualityScore, priority: activeScheduling.searchPriority, schedulingTier: 2, evidenceContinuation: true });
        schedulingDiagnostics.push({ pivot: item.label, clueType: item.clueType, hop: item.hop + 1, decision: "created", reason: "evidence_continuation_created", remainingSearchBudget: limits.maxSearches - searchCount });
      }
    }
    const identifiersAfter = new Set(edges.filter((edge) => edge.relation !== "search_result").map((edge) => edge.to));
    const newIdentifiers = [...identifiersAfter].filter((id) => !identifiersBefore.has(id));
    if (item.queryPass === 0 && item.schedulingGeneration !== undefined) for (const queued of queue) {
      if (queued.id === item.id && queued.schedulingGeneration === item.schedulingGeneration) queued.firstPassProducedIdentifiers = newIdentifiers.length > 0;
    }
    const sourceClasses = [...new Set(results.map((result) => sourceClassFor(result.url)))];
    searches.push({ query: item.query, hop: item.hop, pivot: item.label, schedulingGeneration: item.schedulingGeneration ?? -1, queryPass: item.queryPass ?? 0, originalTargetContext: { email: normalized, localPart, domain }, resultCount: results.length, producedNewIdentifiers: newIdentifiers.length > 0, newIdentifiers, clueType: item.clueType, clueQualityScore: item.qualityScore, searchPriority: item.priority, remainingBudget: limits.maxSearches - searchCount, informationGain: newIdentifiers.length, searchIntent: item.intent, sourceClasses, extractedEntityClues: newIdentifiers, prioritizationReason: item.hop === 0 ? "Reserved seed search for a strong submitted identifier." : `Corroborated ${item.clueType} pivot. Sibling rank ${item.siblingRank || 1}.`, pivotStrength: activeClue.pivotStrength, pivotAdmissionDecision: activeClue.pivotAdmissionDecision, pivotAdmissionReason: activeClue.pivotAdmissionReason, distanceFromRoot: activeClue.distanceFromRoot, independentAnchorCount: activeClue.independentAnchorCount, results: resultDiagnostics });
    if (newIdentifiers.length === 0 && item.hop > 0) for (const queued of queue) if (queued.id === item.id) queued.priority -= 20;
    if (item.hop === 0) {
      seedSearchesRemaining -= 1;
      if (seedSearchesRemaining === 0 || !queue.some((queued) => queued.hop === 0)) enqueuePending();
    } else enqueuePending();
    // A reserve protects expansion work when clues exist. Once the expansion
    // queue reaches closure, return unused capacity to the omitted seed plan.
    if (queue.length === 0 && omittedSeeds.length > 0) { const fallbackSeeds = omittedSeeds.splice(0); fallbackSeeds.forEach((seed) => schedulingDiagnostics.push({ pivot: seed.label, clueType: seed.clueType, hop: seed.hop, query: seed.query, decision: "scheduled", reason: "seed_plan", remainingSearchBudget: limits.maxSearches - searchCount })); queue.push(...fallbackSeeds); }
  }
  for (const skipped of queue) { schedulingDiagnostics.push({ pivot: skipped.label, clueType: skipped.clueType, hop: skipped.hop, query: skipped.query, schedulingGeneration: skipped.schedulingGeneration, queryPass: skipped.queryPass, decision: "skipped", reason: searchCount >= limits.maxSearches ? "search_budget" : "closure", remainingSearchBudget: limits.maxSearches - searchCount }); const clue = clues.get(`${skipped.clueType}:${normalizeIdentifier(skipped.label)}`); if (clue) clue.queriesSkipped.push(skipped.query); }
  const convergences: EntityConvergence[] = [...clues.values()].filter((clue) => clue.observedBy.length > 1).map((clue) => ({ clueId: clue.id, convergingPaths: [clue.discoveryPath], sharedIdentifiers: [clue.normalizedValue], loopStrength: Math.min(100, clue.observedBy.length * 20), sourceClasses: [...new Set(clue.observedBy.map((observation) => sourceClassFor(observation.split("|").at(-1) || "")))] }));
  for (const candidate of candidates.values()) { const handle = socialUrlHandle(candidate.profileUrl); const convergence = convergences.find((item) => item.sharedIdentifiers.includes(normalizeIdentifier(handle || ""))); if (convergence) Object.assign(candidate, convergence, { discoveryScore: (candidate.discoveryScore || 0) + convergence.loopStrength }); }
  const ranked = rankExternalIdentityCandidates(submittedSignals, [...candidates.values()]);
  const pathUrls = new Set(edges.filter((edge) => edge.relation !== "search_result").map((edge) => edge.from));
  const visible = ranked.filter((candidate, index) => candidate.confidence >= 45 || pathUrls.has(candidate.profileUrl) || index < 3).slice(0, limits.maxVisibleCandidates).map((candidate, index) => ({ ...candidate, resolutionRank: index + 1 }));
  const anyAdmissible = searches.some((entry) => entry.results.some((result) => result.discoveryAdmissionDecision === "DISCOVERY_ADMITTED"));
  const budgetExhaustionReason = signal.aborted ? "timeout" : searchCount >= limits.maxSearches && queue.length ? "max_searches" : identifierCount >= limits.maxIdentifiers && pendingIdentifiers.length ? "max_identifiers" : !anyAdmissible && searches.some((entry) => entry.resultCount > 0) ? "no_admissible_leads" : "closure_reached";
  return { candidates: visible, allCandidates: ranked, clues: [...clues.values()], convergences, edges, searches, schedulingDiagnostics, metrics: { searchCount, identifierCount, maxHopReached: edges.reduce((max, edge) => Math.max(max, edge.hop), 0), partial: signal.aborted, budgetExhaustionReason, reservedExpansionSearches: limits.reservedExpansionSearches, seedSearchCount: seedQueue.length - Math.max(0, seedQueue.length - seedSearchLimit) } };
}
export async function discoverExternalIdentityCandidates(email: string, apiKey: string, signal: AbortSignal) { return (await discoverExternalIdentityGraph(email, apiKey, signal)).candidates; }

export class EmailIntelligenceProvider extends BaseProvider { readonly id = "email-intelligence"; readonly name = "Email Intelligence"; readonly version = "1.1.0"; readonly category = "business_profile" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const email = emailFromContext(context); if (!email) throw new Error("Email intelligence requires an email target."); const domain = email.split("@")[1]; const publicMailbox = isPublicMailboxDomain(domain); return { findings: [], evidence: [{ id: "email-target-classification", type: "placeholder", label: "Mailbox classification", value: publicMailbox ? "Public mailbox provider" : "Corporate/custom domain candidate", source: "submitted-target", investigationId: context.investigationId || context.intakeId, canonicalTarget: email, providerName: this.name, collectedAt: new Date().toISOString() }], metadata: { lookupPerformed: true, submittedEmail: email, emailDomain: domain, publicMailbox, evidenceIndependence: "submitted_input_only" } }; } }
export class ExternalIdentityProvider extends BaseProvider { readonly id = "external-identity"; readonly name = "External Identity Discovery"; readonly version = "4.1.0"; readonly category = "business_profile" as const; failureReason(error: unknown): ProviderFailureReason { if (error instanceof Error && /BRAVE_SEARCH_API_KEY|credential|not configured|provider unavailable/i.test(error.message)) return "Unavailable"; return super.failureReason(error); } protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const email = emailFromContext(context); if (!email) throw new Error("External identity discovery requires an email target."); const apiKey = process.env.BRAVE_SEARCH_API_KEY; if (!apiKey) throw new Error("External identity provider unavailable: BRAVE_SEARCH_API_KEY is not configured."); const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8_000); try { const metadata = context.resolvedEntity?.metadata || {};
    const textSignal = (key: string) => typeof metadata[key] === "string" ? String(metadata[key]).trim() || undefined : undefined;
    const graph = await discoverExternalIdentityGraph(email, apiKey, controller.signal, { signals: {
      name: context.identitySignals?.names[0] || context.resolvedEntity?.canonicalName || textSignal("name"),
      username: context.identitySignals?.usernames[0] || textSignal("username") || textSignal("handle"),
      phone: context.identitySignals?.phones[0] || textSignal("phone") || textSignal("phoneNumber"),
    } }); const evidence: ProviderEvidence[] = graph.candidates.map((candidate, index) => ({ id: `external-identity-${index + 1}`, type: "search_result", label: candidate.matchLevel === "unverified_candidate" ? "Potential public identity candidate" : "Public identity exact-email match", value: `${candidate.platform} | profile ${candidate.profileUrl} | status ${candidate.status} | matched ${candidate.matchedIdentifiers.join(", ")} | identity attribution ${candidate.identityAttributionConfidence === null ? "Unverified" : `${candidate.identityAttributionConfidence}%`} | candidate score ${candidate.candidateDiscoveryConfidence}% | path ${candidate.discoveryPath.join(" -> ")} | ${candidate.matchBasis}`, source: candidate.evidenceUrl, investigationId: context.investigationId || context.intakeId, canonicalTarget: email, providerName: this.name, collectedAt: new Date().toISOString() })); return { findings: [], evidence, metadata: { lookupPerformed: true, submittedEmail: email, candidateCount: graph.candidates.length, externalIdentityCandidates: graph.candidates, entityClues: graph.clues, entityConvergences: graph.convergences, identityDiscoveryEdges: graph.edges, identityDiscoverySearches: graph.searches, identitySchedulingDiagnostics: graph.schedulingDiagnostics, identityDiscoveryMetrics: graph.metrics, evidencePolicy: "Submitted input is not independent corroboration. Discovery leads cannot establish identity facts. Candidate status requires external evidence. Verification requires independent primary evidence." } }; } finally { clearTimeout(timeout); } } }
