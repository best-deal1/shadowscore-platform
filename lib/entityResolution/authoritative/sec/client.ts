import type { SECCompanyTickerDataset, SECSubmissions } from "./types";

export const SEC_URLS = {
  companyTickersExchange: "https://www.sec.gov/files/company_tickers_exchange.json",
  submissions: (cik: string) => `https://data.sec.gov/submissions/CIK${cik}.json`,
} as const;

const DEFAULT_USER_AGENT = "ShadowScore authoritative registry contact@shadowscore.io";

export type SECClientOptions = {
  fetch?: typeof fetch;
  userAgent?: string;
};

export class SECClient {
  private readonly request: typeof fetch;
  private readonly headers: Readonly<Record<string, string>>;

  constructor(options: SECClientOptions = {}) {
    this.request = options.fetch ?? globalThis.fetch;
    this.headers = {
      accept: "application/json",
      "user-agent": options.userAgent ?? DEFAULT_USER_AGENT,
    };
  }

  async fetchTickerDataset(): Promise<SECCompanyTickerDataset> {
    return this.fetchJSON<SECCompanyTickerDataset>(SEC_URLS.companyTickersExchange);
  }

  async fetchSubmissions(cik: string | number): Promise<SECSubmissions | null> {
    const normalizedCIK = normalizeCIK(cik);
    const response = await this.request(SEC_URLS.submissions(normalizedCIK), { headers: this.headers });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`SEC request failed with status ${response.status}`);
    return response.json() as Promise<SECSubmissions>;
  }

  private async fetchJSON<T>(url: string): Promise<T> {
    const response = await this.request(url, { headers: this.headers });
    if (!response.ok) throw new Error(`SEC request failed with status ${response.status}`);
    return response.json() as Promise<T>;
  }
}

export function normalizeCIK(cik: string | number): string {
  const digits = String(cik).trim().replace(/^CIK/i, "");
  if (!/^\d{1,10}$/.test(digits)) throw new TypeError("CIK must contain between 1 and 10 digits");
  return digits.padStart(10, "0");
}
