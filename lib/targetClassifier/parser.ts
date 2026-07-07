import type { ParsedTargetInput } from "./types";

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /(?:\+?\d[\d().\-\s]{7,}\d)/g;
const DOMAIN_PATTERN = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi;
const URL_PATTERN = /(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s]*)?/gi;

const stripTrailingPunctuation = (value: string): string => value.replace(/[),.;\]]+$/g, "");

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const toUrl = (value: string): URL | null => {
  const candidate = value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;

  try {
    return new URL(candidate);
  } catch {
    return null;
  }
};

const normalizeDomain = (value: string): string => value.toLowerCase().replace(/^www\./, "");

export function parseTargetInput(input: unknown): ParsedTargetInput {
  const rawInput = typeof input === "string" ? input : String(input ?? "");
  const cleanedInput = rawInput.trim();
  const emails = unique((cleanedInput.match(EMAIL_PATTERN) ?? []).map((email) => email.toLowerCase()));
  const phones = unique((cleanedInput.match(PHONE_PATTERN) ?? []).map((phone) => phone.replace(/\s+/g, " ").trim()));
  const emailDomains = new Set(emails.map((email) => email.split("@")[1]));
  const urlMatches = unique((cleanedInput.match(URL_PATTERN) ?? [])
    .map(stripTrailingPunctuation)
    .filter((match) => !emailDomains.has(normalizeDomain(match))));
  const urls = urlMatches.map(toUrl).filter((url): url is URL => url !== null);
  const domains = unique([
    ...urls.map((url) => normalizeDomain(url.hostname)),
    ...(cleanedInput.match(DOMAIN_PATTERN) ?? [])
      .map((domain) => normalizeDomain(domain))
      .filter((domain) => !emailDomains.has(domain)),
  ]);
  const tokens = unique(cleanedInput.split(/[\s,;|]+/).map(stripTrailingPunctuation).filter(Boolean));
  const evidenceSignals = [urls.length, emails.length, phones.length].filter((count) => count > 0).length;
  const looksLikeStructured = /^[\[{]/.test(cleanedInput) || /\b(screenshot|invoice|receipt|evidence|complaint|case|document)\b/i.test(cleanedInput);
  const looksLikeEvidencePackage = cleanedInput.includes("\n") || tokens.length > 8 || evidenceSignals > 1 || looksLikeStructured;

  return {
    rawInput,
    cleanedInput,
    tokens,
    urls,
    emails,
    phones,
    domains,
    looksLikeEvidencePackage,
  };
}
