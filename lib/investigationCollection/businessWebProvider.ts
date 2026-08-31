import { isPublicMailboxDomain } from "../emailDomains";
import type { EntityCandidate, EvidenceAssertion } from "../investigationEngine/types";
import type { CollectionSeed, InvestigationProvider, InvestigationProviderManifest, ProviderCollectionContext } from "./types";

const SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const LEGAL_SUFFIX = String.raw`(?:בע["״']?מ|לימיטד|LTD\.?|LIMITED|LLC|INC\.?|CORP(?:ORATION)?\.?)`;
const ROLE = String.raw`(?:co[- ]?ceo|chief executive officer|ceo|director|officer|founder|owner|מנכ["״']?ל|דירקטור(?:ית)?)`;

function domainFrom(seed: CollectionSeed) {
  const raw = seed.kind === "email" ? seed.value.split("@").at(-1) || "" : seed.value;
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#:]/)[0];
}

function id(part: string) { return Buffer.from(part).toString("base64url").slice(0, 32); }
function hostOf(value: string) { try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; } }
function isIsraeliGovernment(host: string) { return /(?:^|\.)(?:gov\.il|muni\.il)$/i.test(host); }
function normalizeText(value: string) { return value.replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim(); }

export type BusinessWebClaim = { kind: "legal_name" | "registration_number" | "person_role" | "business_email" | "address"; value: string; person?: string; role?: string; company?: string };

