import { BaseProvider } from "./BaseProvider";
import type { ProviderEvidence, ProviderExecutionContext, ProviderFailureReason, ProviderResult } from "./types";
import { isPublicMailboxDomain } from "../emailDomains";

const SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const SOCIAL_HOSTS: Record<string, string> = { "facebook.com": "Facebook", "instagram.com": "Instagram", "linkedin.com": "LinkedIn", "x.com": "X", "twitter.com": "X", "tiktok.com": "TikTok", "github.com": "GitHub", "youtube.com": "YouTube" };

export type IdentityDiscoveryLimits = { maxHops: number; maxIdentifiers: number; maxSearches: number; maxResultsPerSearch: number; maxVisibleCandidates: number };
export const DEFAULT_IDENTITY_DISCOVERY_LIMITS: IdentityDiscoveryLimits = { maxHops: 2, maxIdentifiers: 12, maxSearches: 12, maxResultsPerSearch: 10, maxVisibleCandidates: 8 };
export type IdentityDiscoveryEdge = { from: string; to: string; relation: "search_result" | "observed_identifier"; hop: number; evidence: { query: string; url: string; snippet: string; provider: "Brave Search" } };
export type ExternalIdentityCandidate = {
  platform: string; profileUrl: string; observedDisplayName?: string; matchedIdentifiers: string[];
  matchType: "exact_email" | "username" | "alias"; status: "Candidate" | "Corroborated" | "Verified";
  matchLevel: "exact_match" | "unverified_candidate"; matchBasis: string; confidence: number;
  evidenceUrl: string; evidenceQuery: string; evidenceSnippet: string; methods: string[];
  sourceProvider: "Brave Search"; evidenceReference: string; discoveryPath: string[];
  supportingEvidence: Array<{ query: string; snippet: string; url: string; hop: number }>;
};
type SearchResult = { title: string; url: string; description?: string };
type SearchFn = (query: string, apiKey: string, signal: AbortSignal, limit: number) => Promise<SearchResult[]>;

