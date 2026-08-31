import type { EntityCandidate, EvidenceAssertion } from "../investigationEngine/types";
import type { CollectionSeed, InvestigationProvider, InvestigationProviderManifest, ProviderCollectionContext } from "./types";

const TICKERS_URL = "https://www.sec.gov/files/company_tickers_exchange.json";
const SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK";
const DEFAULT_USER_AGENT = "ShadowScore registry research contact@shadowscore.io";

type TickerDataset = { data?: Array<[number, string, string, string]> };
type Submission = { name?: string; website?: string; addresses?: { business?: { street1?: string; street2?: string; city?: string; stateOrCountry?: string; zipCode?: string } } };

const normalized = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const cik = (value: string | number) => String(value).replace(/^cik:/i, "").replace(/^0+/, "").padStart(10, "0");

export class SecEdgarCompanyRegistryProvider implements InvestigationProvider {
  manifest: InvestigationProviderManifest;
  private userAgent: string;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const disabled = env.SEC_EDGAR_REGISTRY_ENABLED === "false";
    this.userAgent = env.SEC_EDGAR_USER_AGENT?.trim() || DEFAULT_USER_AGENT;
    this.manifest = {
      id: "sec-edgar-company-registry", name: "SEC EDGAR company registry", supportedSeedTypes: ["company", "legal_entity", "registration_number"],
      supportedJurisdictions: ["US"], supportedMarketplaces: [], availability: disabled ? { status: "unavailable", reason: "SEC_EDGAR_REGISTRY_ENABLED is false." } : { status: "available" },
      authentication: "none", rateLimit: "SEC fair-access policy", cost: null, evidenceTypes: ["registry", "website", "contact"], sourceFamily: "sec-edgar", legalBasis: "open_data", capabilities: ["registry"],
    };
  }

  async collect(seed: CollectionSeed, context: ProviderCollectionContext) {
    const headers = { accept: "application/json", "user-agent": this.userAgent };
    const response = await fetch(TICKERS_URL, { headers, signal: context.signal });
    if (!response.ok) throw new Error(`SEC EDGAR company index returned HTTP ${response.status}.`);
    const dataset = await response.json() as TickerDataset;
    const query = seed.value.trim();
    const queryCik = seed.kind === "registration_number" || /^cik:/i.test(query) ? cik(query) : "";
    const row = (dataset.data || []).find(([rowCik, legalName, ticker]) => queryCik
      ? cik(rowCik) === queryCik
      : ticker.toLowerCase() === query.toLowerCase() || normalized(legalName) === normalized(query));
    if (!row) return { candidates: [], evidence: [], discoveredSeeds: [] };

    const [rawCik, indexName, ticker, exchange] = row;
    const paddedCik = cik(rawCik);
    const sourceUrl = `${SUBMISSIONS_URL}${paddedCik}.json`;
    const submissionResponse = await fetch(sourceUrl, { headers, signal: context.signal });
    if (!submissionResponse.ok) throw new Error(`SEC EDGAR company submission returned HTTP ${submissionResponse.status}.`);
    const submission = await submissionResponse.json() as Submission;
    const legalName = submission.name?.trim() || indexName;
    const companyId = `sec-company:${paddedCik}`;
    const evidence: EvidenceAssertion[] = [];
    const candidates: EntityCandidate[] = [{ candidateId: companyId, kind: "company", label: legalName, identifiers: [{ kind: "registration_number", value: paddedCik }, { kind: "company", value: legalName }], evidenceIds: [] }];
    const add = (relationship: string, value: string, evidenceType: EvidenceAssertion["evidenceType"], objectCandidateId?: string) => {
      const evidenceId = `sec:${paddedCik}:${relationship}`;
      candidates[0].evidenceIds.push(evidenceId);
      evidence.push({ evidenceId, subjectCandidateId: companyId, objectCandidateId, relationship, value, confidence: 98, lifecycle: "verified", evidenceType,
        confidenceComponents: { identifierMatch: 100, sourceReliability: 100, independence: 100, freshness: 100, hopDecay: context.depth * 10 },
        source: { sourceId: "sec-edgar-submissions", sourceFamily: "sec-edgar", sourceName: "U.S. Securities and Exchange Commission EDGAR", sourceUrl, observedAt: context.now, retrievedAt: context.now, reliability: 100, license: "open_data", query,
          normalization: { raw: seed.value, normalized: queryCik || normalized(query), method: queryCik ? "zero-padded SEC CIK" : "case-folded legal name or ticker" } } });
    };
    add("legal_name", legalName, "registry"); add("registration_number", paddedCik, "registry"); add("ticker", ticker, "registry"); add("exchange", exchange, "registry");
    const domain = String(submission.website || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
    if (domain) { const id = `sec-domain:${domain}`; candidates.push({ candidateId: id, kind: "domain", label: domain, identifiers: [{ kind: "domain", value: domain }], evidenceIds: [`sec:${paddedCik}:official_website`] }); add("official_website", domain, "website", id); }
    const address = submission.addresses?.business;
    const addressValue = address && [address.street1, address.street2, address.city, address.stateOrCountry, address.zipCode].filter(Boolean).join(", ");
    if (addressValue) { const id = `sec-address:${paddedCik}`; candidates.push({ candidateId: id, kind: "address", label: addressValue, identifiers: [{ kind: "address", value: addressValue }], evidenceIds: [`sec:${paddedCik}:business_address`] }); add("business_address", addressValue, "contact", id); }
    return { candidates, evidence, discoveredSeeds: domain ? [{ kind: "domain" as const, value: domain }] : [] };
  }
}

export const SEC_EDGAR_CONFIGURATION = { enabledEnv: "SEC_EDGAR_REGISTRY_ENABLED", userAgentEnv: "SEC_EDGAR_USER_AGENT", indexUrl: TICKERS_URL, submissionsUrl: `${SUBMISSIONS_URL}{CIK}.json` } as const;