/** Extracts typed business claims. It never emits company or role text as a person name. */
export function extractBusinessWebClaims(raw: string): BusinessWebClaim[] {
  const text = normalizeText(raw);
  const claims: BusinessWebClaim[] = [];
  const add = (claim: BusinessWebClaim) => { if (!claims.some((item) => item.kind === claim.kind && item.value.toLowerCase() === claim.value.toLowerCase())) claims.push(claim); };
  for (const match of text.matchAll(new RegExp(`([\\p{L}][\\p{L}\\p{N} &'().,-]{2,80}?\\s${LEGAL_SUFFIX})`, "giu"))) add({ kind: "legal_name", value: match[1].trim().replace(/^[|,:;.-]+/, "") });
  for (const match of text.matchAll(/(?:company|corporation|registration|company number|מס(?:פר)?\s*(?:חברה)?|ח\.?\s*פ\.?)\s*(?:no\.?|number|[:#-])?\s*(\d{8,10})/giu)) add({ kind: "registration_number", value: match[1] });
  for (const match of text.matchAll(new RegExp(`([\\p{L}][\\p{L} .'-]{1,60}?)\\s*[-|,]\\s*(${ROLE})\\s+(?:at|of|ב[- ]?)\\s*([\\p{L}\\p{N} &'().,-]{2,100})`, "giu"))) {
    const person = match[1].trim().split(/(?:[.!?]\s+|\|)/).at(-1)!.trim(), role = match[2].trim(), company = match[3].trim().replace(/\s+(?:\||[-–]).*$/, "");
    add({ kind: "person_role", value: `${person}: ${role}`, person, role, company });
  }
  for (const email of text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []) add({ kind: "business_email", value: email.toLowerCase() });
  for (const match of text.matchAll(/(?:registered address|business address|כתובת)\s*[:#-]\s*([^|;]{5,120})/giu)) add({ kind: "address", value: match[1].trim() });
  return claims;
}

export class BraveBusinessWebInvestigationProvider implements InvestigationProvider {
  manifest: InvestigationProviderManifest;
  private readonly apiKey?: string;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.apiKey = env.BRAVE_SEARCH_API_KEY;
    this.manifest = { id: "public-business-discovery", name: "Brave public business discovery", supportedSeedTypes: ["email", "domain", "company", "legal_entity", "registration_number"], supportedJurisdictions: ["global"], supportedMarketplaces: [], availability: this.apiKey ? { status: "available" } : { status: "unavailable", reason: "BRAVE_SEARCH_API_KEY is not configured." }, authentication: "api_key", rateLimit: "Defined by Brave Search API plan", cost: null, evidenceTypes: ["registry", "website", "contact", "other"], sourceFamily: "brave-public-web", legalBasis: "licensed", capabilities: ["business"] };
  }

  async collect(seed: CollectionSeed, context: ProviderCollectionContext) {
    if (!this.apiKey) throw new Error("BRAVE_SEARCH_API_KEY is not configured.");
    const domain = seed.kind === "email" || seed.kind === "domain" ? domainFrom(seed) : "";
    if (seed.kind === "email" && isPublicMailboxDomain(domain)) return { candidates: [], evidence: [], discoveredSeeds: [] };
    const queryTarget = domain || seed.value.trim();
    const query = `"${queryTarget}" (company OR registration OR director OR CEO OR חברה OR ח.פ)`;
    const request = new URL(SEARCH_ENDPOINT); request.searchParams.set("q", query); request.searchParams.set("count", "10"); request.searchParams.set("safesearch", "strict");
    const response = await fetch(request, { signal: context.signal, headers: { accept: "application/json", "x-subscription-token": this.apiKey } });
    if (!response.ok) throw new Error(`Public business search returned HTTP ${response.status}.`);
    const payload = await response.json() as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } };
    const hits = (payload.web?.results || []).filter((hit) => hit.title && hit.url && /^https?:\/\//i.test(hit.url));
    const candidates: EntityCandidate[] = [], evidence: EvidenceAssertion[] = [], discoveredSeeds: CollectionSeed[] = [];
    const addCandidate = (candidate: EntityCandidate) => { const current = candidates.find((item) => item.candidateId === candidate.candidateId); if (current) { current.evidenceIds.push(...candidate.evidenceIds); current.identifiers.push(...candidate.identifiers); } else candidates.push(candidate); };
    let emailId: string | undefined, domainId: string | undefined;
    if (seed.kind === "email") { emailId = `business-email:${seed.value.toLowerCase()}`; addCandidate({ candidateId: emailId, kind: "email", label: seed.value, identifiers: [{ kind: "email", value: seed.value }], evidenceIds: [] }); }
    if (domain) {
      domainId = `business-domain:${domain}`; addCandidate({ candidateId: domainId, kind: "domain", label: domain, identifiers: [{ kind: "domain", value: domain }], evidenceIds: [] });
      if (emailId) {
        const evidenceId = `submitted-email-domain:${id(seed.value)}`; candidates.find((item) => item.candidateId === emailId)!.evidenceIds.push(evidenceId); candidates.find((item) => item.candidateId === domainId)!.evidenceIds.push(evidenceId);
        evidence.push({ evidenceId, subjectCandidateId: emailId, objectCandidateId: domainId, relationship: "uses_domain", value: domain, confidence: 100, lifecycle: "observed", evidenceType: "contact", source: { sourceId: "submitted-target", sourceFamily: "submitted-target", sourceName: "Submitted investigation target", observedAt: context.now, retrievedAt: context.now, reliability: 100, license: "submitted" } });
      }
      discoveredSeeds.push({ kind: "domain", value: domain });
    }
    for (const [index, hit] of hits.entries()) {
      const resultUrl = hit.url!, host = hostOf(resultUrl), snippet = normalizeText(`${hit.title} ${hit.description || ""}`);
      const discoveryId = `business-result:${context.depth}:${index}:${id(resultUrl)}`;
      const sourceFamily = host === domain || host.endsWith(`.${domain}`) ? `first-party:${domain}` : isIsraeliGovernment(host) ? `israeli-government:${host}` : `public-web:${host}`;
      const anchorId = domainId || `business-query:${id(queryTarget)}`;
      if (!candidates.some((item) => item.candidateId === anchorId)) addCandidate({ candidateId: anchorId, kind: seed.kind === "registration_number" || seed.kind === "company" || seed.kind === "legal_entity" ? "company" : "domain", label: queryTarget, identifiers: [{ kind: seed.kind, value: seed.value }], evidenceIds: [] });
      candidates.find((item) => item.candidateId === anchorId)!.evidenceIds.push(discoveryId);
      evidence.push({ evidenceId: discoveryId, subjectCandidateId: anchorId, relationship: "business_source_candidate", value: resultUrl, confidence: 35, lifecycle: "lead", evidenceType: "other", discovery: { query, resultUrl, sourceUrl: request.toString(), snippet, timestamp: context.now, hop: context.depth, parentEvidenceIds: [] }, source: { sourceId: "brave-business-search", sourceFamily: "brave-public-web", sourceName: "Brave Search API", sourceUrl: resultUrl, observedAt: context.now, retrievedAt: context.now, reliability: 65, license: "licensed" } });
      const claims = extractBusinessWebClaims(snippet);
      const hitCompanyIds = claims.filter((claim) => claim.kind === "legal_name").map((claim) => `company:${id(claim.value)}`);
      for (const claim of claims) {
        const claimId = `business-claim:${index}:${claim.kind}:${id(claim.value)}`;
        if (claim.kind === "legal_name") {
          const companyId = `company:${id(claim.value)}`; addCandidate({ candidateId: companyId, kind: "company", label: claim.value, identifiers: [{ kind: "legal_entity", value: claim.value }], evidenceIds: [claimId] });
          evidence.push({ evidenceId: claimId, subjectCandidateId: anchorId, objectCandidateId: companyId, relationship: "legal_entity_candidate", value: claim.value, confidence: 45, lifecycle: "lead", evidenceType: "registry", derivedFromEvidenceIds: [discoveryId], discovery: { query, resultUrl, sourceUrl: request.toString(), snippet, timestamp: context.now, hop: context.depth, parentEvidenceIds: [discoveryId] }, source: { sourceId: "brave-business-search", sourceFamily, sourceName: isIsraeliGovernment(host) ? "Israeli public body search result" : "Public web search result", sourceUrl: resultUrl, observedAt: context.now, retrievedAt: context.now, reliability: isIsraeliGovernment(host) ? 85 : 65, license: "public" } });
          if (domain && (snippet.toLowerCase().includes(domain) || host === domain)) discoveredSeeds.push({ kind: "legal_entity", value: claim.value });
        } else if (claim.kind === "registration_number") {
          // Registration identifiers stay with a legal entity extracted from the
          // same source result. This prevents same-name search neighbors merging.
          const companyId = hitCompanyIds[0] || anchorId;
          candidates.find((item) => item.candidateId === companyId)!.identifiers.push({ kind: "registration_number", value: claim.value }); candidates.find((item) => item.candidateId === companyId)!.evidenceIds.push(claimId);
          evidence.push({ evidenceId: claimId, subjectCandidateId: companyId, relationship: "company_registration_id_candidate", value: claim.value, confidence: 45, lifecycle: "lead", evidenceType: "registry", derivedFromEvidenceIds: [discoveryId], discovery: { query, resultUrl, sourceUrl: request.toString(), snippet, timestamp: context.now, hop: context.depth, parentEvidenceIds: [discoveryId] }, source: { sourceId: "brave-business-search", sourceFamily, sourceName: isIsraeliGovernment(host) ? "Israeli public body search result" : "Public web search result", sourceUrl: resultUrl, observedAt: context.now, retrievedAt: context.now, reliability: isIsraeliGovernment(host) ? 85 : 65, license: "public" } });
          discoveredSeeds.push({ kind: "registration_number", value: claim.value });
        } else if (claim.kind === "person_role" && claim.person && claim.role) {
          const companyId = candidates.find((item) => item.kind === "company" && (!claim.company || claim.company.toLowerCase().includes(item.label.toLowerCase().split(" ")[0])))?.candidateId || candidates.find((item) => item.kind === "company")?.candidateId || anchorId;
          const personId = `officer:${id(claim.person)}`; addCandidate({ candidateId: personId, kind: "person", label: claim.person, identifiers: [{ kind: "person", value: claim.person }], evidenceIds: [claimId] });
          evidence.push({ evidenceId: claimId, subjectCandidateId: companyId, objectCandidateId: personId, relationship: "officer_role_candidate", value: claim.role, confidence: 45, lifecycle: "lead", evidenceType: "ownership", derivedFromEvidenceIds: [discoveryId], discovery: { query, resultUrl, sourceUrl: request.toString(), snippet, timestamp: context.now, hop: context.depth, parentEvidenceIds: [discoveryId] }, source: { sourceId: "brave-business-search", sourceFamily, sourceName: "Public role search result", sourceUrl: resultUrl, observedAt: context.now, retrievedAt: context.now, reliability: 65, license: "public" } });
        }
      }
    }
    return { candidates, evidence, discoveredSeeds: [...new Map(discoveredSeeds.map((item) => [`${item.kind}:${item.value.toLowerCase()}`, item])).values()] };
  }
}
