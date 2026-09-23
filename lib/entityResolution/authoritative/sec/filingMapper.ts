import type { SECFilingBatch, SECIssuerFiling } from "./filingTypes";

const ACCESSION_NUMBER = /^\d{10}-\d{2}-\d{6}$/;
const FILING_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function mapSECFilingBatch(payload: unknown, cik: string): SECIssuerFiling[] {
  const batch = parseBatch(payload);
  const length = batch.accessionNumber.length;
  const required = [batch.filingDate, batch.form, batch.primaryDocument];
  if (required.some((column) => column.length !== length)) throw new TypeError("SEC filing columns have inconsistent lengths");
  if (batch.primaryDocDescription && batch.primaryDocDescription.length !== length) {
    throw new TypeError("SEC filing description column has an inconsistent length");
  }

  return batch.accessionNumber.map((accessionNumber, index) => {
    const filingDate = batch.filingDate[index];
    const form = batch.form[index];
    const primaryDocument = batch.primaryDocument[index];
    if (!ACCESSION_NUMBER.test(accessionNumber) || !FILING_DATE.test(filingDate) || !form.trim() || !primaryDocument.trim()) {
      throw new TypeError(`SEC filing row ${index} is malformed`);
    }
    const description = batch.primaryDocDescription?.[index]?.trim();
    return {
      cik,
      accessionNumber,
      filingDate,
      form,
      primaryDocument,
      ...(description ? { primaryDocumentDescription: description } : {}),
      filingUrl: canonicalEDGARFilingUrl(cik, accessionNumber, primaryDocument),
      source: "issuer_submissions" as const,
    };
  });
}

export function canonicalEDGARFilingUrl(cik: string, accessionNumber: string, primaryDocument: string): string {
  const unpaddedCIK = cik.replace(/^0+(?=\d)/, "");
  const accessionPath = accessionNumber.replaceAll("-", "");
  return `https://www.sec.gov/Archives/edgar/data/${unpaddedCIK}/${accessionPath}/${encodeURIComponent(primaryDocument)}`;
}

function parseBatch(payload: unknown): SECFilingBatch {
  if (!isRecord(payload)) throw new TypeError("SEC filing batch must be an object");
  const required = ["accessionNumber", "filingDate", "form", "primaryDocument"] as const;
  for (const field of required) {
    if (!isStringArray(payload[field])) throw new TypeError(`SEC filing batch ${field} must be a string array`);
  }
  if (payload.primaryDocDescription !== undefined && !isStringArray(payload.primaryDocDescription)) {
    throw new TypeError("SEC filing batch primaryDocDescription must be a string array");
  }
  return payload as SECFilingBatch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
