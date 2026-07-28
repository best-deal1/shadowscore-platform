import type { SecSearchHit } from "./filingTypes";

const SEC_ARCHIVES = "https://www.sec.gov/Archives/edgar/data";

function cleanCik(value: string | undefined) {
  return value?.replace(/^0+/, "").replace(/\D/g, "") || "";
}

function accessionFrom(hit: SecSearchHit) {
  return hit._source?.adsh || hit._id?.match(/\d{10}-\d{2}-\d{6}/)?.[0];
}

/** Maps an EFTS result to its stable, canonical EDGAR filing URL. */
export function canonicalEdgarUrl(hit: SecSearchHit, fallback: string) {
  const supplied = hit._source?.linkToFilingDetails;
  if (supplied) return new URL(supplied, "https://www.sec.gov").toString();

  const cik = cleanCik(hit._source?.ciks?.[0]);
  const accession = accessionFrom(hit);
  if (!cik || !accession) return fallback;

  const directory = accession.replaceAll("-", "");
  const document = hit._source?.file_name || hit._id?.split(":")[1];
  return document
    ? `${SEC_ARCHIVES}/${cik}/${directory}/${document}`
    : `${SEC_ARCHIVES}/${cik}/${directory}/${accession}-index.html`;
}

export function readableSecText(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&(?:nbsp|#160);/gi, " ").replace(/\s+/g, " ").trim();
}

export function secEventText(hit: SecSearchHit) {
  const source = hit._source;
  const highlightedText = Object.values(hit.highlight || {}).flatMap((value) => Array.isArray(value) ? value : [value]);
  const items = Array.isArray(source?.items) ? source.items : source?.items ? [source.items] : [];
  return [source?.title, source?.summary, source?.description, source?.primary_doc_description, ...items, ...highlightedText]
    .filter((value): value is string => Boolean(value))
    .map(readableSecText)
    .filter(Boolean)
    .join(" | ");
}
