import type { ResolvedEntity } from "../../types";
import type { AuthoritativeIssuer } from "../types";

export type SECIssuerFiling = {
  cik: string;
  accessionNumber: string;
  filingDate: string;
  form: string;
  primaryDocument: string;
  primaryDocumentDescription?: string;
  filingUrl: string;
  source: "issuer_submissions";
};

export type SECIssuerRetrievalInput = {
  entity: ResolvedEntity;
  issuer: AuthoritativeIssuer;
};

export type SECRetrievalIssueCode =
  | "missing_cik"
  | "issuer_not_found"
  | "malformed_payload"
  | "upstream_failure"
  | "missing_historical_index"
  | "issuer_mismatch";

export type SECRetrievalIssue = {
  code: SECRetrievalIssueCode;
  message: string;
  file?: string;
};

export type SECIssuerRetrievalResult =
  | { status: "success"; cik: string; filings: SECIssuerFiling[]; issues: [] }
  | { status: "partial"; cik: string; filings: SECIssuerFiling[]; issues: SECRetrievalIssue[] }
  | { status: "failed"; cik?: string; filings: []; issues: SECRetrievalIssue[] };

export type SECFilingBatch = {
  accessionNumber: string[];
  filingDate: string[];
  form: string[];
  primaryDocument: string[];
  primaryDocDescription?: string[];
};
