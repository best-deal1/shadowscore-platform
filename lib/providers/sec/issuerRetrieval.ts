import type { IssuerRetrievalResult, SecSearchHit, SecSearchResponse } from "./filingTypes";

export const SEC_FULL_TEXT_SEARCH_URL = "https://efts.sec.gov/LATEST/search-index";
const PAGE_SIZE = 10;
const MAX_PAGES = 10;
const SEC_HEADERS = { "user-agent": "ShadowScore evidence provider contact@shadowscore.io", accept: "application/json" };

function normalizedIssuer(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\b(?:incorporated|inc|corporation|corp|company|co|limited|ltd|plc|llc)\b/g, " ").replace(/\s+/g, " ").trim();
}

function belongsToIssuer(hit: SecSearchHit, query: string) {
  const names = hit._source?.display_names?.map(normalizedIssuer).filter(Boolean) || [];
  if (!names.length) return true;
  const issuer = normalizedIssuer(query);
  return names.some((name) => name === issuer || name.startsWith(`${issuer} `) || issuer.startsWith(`${name} `));
}

function searchUrl(query: string, from: number) {
  const url = new URL(SEC_FULL_TEXT_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("from", String(from));
  url.searchParams.set("size", String(PAGE_SIZE));
  return url;
}

async function fetchPage(url: URL): Promise<SecSearchResponse> {
  const response = await fetch(url, { headers: SEC_HEADERS });
  if (!response.ok) throw new Error(`SEC filing retrieval failed: ${response.status}`);
  return await response.json() as SecSearchResponse;
}

/** Retrieves one issuer's current and historical EFTS results without mixing named issuers. */
export async function retrieveIssuerFilings(query: string): Promise<IssuerRetrievalResult> {
  const firstUrl = searchUrl(query, 0);
  const filings: SecSearchHit[] = [];
  const errors: string[] = [];
  let totalRecords = 0;
  let pagesRetrieved = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = searchUrl(query, page * PAGE_SIZE);
    try {
      const payload = await fetchPage(url);
      const hits = payload.hits?.hits || [];
      totalRecords = payload.hits?.total?.value || totalRecords;
      filings.push(...hits.filter((hit) => belongsToIssuer(hit, query)));
      pagesRetrieved += 1;
      if (hits.length < PAGE_SIZE || (page + 1) * PAGE_SIZE >= totalRecords) break;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      break;
    }
  }

  const base = { query, queryUrl: firstUrl.toString(), filings, totalRecords, pagesRetrieved };
  if (!pagesRetrieved) return { status: "failed", ...base, filings: [], totalRecords: 0, pagesRetrieved: 0, errors };
  if (errors.length) return { status: "partial", ...base, errors };
  return { status: "success", ...base };
}
