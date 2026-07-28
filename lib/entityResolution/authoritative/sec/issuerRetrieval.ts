import { normalizeCIK, SECClient } from "./client";
import { mapSECFilingBatch } from "./filingMapper";
import type { SECIssuerRetrievalInput, SECIssuerRetrievalResult, SECRetrievalIssue } from "./filingTypes";

type HistoricalFile = { name: string };

export class SECIssuerRetriever {
  private readonly client: SECClient;

  constructor(client: SECClient = new SECClient()) {
    this.client = client;
  }

  async retrieve(input: SECIssuerRetrievalInput): Promise<SECIssuerRetrievalResult> {
    const cikResult = authoritativeCIK(input);
    if (typeof cikResult !== "string") return { status: "failed", filings: [], issues: [cikResult] };
    const cik = cikResult;

    let submissions: unknown;
    try {
      submissions = await this.client.fetchSubmissions(cik);
    } catch (error) {
      return failed(cik, error instanceof SyntaxError ? "malformed_payload" : "upstream_failure", message(error));
    }
    if (submissions === null) return failed(cik, "issuer_not_found", `SEC issuer ${cik} was not found`);
    if (!isRecord(submissions)) return failed(cik, "malformed_payload", "SEC submissions payload must be an object");

    let payloadCIK: string;
    try {
      payloadCIK = normalizeCIK(asCIK(submissions.cik));
    } catch {
      return failed(cik, "malformed_payload", "SEC submissions payload has an invalid CIK");
    }
    if (payloadCIK !== cik) return failed(cik, "issuer_mismatch", `SEC payload CIK ${payloadCIK} does not match resolved CIK ${cik}`);

    const filings = isRecord(submissions.filings) ? submissions.filings : undefined;
    if (!filings || !("recent" in filings) || (filings.files !== undefined && !isHistoricalFiles(filings.files))) {
      return failed(cik, "malformed_payload", "SEC submissions payload has invalid filing indexes");
    }

    try {
      const normalized = mapSECFilingBatch(filings.recent, cik);
      const issues: SECRetrievalIssue[] = [];
      const historicalFiles = filings.files as HistoricalFile[] | undefined;
      for (const file of historicalFiles ?? []) {
        let batch: unknown | null;
        try {
          batch = await this.client.fetchSubmissionFile(file.name);
        } catch (error) {
          return failed(cik, error instanceof SyntaxError ? "malformed_payload" : "upstream_failure", message(error), file.name);
        }
        if (batch === null) {
          issues.push({ code: "missing_historical_index", message: `SEC historical index ${file.name} was not found`, file: file.name });
          continue;
        }
        if (isRecord(batch) && batch.cik !== undefined) {
          let historicalCIK: string;
          try { historicalCIK = normalizeCIK(asCIK(batch.cik)); } catch {
            return failed(cik, "malformed_payload", `SEC historical index ${file.name} has an invalid CIK`, file.name);
          }
          if (historicalCIK !== cik) return failed(cik, "issuer_mismatch", `SEC historical index ${file.name} belongs to CIK ${historicalCIK}`, file.name);
        }
        normalized.push(...mapSECFilingBatch(batch, cik));
      }
      return issues.length ? { status: "partial", cik, filings: normalized, issues } : { status: "success", cik, filings: normalized, issues: [] };
    } catch (error) {
      return failed(cik, "malformed_payload", message(error));
    }
  }
}

function authoritativeCIK(input: SECIssuerRetrievalInput): string | SECRetrievalIssue {
  if (input.entity.resolutionStatus !== "AUTHORITATIVE" || input.issuer.registry.toLowerCase() !== "sec") {
    return { code: "missing_cik", message: "SEC retrieval requires an authoritative SEC issuer" };
  }
  const identifiers = isRecord(input.entity.metadata.authoritativeIdentifiers) ? input.entity.metadata.authoritativeIdentifiers : undefined;
  const sec = identifiers && isRecord(identifiers.sec) ? identifiers.sec : undefined;
  if (!sec?.cik) return { code: "missing_cik", message: "A unique authoritative SEC CIK is required" };
  try {
    const entityCIK = normalizeCIK(asCIK(sec.cik));
    const issuerCIK = normalizeCIK(input.issuer.registryId);
    return entityCIK === issuerCIK ? entityCIK : { code: "issuer_mismatch", message: `Resolved CIK ${entityCIK} does not match issuer CIK ${issuerCIK}` };
  } catch {
    return { code: "missing_cik", message: "A unique authoritative SEC CIK is required" };
  }
}

function failed(cik: string, code: SECRetrievalIssue["code"], text: string, file?: string): SECIssuerRetrievalResult {
  return { status: "failed", cik, filings: [], issues: [{ code, message: text, ...(file ? { file } : {}) }] };
}
function asCIK(value: unknown): string | number { if (typeof value !== "string" && typeof value !== "number") throw new TypeError(); return value; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isHistoricalFiles(value: unknown): value is HistoricalFile[] { return Array.isArray(value) && value.every((item) => isRecord(item) && typeof item.name === "string"); }
function message(error: unknown): string { return error instanceof Error ? error.message : "Unknown SEC retrieval failure"; }
