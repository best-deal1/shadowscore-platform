import { BaseProvider } from "./BaseProvider";
import type { ProviderEvidence, ProviderExecutionContext, ProviderFailureReason, ProviderResult } from "./types";
import { isPublicMailboxDomain } from "../emailDomains";

const SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const SOCIAL_HOSTS: Record<string, string> = { "facebook.com": "Facebook", "instagram.com": "Instagram", "linkedin.com": "LinkedIn", "x.com": "X", "twitter.com": "X", "tiktok.com": "TikTok", "github.com": "GitHub", "youtube.com": "YouTube" };

export type IdentityDiscoveryLimits = { maxHops: number; maxIdentifiers: number; maxSearches: number; maxResultsPerSearch: number; maxVisibleCandidates: number };
export const DEFAULT_IDENTITY_DISCOVERY_LIMITS: IdentityDiscoveryLimits = { maxHops: 3, maxIdentifiers: 12, maxSearches: 12, maxResultsPerSearch: 10, maxVisibleCandidates: 8 };
export type EntityClueType = "person_name" | "username" | "social_profile" | "email" | "domain" | "company_name" | "unknown";
export type EntityClue = {
  id: string; type: EntityClueType; normalizedValue: string; displayValue: string; source: string;
  discoveryPath: string[]; hop: number; derivation: "submitted" | DiscoveryPivot["derivation"] | "director" | "domain" | "company";
  evidenceStrength: "lead" | "observed" | "strong"; attributionState: "discovery" | "corroborated" | "verified";
  adjacentClueIds: string[]; observedBy: string[];
};
export type EntityConvergence = { clueId: string; convergingPaths: string[][]; sharedIdentifiers: string[]; loopStrength: number };
export type IdentityDiscoveryEdge = {
  from: string; to: string; relation: "search_result" | "discovery_lead" | "corroborated_identifier" | "verified_identifier"; hop: number;
  evidence: { query: string; url: string; snippet: string; provider: "Brave Search"; derivation?: "explicit_assertion" | "social_url" | "explicit_handle" | "display_name" | "title" };
};
export type ExternalIdentityCandidate = {
  platform: string; profileUrl: string; observedDisplayName?: string; matchedIdentifiers: string[];
  matchType: "exact_email" | "username" | "alias"; status: "Candidate" | "Corroborated" | "Verified";
  matchLevel: "exact_match" | "unverified_candidate"; matchBasis: string; confidence: number;
  evidenceUrl: string; evidenceQuery: string; evidenceSnippet: string; methods: string[];
  sourceProvider: "Brave Search"; evidenceReference: string; discoveryPath: string[];
  supportingEvidence: Array<{ query: string; snippet: string; url: string; hop: number }>;
  discoveryScore?: number;
  convergingPaths?: string[][]; sharedIdentifiers?: string[]; loopStrength?: number;
};
export type IdentityDiscoverySearchDiagnostic = {
  query: string; hop: number; pivot: string; originalTargetContext: { email: string; localPart: string; domain: string };
  resultCount: number; producedNewIdentifiers: boolean; newIdentifiers: string[];
};
type SearchResult = { title: string; url: string; description?: string };
type SearchFn = (query: string, apiKey: string, signal: AbortSignal, limit: number) => Promise<SearchResult[]>;
export type EntityInvestigationSeed = { type: EntityClueType; value: string };
export type EntityRelationship = { from: string; to: string; relationship: "resolved_as" | "director" | "domain" | "related_entity"; discoveryPath: string[] };

