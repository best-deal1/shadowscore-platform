export type AuthoritativeIssuer = {
  registry: string;
  registryId: string;
  legalName: string;
  tickers: string[];
  exchanges: string[];
  website?: string;
  sic?: string;
  stateOfIncorporation?: string;
  sourceUrls: string[];
  raw: Record<string, unknown>;
};

export interface AuthoritativeRegistry {
  readonly id: string;
  resolveByCIK(cik: string | number): Promise<AuthoritativeIssuer | null>;
  resolveByTicker(ticker: string): Promise<AuthoritativeIssuer | null>;
  resolveByName(name: string): Promise<AuthoritativeIssuer[]>;
  fetchIssuer(registryId: string | number): Promise<AuthoritativeIssuer | null>;
}
