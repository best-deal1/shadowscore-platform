import type { ResolvedEntity } from "../../types";

export type SECResolutionCandidate = {
  cik: string;
  legalName: string;
  ticker?: string;
  exchange?: string;
  matchReason: "exact_cik" | "exact_ticker" | "exact_legal_name";
};

export type SECResolutionResult = {
  status: "AUTHORITATIVE" | "AMBIGUOUS" | "FAILED";
  entity?: ResolvedEntity;
  confidence: number;
  candidates: SECResolutionCandidate[];
  warnings: string[];
  resolver: "sec";
  resolverVersion: string;
};