/** Generic bounded loop used for non-email entity investigations and provider adapters. */
export async function investigateEntityClues(seed: EntityInvestigationSeed, search: (query: string, clue: EntityClue) => Promise<SearchResult[]>, limits: Pick<IdentityDiscoveryLimits, "maxHops" | "maxIdentifiers" | "maxSearches"> = DEFAULT_IDENTITY_DISCOVERY_LIMITS) {
  const seedValue = seed.value.trim(); const seedId = `${seed.type}:${normalizeIdentifier(seedValue)}`;
  const clues = new Map<string, EntityClue>(); const relationships: EntityRelationship[] = []; const diagnostics: Array<Omit<IdentityDiscoverySearchDiagnostic, "originalTargetContext">> = [];
  const queue: EntityClue[] = [{ id: seedId, type: seed.type, normalizedValue: normalizeIdentifier(seedValue), displayValue: seedValue, source: "submitted-target", discoveryPath: [seedValue], hop: 0, derivation: "submitted", evidenceStrength: "strong", attributionState: "verified", adjacentClueIds: [], observedBy: ["submitted-target"] }];
  clues.set(seedId, queue[0]); let searchCount = 0;
  const patterns: Array<{ type: EntityClueType; relationship: EntityRelationship["relationship"]; derivation: EntityClue["derivation"]; expression: RegExp }> = [
    { type: "company_name", relationship: "resolved_as", derivation: "company", expression: /(?:legal company|company)\s*:\s*([^|;]+)/gi },
    { type: "person_name", relationship: "director", derivation: "director", expression: /director\s*:\s*([^|;]+)/gi },
    { type: "domain", relationship: "domain", derivation: "domain", expression: /(?:domain|website)\s*:\s*((?:[\p{L}\p{N}-]+\.)+[\p{L}\p{N}-]+)/giu },
    { type: "company_name", relationship: "related_entity", derivation: "company", expression: /related (?:company|entity)\s*:\s*([^|;]+)/gi },
  ];
  while (queue.length && searchCount < limits.maxSearches && clues.size < limits.maxIdentifiers) {
    const clue = queue.shift()!; if (clue.hop >= limits.maxHops) continue;
    const neighbors = clue.adjacentClueIds.map((id) => clues.get(id)?.displayValue).filter(Boolean) as string[];
    const query = [clue.displayValue, ...neighbors.slice(0, 2)].map((value) => `"${value.replace(/["\\]/g, " ")}"`).join(" ");
    const results = await search(query, clue); searchCount += 1; const produced: string[] = [];
    for (const result of results) {
      const text = `${result.title} | ${result.description || ""}`;
      for (const pattern of patterns) for (const match of text.matchAll(new RegExp(pattern.expression.source, pattern.expression.flags))) {
        const value = match[1].trim(); const id = `${pattern.type}:${normalizeIdentifier(value)}`; const path = [...clue.discoveryPath, value];
        relationships.push({ from: clue.id, to: id, relationship: pattern.relationship, discoveryPath: path });
        const prior = clues.get(id);
        if (prior) { prior.observedBy = [...new Set([...prior.observedBy, `${query}|${result.url}`])]; prior.adjacentClueIds = [...new Set([...prior.adjacentClueIds, clue.id])]; continue; }
        const next: EntityClue = { id, type: pattern.type, normalizedValue: normalizeIdentifier(value), displayValue: value, source: result.url, discoveryPath: path, hop: clue.hop + 1, derivation: pattern.derivation, evidenceStrength: "observed", attributionState: "discovery", adjacentClueIds: [clue.id, ...clue.adjacentClueIds], observedBy: [`${query}|${result.url}`] };
        clues.set(id, next); produced.push(value); if (next.hop < limits.maxHops) queue.push(next);
      }
    }
    diagnostics.push({ query, hop: clue.hop, pivot: clue.displayValue, resultCount: results.length, producedNewIdentifiers: produced.length > 0, newIdentifiers: produced });
  }
  const convergences = [...clues.values()].filter((clue) => clue.observedBy.length > 1).map((clue) => ({ clueId: clue.id, convergingPaths: relationships.filter((edge) => edge.to === clue.id).map((edge) => edge.discoveryPath), sharedIdentifiers: [clue.normalizedValue], loopStrength: Math.min(100, clue.observedBy.length * 20) }));
  const budgetExhaustionReason = searchCount >= limits.maxSearches && queue.length ? "max_searches" : clues.size >= limits.maxIdentifiers && queue.length ? "max_identifiers" : "closure_reached";
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
function publicSearchEvidenceUrl(query: string) { const url = new URL("https://search.brave.com/search"); url.searchParams.set("q", query); return url.toString(); }
function normalizeIdentifier(value: string) { return value.trim().replace(/^@/, "").replace(/\s+/g, " ").toLowerCase(); }
const NOISE_IDENTIFIERS = new Set(["about", "account", "accounts", "author", "candidate", "contact", "directory", "discover", "explore", "facebook", "for you", "github", "home", "instagram", "linkedin", "login", "member", "official", "page", "people", "photos", "profile", "public profile", "search", "signin", "signup", "social", "tiktok", "twitter", "user", "username", "videos", "watch", "youtube"]);
function usefulIdentifier(value: string, original: Set<string>) {
  const normalized = normalizeIdentifier(value);
  return normalized.length >= 3 && normalized.length <= 60 && !original.has(normalized)
    && !NOISE_IDENTIFIERS.has(normalized)
    && !/^(?:www\.)?[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+(?:\/.*)?$/iu.test(normalized)
    && !/^https?:|^[\W_]+$/iu.test(normalized)
    && !/^(?:(?:facebook|instagram|linkedin|tiktok|twitter|github|youtube)\s+)?(?:public\s+)?profile(?:\s+[a-z])?$|^unrelated(?:\s+(?:user|account|profile))?$/i.test(normalized)
    && !/^(?:log\s*in|sign\s*(?:in|up)|search results?|click here|learn more)$/i.test(normalized);
}
function containsIdentifier(text: string, identifier: string) {
  const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}_.-])@?${escaped}($|[^\\p{L}\\p{N}_.-])`, "iu").test(text);
}
type DiscoveryPivot = { value: string; type?: EntityClueType; relation: "discovery_lead" | "corroborated_identifier"; derivation: "explicit_assertion" | "social_url" | "explicit_handle" | "display_name" | "title" };
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
    .replace(/\s*[|·\-–:]\s*(?:Facebook|Instagram|LinkedIn|TikTok|Twitter|X|GitHub|YouTube)(?:\s*(?:profile|account))?\s*$/i, "")
    .replace(/\s*[|·\-–:]\s*(?:profile|public profile|official site)\s*$/i, "")
    .replace(/^(?:profile|public profile)(?:\s+(?:for|of))?\s*[:\-]?\s*/i, "")
    .trim();
}
function titleAliases(title: string) {
  const cleaned = titleLead(title).replace(/\s+[–—-]\s+.*$/, "").trim();
  const parts = cleaned.split(/\s*[|·:]\s*/).flatMap((part) => part.split(/\s+/));
  const aliases = parts.map((part) => part.replace(/^[^\p{L}\p{N}_@]+|[^\p{L}\p{N}_.@-]+$/gu, "")).filter(Boolean);
  return [...new Set(aliases)].filter((alias) => !NOISE_IDENTIFIERS.has(normalizeIdentifier(alias)) && /^[\p{L}\p{N}_@.-]{3,30}$/u.test(alias)).slice(0, 3);
}
function observedIdentifiers(hit: SearchResult, originals: Set<string>) {
  const text = `${hit.title} ${hit.description || ""}`;
  const explicit = [...text.matchAll(/\b(?:alias|aka|handle|username|known as)\s*[:\-]?\s*["']?(@?[\p{L}\p{N}_. -]{3,40})["']?/giu)]
    .map((match) => match[1].trim().replace(/[.,;:]$/, ""));
  const handles = [...text.matchAll(/(^|[^\p{L}\p{N}_.])@([\p{L}\p{N}][\p{L}\p{N}_.-]{2,39})\b/giu)].map((match) => match[2]);
  const urlHandle = socialUrlHandle(hit.url);
  const aliases = titleAliases(hit.title);
  const pivots: DiscoveryPivot[] = [
    ...explicit.map((value) => ({ value, type: "person_name" as const, relation: "corroborated_identifier" as const, derivation: "explicit_assertion" as const })),
    ...(urlHandle ? [{ value: urlHandle, type: "username" as const, relation: "discovery_lead" as const, derivation: "social_url" as const }] : []),
    ...handles.map((value) => ({ value, type: "username" as const, relation: "discovery_lead" as const, derivation: "explicit_handle" as const })),
    ...aliases.map((value) => ({ value, type: "person_name" as const, relation: "discovery_lead" as const, derivation: "display_name" as const })),
  ];
  const seen = new Set<string>();
  return pivots.filter((pivot) => {
    const id = normalizeIdentifier(pivot.value);
    if (!usefulIdentifier(pivot.value, originals) || seen.has(id)) return false;
    seen.add(id); return true;
  }).slice(0, 5);
}
async function braveSearch(query: string, apiKey: string, signal: AbortSignal, limit: number): Promise<SearchResult[]> { const url = new URL(SEARCH_ENDPOINT); url.searchParams.set("q", query); url.searchParams.set("count", String(limit)); url.searchParams.set("safesearch", "strict"); const response = await fetch(url, { signal, headers: { accept: "application/json", "x-subscription-token": apiKey } }); if (!response.ok) throw new Error(`Public search returned HTTP ${response.status}.`); const payload = await response.json() as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } }; return (payload.web?.results || []).filter((item): item is SearchResult => Boolean(item.title && item.url)).slice(0, limit); }

type QueueItem = { id: string; label: string; hop: number; path: string[]; query: string; method: string; identifierStrength?: "discovery_lead" | "corroborated_identifier" };
type PendingIdentifier = Omit<QueueItem, "query" | "method"> & { exactSource: boolean; order: number; derivation: DiscoveryPivot["derivation"]; clueType: EntityClueType; adjacentLabels: string[] };

function contextualQueries(pivot: PendingIdentifier, localPart: string) {
  const value = pivot.label.replace(/["\\]/g, " ").trim();
  const neighbors = [...new Set([localPart, ...pivot.adjacentLabels])].filter((item) => normalizeIdentifier(item) !== normalizeIdentifier(value)).slice(0, 3);
  const queries = [
    ...neighbors.map((neighbor) => ({ query: `"${value}" "${neighbor.replace(/["\\]/g, " ")}"`, method: `${pivot.identifierStrength}_graph_neighbor` })),
    { query: `site:instagram.com "${value}" "${neighbors[0] || localPart}"`, method: `${pivot.identifierStrength}_social_context` },
  ];
  if (pivot.derivation === "social_url" || pivot.derivation === "explicit_handle") queries.push({ query: `"${value}" Instagram OR TikTok`, method: `${pivot.identifierStrength}_platform_context` });
  return queries;
}

