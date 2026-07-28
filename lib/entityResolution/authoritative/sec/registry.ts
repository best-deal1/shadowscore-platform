import type { AuthoritativeIssuer, AuthoritativeRegistry } from "../types";
import { normalizeCIK, SECClient, SEC_URLS } from "./client";
import type { SECCompanyTickerRow, SECSubmissions } from "./types";

export class SECRegistry implements AuthoritativeRegistry {
  readonly id = "sec";
  private readonly client: SECClient;

  constructor(client: SECClient = new SECClient()) {
    this.client = client;
  }

  async resolveByCIK(cik: string | number): Promise<AuthoritativeIssuer | null> {
    return this.fetchIssuer(cik);
  }

  async resolveByTicker(ticker: string): Promise<AuthoritativeIssuer | null> {
    const normalizedTicker = ticker.trim().toUpperCase();
    if (!normalizedTicker) return null;
    const dataset = await this.client.fetchTickerDataset();
    const row = dataset.data.find((candidate) => candidate[2].toUpperCase() === normalizedTicker);
    return row ? this.issuerFromRow(row) : null;
  }

  async resolveByName(name: string): Promise<AuthoritativeIssuer[]> {
    const normalizedName = normalizeName(name);
    if (!normalizedName) return [];
    const dataset = await this.client.fetchTickerDataset();
    const rows = dataset.data.filter((candidate) => normalizeName(candidate[1]) === normalizedName);
    return Promise.all(rows.map((row) => this.issuerFromRow(row)));
  }

  async fetchIssuer(registryId: string | number): Promise<AuthoritativeIssuer | null> {
    const cik = normalizeCIK(registryId);
    const submissions = await this.client.fetchSubmissions(cik);
    return submissions ? issuerFromSubmissions(submissions, cik) : null;
  }

  private async issuerFromRow(row: SECCompanyTickerRow): Promise<AuthoritativeIssuer> {
    const [cikNumber, legalName, ticker, exchange] = row;
    const cik = normalizeCIK(cikNumber);
    const submissions = await this.client.fetchSubmissions(cik);
    if (submissions) return issuerFromSubmissions(submissions, cik, row);
    return {
      registry: this.id,
      registryId: cik,
      legalName,
      tickers: [ticker],
      exchanges: [exchange],
      sourceUrls: [SEC_URLS.companyTickersExchange],
      raw: { tickerRow: row },
    };
  }
}

function issuerFromSubmissions(submissions: SECSubmissions, cik: string, row?: SECCompanyTickerRow): AuthoritativeIssuer {
  return {
    registry: "sec",
    registryId: cik,
    legalName: submissions.name || row?.[1] || "",
    tickers: submissions.tickers ?? (row ? [row[2]] : []),
    exchanges: submissions.exchanges ?? (row ? [row[3]] : []),
    website: submissions.website || undefined,
    sic: submissions.sic || undefined,
    stateOfIncorporation: submissions.stateOfIncorporation || undefined,
    sourceUrls: [SEC_URLS.submissions(cik), ...(row ? [SEC_URLS.companyTickersExchange] : [])],
    raw: { submissions, ...(row ? { tickerRow: row } : {}) },
  };
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase("en-US").replace(/[.,]/g, "").replace(/\s+/g, " ");
}