function emailFromContext(context: ProviderExecutionContext) { const values = [context.requestedTarget, context.target, context.email].filter(Boolean) as string[]; return values.map((value) => value.trim().toLowerCase()).find((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)); }
function containsExactEmailToken(text: string, email: string) { const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return new RegExp(`(^|[^A-Z0-9._%+\\-])${escaped}($|[^A-Z0-9._%+\\-])`, "i").test(text); }
function platformFor(url: string) { try { const parsed = new URL(url); const host = parsed.hostname.toLowerCase().replace(/^www\./, ""); return Object.entries(SOCIAL_HOSTS).find(([domain]) => host === domain || host.endsWith(`.${domain}`))?.[1] || (/\/(?:profile|people|member|team|author)\b/i.test(parsed.pathname) ? "Public profile" : undefined); } catch { return undefined; } }
function canonicalUrl(url: string) { try { const parsed = new URL(url); parsed.hash = ""; for (const key of [...parsed.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(key)) parsed.searchParams.delete(key); return parsed.toString().replace(/\/$/, ""); } catch { return url; } }
function publicSearchEvidenceUrl(query: string) { const url = new URL("https://search.brave.com/search"); url.searchParams.set("q", query); return url.toString(); }
function normalizeIdentifier(value: string) { return value.trim().replace(/^@/, "").replace(/\s+/g, " ").toLowerCase(); }
function usefulIdentifier(value: string, original: Set<string>) {
  const normalized = normalizeIdentifier(value);
  return normalized.length >= 3 && normalized.length <= 60 && !original.has(normalized)
    && !/^(public profile|profile|home|instagram|facebook|linkedin|user|account)$/i.test(normalized)
    && !/^https?:/i.test(normalized);
}
function containsIdentifier(text: string, identifier: string) {
  const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}_.-])@?${escaped}($|[^\\p{L}\\p{N}_.-])`, "iu").test(text);
}
function observedIdentifiers(hit: SearchResult, originals: Set<string>) {
  const text = `${hit.title} ${hit.description || ""}`;
  const explicit = [...text.matchAll(/\b(?:alias|aka|handle|username|known as)\s*[:\-]?\s*["']?(@?[\p{L}\p{N}_. -]{3,40})["']?/giu)]
    .map((match) => match[1].trim().replace(/[.,;:]$/, ""));
  // Search-result titles and URL handles are discovery metadata, not alias assertions.
  return [...new Set(explicit.filter((value) => usefulIdentifier(value, originals)))].slice(0, 3);
}
async function braveSearch(query: string, apiKey: string, signal: AbortSignal, limit: number): Promise<SearchResult[]> { const url = new URL(SEARCH_ENDPOINT); url.searchParams.set("q", query); url.searchParams.set("count", String(limit)); url.searchParams.set("safesearch", "strict"); const response = await fetch(url, { signal, headers: { accept: "application/json", "x-subscription-token": apiKey } }); if (!response.ok) throw new Error(`Public search returned HTTP ${response.status}.`); const payload = await response.json() as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } }; return (payload.web?.results || []).filter((item): item is SearchResult => Boolean(item.title && item.url)).slice(0, limit); }

type QueueItem = { id: string; label: string; hop: number; path: string[]; query: string; method: string };
type PendingIdentifier = QueueItem & { exactSource: boolean; order: number };

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
    { id: localPart, label: localPart, hop: 0, path: [normalized], query: `"${localPart}" "${domain}"`, method: "identity_context" },
  ];
  const searched = new Set<string>(); const queuedIdentifiers = new Set<string>(); const candidates = new Map<string, ExternalIdentityCandidate>();
  const edges: IdentityDiscoveryEdge[] = []; const pendingIdentifiers: PendingIdentifier[] = [];
  let searchCount = 0; let identifierCount = 2; let observationOrder = 0; let seedSearchesRemaining = queue.length;

  const enqueuePending = () => {
    pendingIdentifiers.sort((a, b) => Number(b.exactSource) - Number(a.exactSource) || a.order - b.order);
    for (const item of pendingIdentifiers.splice(0)) {
      const id = normalizeIdentifier(item.id);
      if (queuedIdentifiers.has(id) || identifierCount >= limits.maxIdentifiers) continue;
      queuedIdentifiers.add(id); identifierCount += 1; queue.push(item);
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
    for (const hit of results) {
      const platform = platformFor(hit.url); if (!platform) continue;
      const profileUrl = canonicalUrl(hit.url); const snippet = `${hit.title}${hit.description ? ` - ${hit.description}` : ""}`.trim();
      const currentExact = containsExactEmailToken(snippet, normalized);
      // A second-hop result must repeat the searched identifier in its own preserved evidence.
      if (item.hop > 0 && !containsIdentifier(snippet, item.label)) continue;
      const prior = candidates.get(profileUrl); const exact = currentExact || prior?.matchLevel === "exact_match";
      const observation = { query: item.query, snippet, url: publicSearchEvidenceUrl(item.query), hop: item.hop };
      const supportingEvidence = [...(prior?.supportingEvidence || []), observation];
      const observedMatches = [...(prior?.matchedIdentifiers || [])];
      if (currentExact) observedMatches.push(normalized);
      else if (item.hop > 0 && containsIdentifier(snippet, item.label)) observedMatches.push(normalizeIdentifier(item.label));
      const identifiers = [...new Set(observedMatches)];
      const confidence = exact ? 75 : item.hop > 0 ? 25 : 30;
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
        matchBasis: exact
          ? "The exact submitted email appears in public search evidence for this profile. The result remains a candidate until an independent source corroborates it."
          : item.hop
            ? `The explicit identifier “${item.label}” appears in this result and in the prior result on the preserved discovery path. This is an unverified lead.`
            : "The submitted email local-part generated this public profile candidate. Candidate only, not verified identity.",
      });
      edges.push({ from: item.id, to: profileUrl, relation: "search_result", hop: item.hop, evidence: { query: item.query, url: observation.url, snippet, provider: "Brave Search" } });
      if (item.hop >= limits.maxHops - 1) continue;
      for (const identifier of observedIdentifiers(hit, originals)) {
        const id = normalizeIdentifier(identifier);
        const evidence = { query: item.query, url: observation.url, snippet, provider: "Brave Search" as const };
        // Preserve every observation edge. Search execution is deduplicated separately.
        edges.push({ from: profileUrl, to: id, relation: "observed_identifier", hop: item.hop + 1, evidence });
        pendingIdentifiers.push({ id, label: identifier, hop: item.hop + 1, path: [...path, `alias “${identifier}”`], query: `"${identifier}" profile OR social`, method: "discovered_identifier", exactSource: exact, order: observationOrder++ });
      }
    }
    if (item.hop === 0) {
      seedSearchesRemaining -= 1;
      if (seedSearchesRemaining === 0 || !queue.some((queued) => queued.hop === 0)) enqueuePending();
    }
  }
  const ranked = [...candidates.values()].sort((a, b) => b.confidence - a.confidence || b.supportingEvidence.length - a.supportingEvidence.length || a.profileUrl.localeCompare(b.profileUrl));
  const pathUrls = new Set(edges.filter((edge) => edge.relation === "observed_identifier").map((edge) => edge.from));
  const visible = ranked.filter((candidate, index) => candidate.confidence >= 45 || pathUrls.has(candidate.profileUrl) || index < 3).slice(0, limits.maxVisibleCandidates);
  return { candidates: visible, allCandidates: ranked, edges, metrics: { searchCount, identifierCount, maxHopReached: edges.reduce((max, edge) => Math.max(max, edge.hop), 0), partial: signal.aborted } };
}
export async function discoverExternalIdentityCandidates(email: string, apiKey: string, signal: AbortSignal) { return (await discoverExternalIdentityGraph(email, apiKey, signal)).candidates; }

export class EmailIntelligenceProvider extends BaseProvider { readonly id = "email-intelligence"; readonly name = "Email Intelligence"; readonly version = "1.1.0"; readonly category = "business_profile" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const email = emailFromContext(context); if (!email) throw new Error("Email intelligence requires an email target."); const domain = email.split("@")[1]; const publicMailbox = isPublicMailboxDomain(domain); return { findings: [], evidence: [{ id: "email-target-classification", type: "placeholder", label: "Mailbox classification", value: publicMailbox ? "Public mailbox provider" : "Corporate/custom domain candidate", source: "submitted-target", investigationId: context.investigationId || context.intakeId, canonicalTarget: email, providerName: this.name, collectedAt: new Date().toISOString() }], metadata: { lookupPerformed: true, submittedEmail: email, emailDomain: domain, publicMailbox, evidenceIndependence: "submitted_input_only" } }; } }
export class ExternalIdentityProvider extends BaseProvider { readonly id = "external-identity"; readonly name = "External Identity Discovery"; readonly version = "2.0.0"; readonly category = "business_profile" as const; failureReason(error: unknown): ProviderFailureReason { if (error instanceof Error && /BRAVE_SEARCH_API_KEY|credential|not configured|provider unavailable/i.test(error.message)) return "Unavailable"; return super.failureReason(error); } protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const email = emailFromContext(context); if (!email) throw new Error("External identity discovery requires an email target."); const apiKey = process.env.BRAVE_SEARCH_API_KEY; if (!apiKey) throw new Error("External identity provider unavailable: BRAVE_SEARCH_API_KEY is not configured."); const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8_000); try { const graph = await discoverExternalIdentityGraph(email, apiKey, controller.signal); const evidence: ProviderEvidence[] = graph.candidates.map((candidate, index) => ({ id: `external-identity-${index + 1}`, type: "search_result", label: candidate.matchLevel === "unverified_candidate" ? "Potential public identity candidate" : "Public identity exact-email match", value: `${candidate.platform} | profile ${candidate.profileUrl} | status ${candidate.status} | matched ${candidate.matchedIdentifiers.join(", ")} | confidence ${candidate.confidence}% | path ${candidate.discoveryPath.join(" -> ")} | ${candidate.matchBasis}`, source: candidate.evidenceUrl, investigationId: context.investigationId || context.intakeId, canonicalTarget: email, providerName: this.name, collectedAt: new Date().toISOString() })); return { findings: [], evidence, metadata: { lookupPerformed: true, submittedEmail: email, candidateCount: graph.candidates.length, externalIdentityCandidates: graph.candidates, identityDiscoveryEdges: graph.edges, identityDiscoveryMetrics: graph.metrics, evidencePolicy: "Submitted input is not independent corroboration. Candidate status requires external evidence. Verification requires independent primary evidence." } }; } finally { clearTimeout(timeout); } } }