export async function discoverExternalIdentityGraph(email: string, apiKey: string, signal: AbortSignal, options: { limits?: Partial<IdentityDiscoveryLimits>; search?: SearchFn } = {}) {
  const limits = { ...DEFAULT_IDENTITY_DISCOVERY_LIMITS, ...options.limits };
  const search = options.search || braveSearch;
  const normalized = email.trim().toLowerCase(); const localPart = normalized.split("@")[0]; const domain = normalized.split("@")[1];
  const originals = new Set([normalized, normalizeIdentifier(localPart), normalizeIdentifier(domain)]);
  const queue: QueueItem[] = [
    { id: normalized, label: normalized, hop: 0, path: [normalized], query: `"${normalized}"`, method: "exact_email" },
    { id: normalized, label: normalized, hop: 0, path: [normalized], query: `"${normalized}" profile OR social`, method: "exact_email_profile" },
    { id: localPart, label: localPart, hop: 0, path: [normalized], query: `"${localPart}" profile`, method: "username_profile" },
    { id: localPart, label: localPart, hop: 0, path: [normalized], query: `"${localPart}" site:facebook.com OR site:instagram.com OR site:linkedin.com OR site:x.com OR site:tiktok.com`, method: "social_profile" },
  ];
  const searched = new Set<string>(); const queuedIdentifiers = new Set<string>(); const candidates = new Map<string, ExternalIdentityCandidate>();
  const clues = new Map<string, EntityClue>();
  const edges: IdentityDiscoveryEdge[] = []; const pendingIdentifiers: PendingIdentifier[] = [];
  const searches: IdentityDiscoverySearchDiagnostic[] = [];
  let searchCount = 0; let identifierCount = 2; let observationOrder = 0; let seedSearchesRemaining = queue.length;
  const addClue = (clue: EntityClue) => {
    const prior = clues.get(clue.id);
    if (!prior) { clues.set(clue.id, clue); return; }
    prior.observedBy = [...new Set([...prior.observedBy, ...clue.observedBy])];
    prior.adjacentClueIds = [...new Set([...prior.adjacentClueIds, ...clue.adjacentClueIds])];
    if (!prior.discoveryPath.some((step, index) => step !== clue.discoveryPath[index])) return;
  };
  addClue({ id: `email:${normalized}`, type: "email", normalizedValue: normalized, displayValue: normalized, source: "submitted-target", discoveryPath: [normalized], hop: 0, derivation: "submitted", evidenceStrength: "strong", attributionState: "verified", adjacentClueIds: [`username:${localPart}`, `domain:${domain}`], observedBy: ["submitted-target"] });
  addClue({ id: `username:${localPart}`, type: "username", normalizedValue: normalizeIdentifier(localPart), displayValue: localPart, source: "submitted-target", discoveryPath: [normalized, localPart], hop: 0, derivation: "submitted", evidenceStrength: "observed", attributionState: "discovery", adjacentClueIds: [`email:${normalized}`], observedBy: ["submitted-target"] });
  addClue({ id: `domain:${domain}`, type: "domain", normalizedValue: domain, displayValue: domain, source: "submitted-target", discoveryPath: [normalized, domain], hop: 0, derivation: "submitted", evidenceStrength: "observed", attributionState: "discovery", adjacentClueIds: [`email:${normalized}`], observedBy: ["submitted-target"] });

  const enqueuePending = () => {
    const derivationPriority = (value: PendingIdentifier["derivation"]) => value === "explicit_assertion" ? 0 : value === "display_name" ? 1 : value === "explicit_handle" ? 2 : 3;
    pendingIdentifiers.sort((a, b) => Number(b.exactSource) - Number(a.exactSource) || derivationPriority(a.derivation) - derivationPriority(b.derivation) || a.order - b.order);
    const accepted: Array<{ item: PendingIdentifier; variants: ReturnType<typeof contextualQueries> }> = [];
    for (const item of pendingIdentifiers.splice(0)) {
      const id = normalizeIdentifier(item.id);
      if (queuedIdentifiers.has(id) || identifierCount >= limits.maxIdentifiers) continue;
      queuedIdentifiers.add(id); identifierCount += 1;
      accepted.push({ item, variants: contextualQueries(item, localPart) });
    }
    for (let variantIndex = 0; variantIndex < 3; variantIndex += 1) for (const { item, variants } of accepted) {
      const variant = variants[variantIndex]; if (variant) queue.push({ ...item, ...variant });
    }
  };

  while (queue.length && searchCount < limits.maxSearches) {
    const item = queue.shift()!;
    const expansionKey = `${item.hop}:${normalizeIdentifier(item.query)}`;
    if (searched.has(expansionKey)) continue;
    searched.add(expansionKey); searchCount += 1;
    let results: SearchResult[];
    try {
      results = await search(item.query, apiKey, signal, limits.maxResultsPerSearch);
    } catch (error) {
      if (signal.aborted || (error instanceof Error && error.name === "AbortError")) break;
      throw error;
    }
    const identifiersBefore = new Set(edges.filter((edge) => edge.relation !== "search_result").map((edge) => edge.to));
    for (const hit of results) {
      const platform = platformFor(hit.url); if (!platform) continue;
      const profileUrl = identityProfileUrl(hit.url); if (!profileUrl) continue;
      const snippet = `${hit.title}${hit.description ? ` - ${hit.description}` : ""}`.trim();
      const currentExact = containsExactEmailToken(snippet, normalized);
      // A second-hop result must repeat the searched identifier in its own preserved evidence.
      if (item.hop > 0 && !containsIdentifier(snippet, item.label)) continue;
      const prior = candidates.get(profileUrl); const exact = currentExact || prior?.matchLevel === "exact_match";
      const observation = { query: item.query, snippet, url: publicSearchEvidenceUrl(item.query), hop: item.hop };
      const supportingEvidence = [...(prior?.supportingEvidence || []), observation];
      const observedMatches = [...(prior?.matchedIdentifiers || [])];
      if (currentExact) observedMatches.push(normalized);
      else if (item.hop > 0 && item.identifierStrength === "corroborated_identifier" && containsIdentifier(snippet, item.label)) observedMatches.push(normalizeIdentifier(item.label));
      const identifiers = [...new Set(observedMatches)];
      const contextOverlap = Number(containsIdentifier(snippet, localPart)) + Number(containsIdentifier(snippet, item.label));
      const profileQuality = socialUrlHandle(profileUrl) ? 2 : 1;
      const pathRelevance = Math.max(0, 3 - item.hop);
      const discoveryScore = (exact ? 100 : 0) + contextOverlap * 12 + profileQuality * 5 + pathRelevance * 3;
      const confidence = Math.max(prior?.confidence || 0, exact ? 75 : item.hop > 0 ? 25 : 30);
      const selectedCurrent = currentExact || !prior || (prior.matchLevel !== "exact_match" && confidence > prior.confidence);
      const path = [...item.path, `${platform} ${hit.title}`];
      candidates.set(profileUrl, {
        platform, profileUrl,
        observedDisplayName: prior?.observedDisplayName || (hit.title && !containsExactEmailToken(hit.title, normalized) ? hit.title.trim() : undefined),
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
        discoveryScore: Math.max(prior?.discoveryScore || 0, discoveryScore),
        matchBasis: exact
          ? "The exact submitted email appears in public search evidence for this profile. The result remains a candidate until an independent source corroborates it."
          : item.hop
            ? `The explicit identifier “${item.label}” appears in this result and in the prior result on the preserved discovery path. This is an unverified lead.`
            : "The submitted email local-part generated this public profile candidate. Candidate only, not verified identity.",
      });
      edges.push({ from: item.id, to: profileUrl, relation: "search_result", hop: item.hop, evidence: { query: item.query, url: observation.url, snippet, provider: "Brave Search" } });
      if (item.hop >= limits.maxHops - 1) continue;
      const pivots = observedIdentifiers(hit, originals); const precedingPersonClues: string[] = [];
      for (const pivot of pivots) {
        const id = normalizeIdentifier(pivot.value);
        const evidence = { query: item.query, url: observation.url, snippet, provider: "Brave Search" as const, derivation: pivot.derivation };
        // Preserve every observation edge. Search execution is deduplicated separately.
        edges.push({ from: profileUrl, to: id, relation: pivot.relation, hop: item.hop + 1, evidence });
        const clueType = pivot.type || "unknown"; const clueId = `${clueType}:${id}`;
        const adjacentLabels = [...new Set([item.label, ...item.path.filter((step) => !/^https?:/i.test(step)).map((step) => step.replace(/^.*“|”$/g, ""))])].slice(-4);
        const cluePath = clueType === "person_name" ? [...item.path, ...precedingPersonClues, pivot.value] : [...path, pivot.value];
        addClue({ id: clueId, type: clueType, normalizedValue: id, displayValue: pivot.value, source: profileUrl, discoveryPath: cluePath, hop: item.hop + 1, derivation: pivot.derivation, evidenceStrength: pivot.relation === "corroborated_identifier" ? "strong" : "observed", attributionState: pivot.relation === "corroborated_identifier" ? "corroborated" : "discovery", adjacentClueIds: [item.id], observedBy: [`${item.query}|${profileUrl}`] });
        pendingIdentifiers.push({ id, label: pivot.value, hop: item.hop + 1, path: cluePath, identifierStrength: pivot.relation, exactSource: exact, order: observationOrder++, derivation: pivot.derivation, clueType, adjacentLabels: [...adjacentLabels, ...precedingPersonClues] });
        if (clueType === "person_name") precedingPersonClues.push(pivot.value);
      }
    }
    const identifiersAfter = new Set(edges.filter((edge) => edge.relation !== "search_result").map((edge) => edge.to));
    const newIdentifiers = [...identifiersAfter].filter((id) => !identifiersBefore.has(id));
    searches.push({ query: item.query, hop: item.hop, pivot: item.label, originalTargetContext: { email: normalized, localPart, domain }, resultCount: results.length, producedNewIdentifiers: newIdentifiers.length > 0, newIdentifiers });
    if (item.hop === 0) {
      seedSearchesRemaining -= 1;
      if (seedSearchesRemaining === 0 || !queue.some((queued) => queued.hop === 0)) enqueuePending();
    } else enqueuePending();
  }
  const convergences: EntityConvergence[] = [...clues.values()].filter((clue) => clue.observedBy.length > 1).map((clue) => ({ clueId: clue.id, convergingPaths: [clue.discoveryPath], sharedIdentifiers: [clue.normalizedValue], loopStrength: Math.min(100, clue.observedBy.length * 20) }));
  for (const candidate of candidates.values()) { const handle = socialUrlHandle(candidate.profileUrl); const convergence = convergences.find((item) => item.sharedIdentifiers.includes(normalizeIdentifier(handle || ""))); if (convergence) Object.assign(candidate, convergence, { discoveryScore: (candidate.discoveryScore || 0) + convergence.loopStrength }); }
  const ranked = [...candidates.values()].sort((a, b) => Number(b.matchLevel === "exact_match") - Number(a.matchLevel === "exact_match") || (b.discoveryScore || 0) - (a.discoveryScore || 0) || b.confidence - a.confidence || a.profileUrl.localeCompare(b.profileUrl));
  const pathUrls = new Set(edges.filter((edge) => edge.relation !== "search_result").map((edge) => edge.from));
  const visible = ranked.filter((candidate, index) => candidate.confidence >= 45 || pathUrls.has(candidate.profileUrl) || index < 3).slice(0, limits.maxVisibleCandidates);
  const budgetExhaustionReason = signal.aborted ? "timeout" : searchCount >= limits.maxSearches && queue.length ? "max_searches" : identifierCount >= limits.maxIdentifiers && pendingIdentifiers.length ? "max_identifiers" : "closure_reached";
  return { candidates: visible, allCandidates: ranked, clues: [...clues.values()], convergences, edges, searches, metrics: { searchCount, identifierCount, maxHopReached: edges.reduce((max, edge) => Math.max(max, edge.hop), 0), partial: signal.aborted, budgetExhaustionReason } };
}
export async function discoverExternalIdentityCandidates(email: string, apiKey: string, signal: AbortSignal) { return (await discoverExternalIdentityGraph(email, apiKey, signal)).candidates; }

