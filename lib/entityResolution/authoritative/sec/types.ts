export type SECCompanyTickerRow = [cik: number, legalName: string, ticker: string, exchange: string];

export type SECCompanyTickerDataset = {
  fields: ["cik", "name", "ticker", "exchange"];
  data: SECCompanyTickerRow[];
};

export type SECSubmissions = {
  cik: string;
  name: string;
  tickers?: string[];
  exchanges?: string[];
  sic?: string;
  stateOfIncorporation?: string;
  website?: string;
  filings?: unknown;
  [key: string]: unknown;
};
