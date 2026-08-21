import { discoverExternalIdentityGraph } from "../providers/externalIdentityProvider";
import type { EntityCandidate, EvidenceAssertion } from "../investigationEngine/types";
import { providerAvailability, PROVIDER_CAPABILITY_REGISTRY } from "./capabilityRegistry";
import type { CollectionSeed, InvestigationProvider, InvestigationProviderManifest, ProviderCollectionContext } from "./types";

const SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const registration = PROVIDER_CAPABILITY_REGISTRY.find((item) => item.id === "public-social-discovery")!;
const blockedPaths = /\/(?:accounts\/)?(?:login|signin|signup|search|explore|directory)(?:\/|$)/i;
const socialHosts = /(^|\.)(facebook|instagram|linkedin|x|twitter|tiktok|github|youtube)\.com$/i;

function candidateKind(seed: CollectionSeed) {
  return seed.kind === "company" || seed.kind === "legal_entity" ? "company" as const : "social_profile" as const;
}

async function genericSearch(seed: CollectionSeed, apiKey: string, context: ProviderCollectionContext) {
  const query = `"${seed.value.trim()}" profile OR social`;
  const request = new URL(SEARCH_ENDPOINT);
  request.searchParams.set("q", query); request.searchParams.set("count", "10"); request.searchParams.set("safesearch", "strict");
  const response = await fetch(request, { signal: context.signal, headers: { accept: "application/json", "x-subscription-token": apiKey } });
  if (!response.ok) throw new Error(`Public search returned HTTP ${response.status}.`);
  const payload = await response.json() as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } };
  return (payload.web?.results || []).filter((hit) => {
    if (!hit.title || !hit.url) return false;
    try { const url = new URL(hit.url); return /^https?:$/.test(url.protocol) && !blockedPaths.test(url.pathname) && (socialHosts.test(url.hostname) || /\/(?:profile|people|member|team|author)\b/i.test(url.pathname)); } catch { return false; }
  }).map((hit) => ({ query, resultUrl: hit.url!, sourceUrl: request.toString(), snippet: `${hit.title}${hit.description ? ` - ${hit.description}` : ""}`, hop: context.depth }));
}

export class BravePublicWebInvestigationProvider implements InvestigationProvider {
  manifest: InvestigationProviderManifest;
  private readonly apiKey?: string;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const availability = providerAvailability(registration, env);
    this.manifest = { id: registration.id, name: "Brave public web identity discovery", supportedSeedTypes: registration.targetTypes, supportedJurisdictions: ["global"], supportedMarketplaces: [], availability, authentication: "api_key", rateLimit: "Defined by Brave Search API plan", cost: null, evidenceTypes: ["other"], sourceFamily: "brave-public-web", legalBasis: registration.legalBasis, capabilities: [registration.capability] };
    this.apiKey = env[registration.credentialEnv!];
  }

  async collect(seed: CollectionSeed, context: ProviderCollectionContext) {
    const apiKey = this.apiKey;
    if (!apiKey) throw new Error(`${registration.credentialEnv} is not configured.`);
    const observations = seed.kind === "email"
      ? (await discoverExternalIdentityGraph(seed.value, apiKey, context.signal)).candidates.flatMap((candidate) => candidate.supportingEvidence.map((item) => ({ ...item, resultUrl: candidate.profileUrl, sourceUrl: item.url })))
      : await genericSearch(seed, apiKey, context);
    const seedCandidateId = `seed:${seed.kind}:${seed.value.trim().toLowerCase()}`;
    const candidates: EntityCandidate[] = [{ candidateId: seedCandidateId, kind: seed.kind === "email" ? "email" : seed.kind === "username" ? "username" : candidateKind(seed), label: seed.value, identifiers: [{ kind: seed.kind, value: seed.value }], evidenceIds: [] }];
    const evidence: EvidenceAssertion[] = [];
    const discoveredSeeds: CollectionSeed[] = [];
    const lastEvidenceByProfile = new Map<string, string>();
    for (const [index, item] of observations.entries()) {
      const profileUrl = item.resultUrl.replace(/\/$/, "");
      const candidateId = `public-profile:${profileUrl}`;
      const evidenceId = `public-web:${context.depth}:${index}:${Buffer.from(profileUrl).toString("base64url").slice(0, 24)}`;
      const parentEvidenceIds = item.hop > 0 && lastEvidenceByProfile.has(profileUrl) ? [lastEvidenceByProfile.get(profileUrl)!] : [];
      const existing = candidates.find((candidate) => candidate.candidateId === candidateId);
      if (existing) existing.evidenceIds.push(evidenceId);
      else candidates.push({ candidateId, kind: "social_profile", label: profileUrl, identifiers: [{ kind: "social_profile", value: profileUrl }], evidenceIds: [evidenceId] });
      candidates[0].evidenceIds.push(evidenceId);
      evidence.push({ evidenceId, subjectCandidateId: seedCandidateId, objectCandidateId: candidateId, relationship: "public_profile_candidate", value: profileUrl, confidence: 35, lifecycle: "lead", evidenceType: "other", derivedFromEvidenceIds: parentEvidenceIds, confidenceComponents: { identifierMatch: 35, sourceReliability: 65, independence: 0, freshness: 100, hopDecay: item.hop * 10 }, discovery: { query: item.query, resultUrl: profileUrl, sourceUrl: item.sourceUrl, snippet: item.snippet, timestamp: context.now, hop: item.hop, parentEvidenceIds }, source: { sourceId: registration.id, sourceFamily: "brave-public-web", sourceName: "Brave Search API", sourceUrl: profileUrl, observedAt: context.now, retrievedAt: context.now, reliability: 65, license: "licensed" } });
      lastEvidenceByProfile.set(profileUrl, evidenceId);
      discoveredSeeds.push({ kind: "social_profile", value: profileUrl });
    }
    return { candidates, evidence, discoveredSeeds };
  }
}