export class EmailIntelligenceProvider extends BaseProvider { readonly id = "email-intelligence"; readonly name = "Email Intelligence"; readonly version = "1.1.0"; readonly category = "business_profile" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const email = emailFromContext(context); if (!email) throw new Error("Email intelligence requires an email target."); const domain = email.split("@")[1]; const publicMailbox = isPublicMailboxDomain(domain); return { findings: [], evidence: [{ id: "email-target-classification", type: "placeholder", label: "Mailbox classification", value: publicMailbox ? "Public mailbox provider" : "Corporate/custom domain candidate", source: "submitted-target", investigationId: context.investigationId || context.intakeId, canonicalTarget: email, providerName: this.name, collectedAt: new Date().toISOString() }], metadata: { lookupPerformed: true, submittedEmail: email, emailDomain: domain, publicMailbox, evidenceIndependence: "submitted_input_only" } }; } }
export class ExternalIdentityProvider extends BaseProvider { readonly id = "external-identity"; readonly name = "External Identity Discovery"; readonly version = "4.0.0"; readonly category = "business_profile" as const; failureReason(error: unknown): ProviderFailureReason { if (error instanceof Error && /BRAVE_SEARCH_API_KEY|credential|not configured|provider unavailable/i.test(error.message)) return "Unavailable"; return super.failureReason(error); } protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const email = emailFromContext(context); if (!email) throw new Error("External identity discovery requires an email target."); const apiKey = process.env.BRAVE_SEARCH_API_KEY; if (!apiKey) throw new Error("External identity provider unavailable: BRAVE_SEARCH_API_KEY is not configured."); const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8_000); try { const graph = await discoverExternalIdentityGraph(email, apiKey, controller.signal); const evidence: ProviderEvidence[] = graph.candidates.map((candidate, index) => ({ id: `external-identity-${index + 1}`, type: "search_result", label: candidate.matchLevel === "unverified_candidate" ? "Potential public identity candidate" : "Public identity exact-email match", value: `${candidate.platform} | profile ${candidate.profileUrl} | status ${candidate.status} | matched ${candidate.matchedIdentifiers.join(", ")} | confidence ${candidate.confidence}% | path ${candidate.discoveryPath.join(" -> ")} | ${candidate.matchBasis}`, source: candidate.evidenceUrl, investigationId: context.investigationId || context.intakeId, canonicalTarget: email, providerName: this.name, collectedAt: new Date().toISOString() })); return { findings: [], evidence, metadata: { lookupPerformed: true, submittedEmail: email, candidateCount: graph.candidates.length, externalIdentityCandidates: graph.candidates, entityClues: graph.clues, entityConvergences: graph.convergences, identityDiscoveryEdges: graph.edges, identityDiscoverySearches: graph.searches, identityDiscoveryMetrics: graph.metrics, evidencePolicy: "Submitted input is not independent corroboration. Discovery leads cannot establish identity facts. Candidate status requires external evidence. Verification requires independent primary evidence." } }; } finally { clearTimeout(timeout); } } }
