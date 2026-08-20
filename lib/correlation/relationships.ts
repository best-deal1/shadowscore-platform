import type { CorrelationEndpoint, EvidenceFacts } from "./types";
import type { EvidenceItem } from "../evidence";

const CONSUMER_EMAIL_DOMAINS = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "proton.me"]);

export function normalizeText(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function normalizeDomain(value: string) {
  const emailDomain = value.match(/^[^\s@]+@([^\s@]+)$/)?.[1];
  const candidate = (emailDomain || value).toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#:]/)[0];
  return candidate.includes(".") ? candidate : "";
}

export function emailDomain(value: string) {
  return normalizeDomain(value);
}

export function isConsumerEmailDomain(domain: string) {
  return CONSUMER_EMAIL_DOMAINS.has(domain);
}

function endpoint(role: string, value: string, item: EvidenceItem): CorrelationEndpoint {
  return { role, value, evidenceId: item.id, source: item.provider || item.source };
}

function addUnique(collection: CorrelationEndpoint[], next: CorrelationEndpoint) {
  const key = `${normalizeText(next.role)}:${normalizeText(next.value)}:${next.evidenceId}`;
  if (!collection.some((item) => `${normalizeText(item.role)}:${normalizeText(item.value)}:${item.evidenceId}` === key)) collection.push(next);
}

function values(item: EvidenceItem) {
  return [item.title, item.description, ...item.evidenceRefs.flatMap((ref) => [ref.label, ref.value || ""])].filter(Boolean).join(" | ");
}

function extractEmail(text: string) { return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []; }
export function isValidPhoneCandidate(value: string) {
  const trimmed = value.trim();
  if (/\b\d{4}-\d{2}-\d{2}\b/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  if (/^\d{8,}$/.test(trimmed) && !/^\+/.test(trimmed)) return false;
  if (/(?:id|ga|gtm|analytics|timestamp|date)\s*[:=]/i.test(trimmed)) return false;
  return /(?:^|[\s:(-])\+?\d[\d\s().-]{5,}\d(?:$|[\s).,-])/.test(trimmed);
}
function extractPhone(text: string) { return (text.match(/\+?\d[\d\s().-]{5,}\d/g) || []).filter(isValidPhoneCandidate); }
function extractDomains(text: string) { return text.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi) || []; }

export function extractEvidenceFacts(evidenceItems: EvidenceItem[]): EvidenceFacts {
  const facts: EvidenceFacts = { businessNames: [], registryNames: [], domains: [], websites: [], emails: [], phones: [], dnsHosts: [], sslHosts: [], marketplaceSellers: [], paymentAccounts: [], fraudSignals: [], negativeSignals: [] };
  for (const item of evidenceItems) {
    const haystack = values(item);
    const lower = haystack.toLowerCase();
    const source = `${item.provider} ${item.source}`.toLowerCase();
    const domainMatches = extractDomains(haystack).map(normalizeDomain).filter(Boolean);
    const emailMatches = extractEmail(haystack);
    const phoneMatches = extractPhone(haystack);
    const explicitValues = item.evidenceRefs.map((ref) => ref.value).filter((value): value is string => Boolean(value?.trim()));

    for (const email of emailMatches) addUnique(facts.emails, endpoint("email", email.toLowerCase(), item));
    if (item.evidenceRefs.some((ref) => ref.type === "search_result")) continue;
    for (const phone of phoneMatches) addUnique(facts.phones, endpoint("phone", phone.replace(/\s+/g, " ").trim(), item));
    for (const domain of domainMatches) addUnique(facts.domains, endpoint("domain", domain, item));

    if (source.includes("dns") || lower.includes("dns") || lower.includes("name server") || lower.includes("mx") || lower.includes("spf") || lower.includes("dmarc")) {
      for (const domain of domainMatches) addUnique(facts.dnsHosts, endpoint("dns", domain, item));
    }
    if (source.includes("ssl") || lower.includes("certificate") || lower.includes("tls") || lower.includes("ssl")) {
      for (const domain of domainMatches) addUnique(facts.sslHosts, endpoint("ssl", domain, item));
    }
    if (lower.includes("website") || lower.includes("domain")) for (const domain of domainMatches) addUnique(facts.websites, endpoint("website", domain, item));
    if (source.includes("registry") || lower.includes("registry") || lower.includes("legal name")) for (const value of explicitValues) addUnique(facts.registryNames, endpoint("registry", value, item));
    if (lower.includes("business name") || lower.includes("company") || lower.includes("legal name")) for (const value of explicitValues) addUnique(facts.businessNames, endpoint("business", value, item));
    if (source.includes("marketplace") || lower.includes("explicit marketplace seller") || lower.includes("marketplace seller") || lower.includes("store name")) for (const value of explicitValues.length ? explicitValues : [item.title]) addUnique(facts.marketplaceSellers, endpoint("marketplace seller", value, item));
    if (source.includes("payment") || lower.includes("payment account") || lower.includes("payout") || lower.includes("paypal") || lower.includes("stripe")) for (const value of explicitValues.length ? explicitValues : [item.title]) addUnique(facts.paymentAccounts, endpoint("payment account", value, item));
    if (item.category === "Negative") addUnique(facts.negativeSignals, endpoint("negative", item.title, item));
    if (lower.includes("fraud") || lower.includes("scam") || lower.includes("blacklist")) addUnique(facts.fraudSignals, endpoint("fraud", item.title, item));
  }
  return facts;
}
