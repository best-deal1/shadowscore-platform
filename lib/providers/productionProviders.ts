import { promises as dns } from "node:dns";
import tls from "node:tls";

import { BaseProvider } from "./BaseProvider";
import type { ProviderEvidence, ProviderExecutionContext, ProviderFinding, ProviderFailureReason, ProviderHealth, ProviderResult } from "./types";
import { classifyRegulatoryRecord, isAdverseRegulatoryClassification } from "../evidence/regulatoryClassification";


type NormalizedTarget = { domain: string; websiteUrl?: string; email?: string; supported: boolean; reason?: ProviderFailureReason };

const TIMEOUT_MS = 4_000;
const FREE_PREVIEW_TIMEOUTS_MS = { http: 2_500, ssl: 2_000, whois: 2_500, dns: 1_000 } as const;
const HEADER_SOURCE = "http-response-headers";
const CERT_SOURCE = "tls-certificate";
const DNS_SOURCE = "node:dns";
const WELL_KNOWN_SOCIALS = ["linkedin.com", "facebook.com", "instagram.com", "x.com", "twitter.com", "youtube.com", "tiktok.com"];

type DnsRecordType = "A" | "AAAA" | "MX" | "NS" | "TXT" | "CNAME";
type DnsRecords = Record<DnsRecordType, string[]>;
type RdapEvent = { eventAction?: string; eventDate?: string };
type RdapResponse = { objectClassName?: string; ldhName?: string; handle?: string; status?: string[]; events?: RdapEvent[]; nameservers?: Array<{ ldhName?: string }> };

const DNS_RECORD_TYPES: DnsRecordType[] = ["A", "AAAA", "MX", "NS", "TXT", "CNAME"];
const RDAP_BASE_URL = "https://rdap.org/domain/";

const SEC_COMPANY_TICKERS_EXCHANGE_URL = "https://www.sec.gov/files/company_tickers_exchange.json";
const SEC_SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK";
const SEC_HEADERS = { "user-agent": "ShadowScore evidence provider contact@shadowscore.io", accept: "application/json" };
const SEC_FULL_TEXT_SEARCH_URL = "https://efts.sec.gov/LATEST/search-index";

type SecCompanyRow = [number, string, string, string];
type SecCompanyTickerExchange = { fields: string[]; data: SecCompanyRow[] };
type PublicCompanyTarget = { ticker?: string; cik?: string; domain?: string; supported: boolean; reason?: ProviderFailureReason };

function normalizeTicker(value: string) { return value.trim().replace(/^ticker:/i, "").toUpperCase(); }
function normalizeSecDomain(value: string | undefined) { return String(value || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#:]/)[0].replace(/\.$/, ""); }
function normalizeCik(value: string) { const raw = value.trim().replace(/^cik:/i, "").replace(/^0+/, ""); return /^\d+$/.test(raw) ? raw.padStart(10, "0") : ""; }
function publicCompanyTarget(context: ProviderExecutionContext): PublicCompanyTarget {
  const raw = (context.companyTicker || context.target || "").trim();
  const tickerMatch = raw.match(/^(?:ticker:)?([A-Z.\-]{1,8})$/i);
  const cikMatch = raw.match(/^(?:cik:)?(\d{1,10})$/i);
  if (cikMatch) return { cik: normalizeCik(cikMatch[1]), supported: true };
  if (tickerMatch && !raw.includes(".")) return { ticker: normalizeTicker(tickerMatch[1]), supported: true };
  const domain = normalizeSecDomain(raw);
  if (domain && domain.includes(".")) return { domain, supported: true };
  return { supported: false, reason: "Not Supported" };
}
async function fetchSecJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: SEC_HEADERS });
  if (!response.ok) throw new Error(`SEC authoritative company lookup failed: ${response.status}`);
  return await response.json() as T;
}

function formatDnsError(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") return error.code;
  return error instanceof Error ? error.message : "Unknown DNS lookup error";
}

async function resolveRecord(domain: string, recordType: DnsRecordType): Promise<string[]> {
  switch (recordType) {
    case "A": return dns.resolve4(domain);
    case "AAAA": return dns.resolve6(domain);
    case "MX": return (await dns.resolveMx(domain)).map((record) => `${record.priority} ${record.exchange}`);
    case "NS": return dns.resolveNs(domain);
    case "TXT": return (await dns.resolveTxt(domain)).map((record) => record.join(""));
    case "CNAME": return dns.resolveCname(domain);
  }
}
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} Timeout`)), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

function findEventDate(events: RdapEvent[] = [], action: string) { return events.find((event) => event.eventAction?.toLowerCase() === action)?.eventDate; }
function domainAgeDays(registrationDate?: string) { if (!registrationDate) return undefined; const registeredAt = new Date(registrationDate).getTime(); if (Number.isNaN(registeredAt)) return undefined; return Math.max(0, Math.floor((Date.now() - registeredAt) / 86_400_000)); }


export function normalizeProviderTarget(context: ProviderExecutionContext): NormalizedTarget {
  const raw = (context.target || context.email || "").trim();
  const email = context.email || raw.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)?.[0];
  const candidate = email ? email.split("@")[1] : raw;
  try {
    const parsed = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    const domain = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    return { domain, websiteUrl: parsed.protocol === "http:" ? `${parsed.protocol}//${parsed.host}` : `https://${domain}`, email, supported: Boolean(domain && (domain.includes(".") || domain === "localhost")) };
  } catch {
    const domain = candidate.replace(/^https?:\/\//i, "").split(/[/?#:]/)[0].replace(/^www\./i, "").toLowerCase();
    return { domain, websiteUrl: domain ? `https://${domain}` : undefined, email, supported: Boolean(domain && (domain.includes(".") || domain === "localhost")), reason: "Not Supported" };
  }
}

export type HttpFailureStage = "normalization" | "dns" | "tls" | "request" | "redirect" | "response" | "body" | "parser" | "none";
export type SharedHttpOutcome = "completed_with_evidence" | "completed_no_extractable_evidence" | "blocked" | "timeout" | "network_failure" | "tls_failure" | "unsupported_content" | "challenge_page" | "parser_failure";
export type HttpRedirectHop = { url: string; statusCode?: number; location?: string };
export type HttpDiagnostics = {
  requestedUrl: string; finalUrl?: string; redirectCount: number; redirectChain: HttpRedirectHop[]; statusCode?: number; statusText?: string;
  durationMs: number; timeoutMs: number; contentType?: string; contentLength?: string; bodyBytesRead: number; responseWasHtml: boolean;
  userAgent: string; tlsStatus: "not_attempted" | "ok" | "failed"; failureStage: HttpFailureStage; failureCode?: string; failureMessage?: string;
  aborted: boolean; possibleBotProtection: boolean; possibleChallengePage: boolean; targetNormalization: NormalizedTarget; dnsResolved: boolean;
};
export type SharedHttpResult = { ok: boolean; outcome: SharedHttpOutcome; requestedUrl: string; finalUrl?: string; statusCode?: number; headers: Headers; text: string; diagnostics: HttpDiagnostics; attempts: HttpDiagnostics[] };

type MutableProviderContext = ProviderExecutionContext & { sharedHttpResult?: SharedHttpResult; sharedHttpPromise?: Promise<SharedHttpResult>; sharedHttpFetchCount?: number };
const STANDARD_USER_AGENT = "ShadowScoreBot/1.0 (+https://shadowscore.io; evidence diagnostics)";

function timeoutSignal(ms = TIMEOUT_MS) { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), ms); return { signal: controller.signal, done: () => clearTimeout(timeout) }; }
function failure(error: unknown): ProviderFailureReason { if (error instanceof Error && (error.name === "AbortError" || /timeout|timed out/i.test(error.message))) return "Timeout"; if (error instanceof Error && /429|rate/i.test(error.message)) return "Rate Limited"; if (error instanceof Error && /not supported|invalid|requires/i.test(error.message)) return "Not Supported"; return "Unavailable"; }
function isHtml(contentType = "") { return /(?:text\/html|application\/xhtml\+xml)/i.test(contentType); }
function challengeSignals(status?: number, html = "") { const sample = html.slice(0, 120_000).toLowerCase(); const possibleBotProtection = status === 403 || status === 429 || /cloudflare|akamai|imperva|datadome|perimeterx|access denied|forbidden|bot protection/i.test(sample); const possibleChallengePage = possibleBotProtection || /captcha|challenge|checking your browser|verify you are human|just a moment/i.test(sample); return { possibleBotProtection, possibleChallengePage }; }
function httpOutcome(d: HttpDiagnostics): SharedHttpOutcome { if (d.aborted) return "timeout"; if (d.failureStage === "tls") return "tls_failure"; if (d.failureStage === "dns" || d.failureStage === "request") return "network_failure"; if (d.possibleChallengePage) return "challenge_page"; if (d.statusCode && [401, 403, 429].includes(d.statusCode)) return "blocked"; if (d.statusCode && d.statusCode >= 500) return "network_failure"; if (!d.responseWasHtml) return "unsupported_content"; return "completed_with_evidence"; }
function candidateUrls(target: NormalizedTarget, fastPreview = false) { const urls = new Set<string>(); if (target.websiteUrl) urls.add(target.websiteUrl); urls.add(`https://${target.domain}`); if (!fastPreview) { urls.add(`https://www.${target.domain}`); urls.add(`https://${target.domain.replace(/^www\./i, "")}`); } return [...urls]; }

async function fetchText(url: string, target: NormalizedTarget, timeoutMs = TIMEOUT_MS): Promise<SharedHttpResult> {
  const started = Date.now(); const redirects: HttpRedirectHop[] = [{ url }]; const t = timeoutSignal(timeoutMs);
  let statusCode: number | undefined; let statusText: string | undefined; let contentType: string | undefined; let contentLength: string | undefined; let finalUrl: string | undefined; let text = ""; let headers = new Headers();
  try {
    await dns.lookup(new URL(url).hostname); const response = await fetch(url, { signal: t.signal, redirect: "follow", headers: { "user-agent": STANDARD_USER_AGENT, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8", "accept-language": "en-US,en;q=0.8" } });
    statusCode = response.status; statusText = response.statusText; headers = response.headers; finalUrl = response.url || url; contentType = headers.get("content-type") || undefined; contentLength = headers.get("content-length") || undefined; if (finalUrl && finalUrl !== url) redirects.push({ url: finalUrl, statusCode });
    text = await response.text(); const bot = challengeSignals(statusCode, text); const diagnostics: HttpDiagnostics = { requestedUrl: url, finalUrl, redirectCount: Math.max(0, redirects.length - 1), redirectChain: redirects, statusCode, statusText, durationMs: Date.now() - started, timeoutMs, contentType, contentLength, bodyBytesRead: Buffer.byteLength(text), responseWasHtml: isHtml(contentType), userAgent: STANDARD_USER_AGENT, tlsStatus: finalUrl?.startsWith("https:") ? "ok" : "not_attempted", failureStage: "none", aborted: false, ...bot, targetNormalization: target, dnsResolved: true };
    return { ok: response.ok && diagnostics.responseWasHtml && !bot.possibleChallengePage, outcome: httpOutcome(diagnostics), requestedUrl: url, finalUrl, statusCode, headers, text, diagnostics, attempts: [diagnostics] };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError"; const msg = error instanceof Error ? error.message : String(error); const code = error && typeof error === "object" && "code" in error ? String(error.code) : undefined; const stage: HttpFailureStage = aborted ? "request" : /certificate|tls|ssl|handshake/i.test(msg) ? "tls" : /ENOTFOUND|EAI_AGAIN|dns|query/i.test(`${code} ${msg}`) ? "dns" : "request";
    const diagnostics: HttpDiagnostics = { requestedUrl: url, finalUrl, redirectCount: Math.max(0, redirects.length - 1), redirectChain: redirects, statusCode, statusText, durationMs: Date.now() - started, timeoutMs, contentType, contentLength, bodyBytesRead: Buffer.byteLength(text), responseWasHtml: isHtml(contentType), userAgent: STANDARD_USER_AGENT, tlsStatus: stage === "tls" ? "failed" : "not_attempted", failureStage: stage, failureCode: code || (aborted ? "TIMEOUT" : "FETCH_ERROR"), failureMessage: msg, aborted, possibleBotProtection: false, possibleChallengePage: false, targetNormalization: target, dnsResolved: stage !== "dns" };
    return { ok: false, outcome: httpOutcome(diagnostics), requestedUrl: url, finalUrl, statusCode, headers, text, diagnostics, attempts: [diagnostics] };
  } finally { t.done(); }
}

export async function acquireSharedHttp(context: ProviderExecutionContext): Promise<SharedHttpResult> {
  const mutable = context as MutableProviderContext; if (mutable.sharedHttpResult) return mutable.sharedHttpResult; if (mutable.sharedHttpPromise) return mutable.sharedHttpPromise;
  mutable.sharedHttpFetchCount = (mutable.sharedHttpFetchCount || 0) + 1;
  mutable.sharedHttpPromise = (async () => {
    const target = normalizeProviderTarget(context); if (!target.supported) throw new Error("Not Supported"); const attempts: HttpDiagnostics[] = [];
    const timeoutMs = context.providerTimeoutMs?.http ?? (context.executionProfile === "free_preview" ? FREE_PREVIEW_TIMEOUTS_MS.http : TIMEOUT_MS);
    for (const url of candidateUrls(target, context.executionProfile === "free_preview")) { const result = await fetchText(url, target, timeoutMs); attempts.push(...result.attempts); if (result.ok || result.outcome === "blocked" || result.outcome === "challenge_page") { result.attempts = attempts; mutable.sharedHttpResult = result; return result; } }
    const last = attempts[attempts.length - 1]; const result: SharedHttpResult = { ok: false, outcome: last ? httpOutcome(last) : "network_failure", requestedUrl: attempts[0]?.requestedUrl || target.websiteUrl || target.domain, finalUrl: last?.finalUrl, statusCode: last?.statusCode, headers: new Headers(), text: "", diagnostics: last, attempts };
    mutable.sharedHttpResult = result; return result;
  })().finally(() => { mutable.sharedHttpPromise = undefined; });
  return mutable.sharedHttpPromise;
}

function httpProviderTimeoutMs(context: ProviderExecutionContext) { return context.providerTimeoutMs?.http ?? (context.executionProfile === "free_preview" ? FREE_PREVIEW_TIMEOUTS_MS.http : TIMEOUT_MS); }
async function acquireTimedSharedHttp(context: ProviderExecutionContext): Promise<SharedHttpResult> { return context.executionProfile === "free_preview" ? withTimeout(acquireSharedHttp(context), httpProviderTimeoutMs(context) + 250, "HTTP acquisition") : acquireSharedHttp(context); }

function isErrorPage(result: SharedHttpResult) { return result.outcome === "blocked" || result.outcome === "challenge_page" || Boolean(result.statusCode && ([401, 403, 429].includes(result.statusCode) || result.statusCode >= 500)); }


export abstract class ProductionProvider extends BaseProvider {
  normalize(context: ProviderExecutionContext) { return normalizeProviderTarget(context); }
  confidence(result: Pick<ProviderResult, "status" | "evidence" | "findings" | "metadata">) { return result.status === "completed" ? Math.min(95, 55 + result.evidence.filter((e) => e.value && e.value !== "unavailable").length * 8) : 0; }
  evidence(result: Pick<ProviderResult, "evidence">) { return result.evidence; }
  correlation(result: Pick<ProviderResult, "providerId" | "evidence" | "findings">) { return result.evidence.map((item) => ({ providerId: result.providerId, evidenceId: item.id, label: item.label, value: item.value })); }
  failureReason(error: unknown): ProviderFailureReason { return failure(error); }
}

export class SSLProvider extends ProductionProvider {
  readonly id = "ssl"; readonly name = "SSL Certificate Provider"; readonly version = "2.0.0"; readonly category = "ssl" as const;
  async health(): Promise<ProviderHealth> { return { providerId: this.id, providerVersion: this.version, status: "healthy", checkedAt: new Date().toISOString(), metadata: { category: this.category, providerName: this.name, integration: CERT_SOURCE } }; }
  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const target = this.normalize(context); if (!target.supported) throw new Error("Not Supported");
    const cert = await new Promise<tls.PeerCertificate>((resolve, reject) => { const socket = tls.connect({ host: target.domain, port: 443, servername: target.domain, rejectUnauthorized: false, timeout: context.providerTimeoutMs?.ssl ?? (context.executionProfile === "free_preview" ? FREE_PREVIEW_TIMEOUTS_MS.ssl : TIMEOUT_MS) }, () => { const c = socket.getPeerCertificate(); socket.end(); if (c && Object.keys(c).length) resolve(c); else reject(new Error("Unavailable")); }); socket.on("timeout", () => { socket.destroy(); reject(new Error("Timeout")); }); socket.on("error", reject); });
    const validToMs = Date.parse(cert.valid_to); const days = Number.isNaN(validToMs) ? undefined : Math.ceil((validToMs - Date.now()) / 86_400_000);
    const findings: ProviderFinding[] = days !== undefined && days < 14 ? [{ id: "ssl-expiring", title: "SSL certificate expires soon", description: `Certificate expires in ${days} days.`, severity: days < 0 ? "high" : "medium" }] : [];
    return { findings, evidence: [{ id: "ssl-domain", type: "observation", label: "SSL certificate domain", value: target.domain, source: CERT_SOURCE }, { id: "ssl-issuer", type: "document", label: "SSL certificate issuer", value: String(cert.issuer?.O || cert.issuer?.CN || "unavailable"), source: CERT_SOURCE }, { id: "ssl-valid-to", type: "document", label: "SSL certificate expiration", value: cert.valid_to || "unavailable", source: CERT_SOURCE }, { id: "ssl-subject-alt-names", type: "document", label: "SSL subject alternative names", value: Array.isArray(cert.subjectaltname) ? cert.subjectaltname.join(", ") : cert.subjectaltname || "unavailable", source: CERT_SOURCE }], metadata: { integrationStatus: "connected", lookupPerformed: true, domain: target.domain, validToDays: days } };
  }
}


export class DNSProvider extends ProductionProvider {
  readonly id = "dns"; readonly name = "DNS Provider"; readonly version = "1.0.0"; readonly category = "dns" as const;
  async health(): Promise<ProviderHealth> { return { providerId: this.id, providerVersion: this.version, status: "healthy", checkedAt: new Date().toISOString(), metadata: { category: this.category, providerName: this.name, integration: DNS_SOURCE, recordTypes: DNS_RECORD_TYPES } }; }
  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const target = this.normalize(context); if (!target.supported) throw new Error("DNS lookup requires a domain target.");
    const records = {} as DnsRecords; const lookupErrors: Partial<Record<DnsRecordType, string>> = {};
    await Promise.all(DNS_RECORD_TYPES.map(async (recordType) => { try { records[recordType] = await withTimeout(resolveRecord(target.domain, recordType), context.providerTimeoutMs?.dns ?? (context.executionProfile === "free_preview" ? FREE_PREVIEW_TIMEOUTS_MS.dns : TIMEOUT_MS), `${recordType} DNS lookup`); } catch (error) { records[recordType] = []; lookupErrors[recordType] = formatDnsError(error); } }));
    const evidence: ProviderEvidence[] = [{ id: "dns-domain", type: "observation", label: "Normalized domain", value: target.domain, source: DNS_SOURCE }, ...DNS_RECORD_TYPES.map((recordType) => ({ id: `dns-${recordType.toLowerCase()}-records`, type: "observation" as const, label: `${recordType} records`, value: records[recordType].join(", ") || "unavailable", source: DNS_SOURCE }))];
    return { findings: [], evidence, metadata: { integrationStatus: "connected", lookupPerformed: true, lookupProtocol: "dns", domain: target.domain, recordTypes: DNS_RECORD_TYPES, records, lookupErrors, scanMode: context.scanMode, platform: context.platform, intakeId: context.intakeId } };
  }
}

export class WHOISProvider extends ProductionProvider {
  readonly id = "whois"; readonly name = "WHOIS Provider"; readonly version = "1.0.0"; readonly category = "whois" as const;
  async health(): Promise<ProviderHealth> { return { providerId: this.id, providerVersion: this.version, status: "healthy", checkedAt: new Date().toISOString(), metadata: { category: this.category, providerName: this.name, integration: "rdap", endpoint: RDAP_BASE_URL } }; }
  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const target = this.normalize(context); if (!target.supported) throw new Error("WHOIS lookup requires a domain target.");
    const timeout = timeoutSignal(context.providerTimeoutMs?.whois ?? (context.executionProfile === "free_preview" ? FREE_PREVIEW_TIMEOUTS_MS.whois : TIMEOUT_MS));
    const response = await fetch(`${RDAP_BASE_URL}${encodeURIComponent(target.domain)}`, { signal: timeout.signal, headers: { accept: "application/rdap+json, application/json" } }).finally(timeout.done);
    if (!response.ok) throw new Error(`RDAP lookup failed for ${target.domain}: ${response.status}`);
    const payload = (await response.json()) as RdapResponse; const registrationDate = findEventDate(payload.events, "registration"); const expirationDate = findEventDate(payload.events, "expiration"); const ageDays = domainAgeDays(registrationDate); const statuses = payload.status || []; const nameservers = (payload.nameservers || []).map((nameserver) => nameserver.ldhName).filter(Boolean) as string[];
    const findings: ProviderFinding[] = [];
    if (ageDays !== undefined && ageDays < 90) findings.push({ id: "whois-new-domain", title: "Domain registration is recent", description: `The domain appears to be ${ageDays} day${ageDays === 1 ? "" : "s"} old based on RDAP registration data.`, severity: ageDays < 30 ? "medium" : "low" });
    if (!registrationDate) findings.push({ id: "whois-registration-date-missing", title: "Domain registration date unavailable", description: "The RDAP response did not include a registration event date, reducing ownership-age validation confidence.", severity: "low" });
    const evidence: ProviderEvidence[] = [{ id: "whois-domain", type: "observation", label: "Normalized domain", value: target.domain, source: RDAP_BASE_URL }, { id: "whois-registration-date", type: "observation", label: "Registration date", value: registrationDate || "unavailable", source: RDAP_BASE_URL }, { id: "whois-expiration-date", type: "observation", label: "Expiration date", value: expirationDate || "unavailable", source: RDAP_BASE_URL }, { id: "whois-statuses", type: "observation", label: "Domain statuses", value: statuses.join(", ") || "unavailable", source: RDAP_BASE_URL }];
    return { findings, evidence, metadata: { integrationStatus: "connected", lookupPerformed: true, lookupProtocol: "rdap", domain: target.domain, registrationDate, expirationDate, ageDays, statuses, nameservers, rdapHandle: payload.handle, scanMode: context.scanMode, platform: context.platform, intakeId: context.intakeId } };
  }
}

export class AuthoritativeCompanyEvidenceProvider extends ProductionProvider { readonly id = "authoritative-company"; readonly name = "Authoritative Company Evidence Provider"; readonly version = "1.0.0"; readonly category = "business_profile" as const;
  async health(): Promise<ProviderHealth> { return { providerId: this.id, providerVersion: this.version, status: "healthy", checkedAt: new Date().toISOString(), metadata: { category: this.category, providerName: this.name, integration: "sec-company-tickers-exchange", authoritativeSource: SEC_COMPANY_TICKERS_EXCHANGE_URL } }; }
  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const target = publicCompanyTarget(context); if (!target.supported) throw new Error("Authoritative public-company lookup requires a ticker or CIK; domains, page titles and SSL certificates are not legal-identity sources.");
    const dataset = await fetchSecJson<SecCompanyTickerExchange>(SEC_COMPANY_TICKERS_EXCHANGE_URL);
    let row = dataset.data.find(([cik, , ticker]) => (target.cik && String(cik).padStart(10, "0") === target.cik) || (target.ticker && ticker.toUpperCase() === target.ticker));
    let submissions: { name?: string; website?: string; sic?: string; stateOfIncorporation?: string } | undefined;
    if (!row && target.domain) {
      for (const candidate of dataset.data) {
        const candidateCik = String(candidate[0]).padStart(10, "0");
        try { const candidateSubmissions = await fetchSecJson<typeof submissions>(`${SEC_SUBMISSIONS_URL}${candidateCik}.json`); if (normalizeSecDomain(candidateSubmissions?.website) === target.domain) { row = candidate; submissions = candidateSubmissions; break; } } catch {}
      }
    }
    if (!row) throw new Error(`SEC authoritative company lookup found no public-company row for ${target.ticker || target.cik || target.domain}`);
    const [cikNumber, legalName, ticker, exchange] = row; const cik = String(cikNumber).padStart(10, "0"); const submissionsUrl = `${SEC_SUBMISSIONS_URL}${cik}.json`;
    if (!submissions) { try { submissions = await fetchSecJson<typeof submissions>(submissionsUrl); } catch {} }
    const sic = submissions?.sic; const stateOfIncorporation = submissions?.stateOfIncorporation;
    const evidence: ProviderEvidence[] = [
      { id: `sec-${ticker.toLowerCase()}-legal-name`, type: "document", label: "Authoritative legal company name", value: legalName, source: SEC_COMPANY_TICKERS_EXCHANGE_URL },
      { id: `sec-${ticker.toLowerCase()}-ticker`, type: "document", label: "SEC ticker", value: ticker, source: SEC_COMPANY_TICKERS_EXCHANGE_URL },
      { id: `sec-${ticker.toLowerCase()}-exchange`, type: "document", label: "Exchange listing", value: exchange, source: SEC_COMPANY_TICKERS_EXCHANGE_URL },
      { id: `sec-${ticker.toLowerCase()}-cik`, type: "document", label: "SEC CIK", value: cik, source: SEC_COMPANY_TICKERS_EXCHANGE_URL },
    ];
    if (stateOfIncorporation) evidence.push({ id: `sec-${ticker.toLowerCase()}-incorporation-state`, type: "document", label: "State of incorporation", value: stateOfIncorporation, source: submissionsUrl });
    const reportedWebsite = normalizeSecDomain(submissions?.website);
    if (reportedWebsite) evidence.push({ id: `sec-${ticker.toLowerCase()}-website`, type: "document", label: "SEC company website", value: reportedWebsite, source: submissionsUrl });
    return { findings: [], evidence, metadata: { integrationStatus: "connected", lookupPerformed: true, authoritative: true, authority: "U.S. Securities and Exchange Commission", legalIdentitySourcePolicy: "Legal company identity is acquired only from SEC authoritative public-company data. Domains, website titles and SSL certificates are not used as legal-identity sources.", legalName: submissions?.name || legalName, ticker, exchange, cik, sic, stateOfIncorporation, sourceUrl: SEC_COMPANY_TICKERS_EXCHANGE_URL, submissionsUrl, resolverEvidence: { id: `sec:${cik}`, legalName: submissions?.name || legalName, ticker, exchange, domain: reportedWebsite || undefined, verified: true, verificationStatus: "authoritative", source: "sec_company_tickers_exchange_and_submissions", evidenceRefs: evidence.map((item) => item.id), observedAt: new Date().toISOString() } } };
  }
}

export class SecurityHeadersProvider extends ProductionProvider { readonly id = "security-headers"; readonly name = "HTTP Security Headers Provider"; readonly version = "2.0.0"; readonly category = "security_headers" as const;
  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const target = this.normalize(context); if (!target.supported || !target.websiteUrl) throw new Error("Not Supported"); const r = await acquireTimedSharedHttp(context); const required = ["strict-transport-security", "content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy"]; const evidence = required.map((h) => ({ id: `header-${h}`, type: "configuration" as const, label: `HTTP header ${h}`, value: r.ok ? r.headers.get(h) || "unavailable" : "unavailable", source: HEADER_SOURCE })); const findings = r.ok ? required.filter((h) => !r.headers.get(h)).map((h) => ({ id: `missing-${h}`, title: `Missing ${h} header`, description: `${target.domain} did not return ${h} in the HTTP response.`, severity: "low" as const })) : []; return { findings, evidence: [{ id: "headers-domain", type: "observation" as const, label: "HTTP headers domain", value: target.domain, source: HEADER_SOURCE }, ...evidence], metadata: { integrationStatus: "connected", lookupPerformed: true, domain: target.domain, status: r.statusCode, finalUrl: r.finalUrl, httpDiagnostics: r.diagnostics, httpAttempts: r.attempts, sharedHttpFetchCount: (context as MutableProviderContext).sharedHttpFetchCount } }; }
}

async function txt(domain: string) { try { return (await dns.resolveTxt(domain)).map((r) => r.join("")); } catch { return []; } }
export class SPFProvider extends ProductionProvider { readonly id = "spf"; readonly name = "SPF Provider"; readonly version = "2.0.0"; readonly category = "email_authentication" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported) throw new Error("Not Supported"); const records = (await txt(t.domain)).filter((r) => /^v=spf1/i.test(r)); return { findings: records.length ? [] : [{ id: "spf-missing", title: "SPF record missing", description: `${t.domain} did not publish a visible SPF TXT record.`, severity: "medium" as const }], evidence: [{ id: "spf-domain", type: "observation", label: "SPF domain", value: t.domain, source: DNS_SOURCE }, { id: "spf-record", type: "configuration", label: "SPF record", value: records.join(" | ") || "unavailable", source: DNS_SOURCE }], metadata: { integrationStatus: "connected", lookupPerformed: true, domain: t.domain, recordCount: records.length } }; } }
export class DMARCProvider extends ProductionProvider { readonly id = "dmarc"; readonly name = "DMARC Provider"; readonly version = "2.0.0"; readonly category = "email_authentication" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported) throw new Error("Not Supported"); const records = (await txt(`_dmarc.${t.domain}`)).filter((r) => /^v=dmarc1/i.test(r)); return { findings: records.length ? [] : [{ id: "dmarc-missing", title: "DMARC record missing", description: `${t.domain} did not publish a visible DMARC TXT record.`, severity: "medium" as const }], evidence: [{ id: "dmarc-domain", type: "observation", label: "DMARC domain", value: t.domain, source: DNS_SOURCE }, { id: "dmarc-record", type: "configuration", label: "DMARC record", value: records.join(" | ") || "unavailable", source: DNS_SOURCE }], metadata: { integrationStatus: "connected", lookupPerformed: true, domain: t.domain, recordCount: records.length } }; } }

export class BusinessProfileProvider extends ProductionProvider { readonly id = "business-profile"; readonly name = "Public Business Profile Provider"; readonly version = "2.0.0"; readonly category = "business_profile" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported || !t.websiteUrl) throw new Error("Not Supported"); const r = await acquireTimedSharedHttp(context); const title = r.diagnostics.responseWasHtml === false ? undefined : r.text.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim(); const org = r.text.match(/"@type"\s*:\s*"(?:Organization|LocalBusiness)"[\s\S]{0,2000}?"name"\s*:\s*"([^"]+)"/i)?.[1]; const blocked = isErrorPage(r); const outcome = !r.ok ? r.outcome : (blocked ? r.outcome : (org || title ? "completed_with_evidence" : "completed_no_extractable_evidence")); return { findings: [], evidence: [{ id: "profile-domain", type: "observation", label: "Business website domain", value: t.domain, source: r.finalUrl || r.requestedUrl }, { id: "profile-title", type: "document", label: "Business profile title", value: blocked ? "unavailable" : title || "unavailable", source: r.finalUrl || r.requestedUrl }, { id: "profile-organization", type: "document", label: "Business name", value: blocked ? "unavailable" : org || title || "unavailable", source: r.finalUrl || r.requestedUrl }], metadata: { integrationStatus: "connected", lookupPerformed: true, domain: t.domain, countrySupport: "global_public_web", httpOutcome: outcome, errorPageTitleRejected: blocked && Boolean(title), httpDiagnostics: r.diagnostics, httpAttempts: r.attempts, sharedHttpFetchCount: (context as MutableProviderContext).sharedHttpFetchCount } }; } }
type SecSearchSource = {
  file_date?: string;
  form?: string;
  display_names?: string[];
  root_forms?: string[];
  title?: string;
  summary?: string;
  description?: string;
  primary_doc_description?: string;
  items?: string | string[];
};
type SecSearchHit = { _id?: string; _source?: SecSearchSource; highlight?: Record<string, string | string[]> };
type SecSearchResponse = { hits?: { total?: { value?: number }; hits?: SecSearchHit[] } };

function readableSecText(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&(?:nbsp|#160);/gi, " ").replace(/\s+/g, " ").trim();
}

function secEventText(hit: SecSearchHit) {
  const source = hit._source;
  const highlightedText = Object.values(hit.highlight || {}).flatMap((value) => Array.isArray(value) ? value : [value]);
  const items = Array.isArray(source?.items) ? source.items : source?.items ? [source.items] : [];
  return [source?.title, source?.summary, source?.description, source?.primary_doc_description, ...items, ...highlightedText]
    .filter((value): value is string => Boolean(value))
    .map(readableSecText)
    .filter(Boolean)
    .join(" | ");
}
export class ReputationProvider extends ProductionProvider {
  readonly id = "reputation"; readonly name = "Regulatory and Reputation Evidence Provider"; readonly version = "4.1.0"; readonly category = "reputation" as const;
  async health(): Promise<ProviderHealth> { return { providerId: this.id, providerVersion: this.version, status: "healthy", checkedAt: new Date().toISOString(), metadata: { category: this.category, providerName: this.name, integration: "sec-edgar-full-text-search", authoritativeSource: SEC_FULL_TEXT_SEARCH_URL } }; }
  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const query = (context.requestedTarget || context.target).trim();
    if (!query) throw new Error("Not Supported");
    const url = new URL(SEC_FULL_TEXT_SEARCH_URL); url.searchParams.set("q", query); url.searchParams.set("from", "0"); url.searchParams.set("size", "10");
    const payload = await fetchSecJson<SecSearchResponse>(url.toString()); const hits = payload.hits?.hits || [];
    const evidence: ProviderEvidence[] = [{ id: "reputation-query", type: "observation", label: "Regulatory records query", value: query, source: url.toString() }];
    for (const [index, hit] of hits.entries()) {
      const source = hit._source;
      const eventText = secEventText(hit);
      const regulatoryClassification = classifyRegulatoryRecord({ form: source?.form, rootForms: source?.root_forms, names: source?.display_names, text: eventText });
      evidence.push({ id: `sec-record-${index + 1}`, type: "document", label: regulatoryClassification === "routine" ? "Routine SEC filing" : `SEC ${regulatoryClassification.replaceAll("_", " ")}`, value: [source?.form, source?.file_date, ...(source?.display_names || []), eventText].filter(Boolean).join(" | ") || "SEC filing", source: url.toString(), regulatoryClassification, authoritative: true });
    }
    const classificationCounts = evidence.reduce<Record<string, number>>((counts, item) => { if (item.regulatoryClassification) counts[item.regulatoryClassification] = (counts[item.regulatoryClassification] || 0) + 1; return counts; }, {});
    const findings: ProviderFinding[] = evidence.filter((item) => isAdverseRegulatoryClassification(item.regulatoryClassification)).map((item) => ({ id: `${item.id}-adverse`, title: item.label, description: `An authoritative SEC record was classified as ${item.regulatoryClassification?.replaceAll("_", " ")}.`, severity: item.regulatoryClassification === "criminal_enforcement" || item.regulatoryClassification === "sanctions" ? "critical" : "high" }));
    return { findings, evidence, metadata: { integrationStatus: "connected", lookupPerformed: true, authoritative: true, authority: "U.S. Securities and Exchange Commission", sourceType: "live_authoritative_public_records", queryUrl: url.toString(), recordCount: hits.length, totalRecords: payload.hits?.total?.value || 0, recordsWithEventText: hits.filter((hit) => Boolean(secEventText(hit))).length, classificationCounts, assessmentPolicy: "Routine filings support public-record coverage. Filing titles, summaries, descriptions, item labels, and full-text search highlights are classified when the SEC returns them. Authoritative regulatory actions, litigation, criminal enforcement, bankruptcy, and sanctions are adverse evidence classifications." } };
  }
}
export class WebsiteMetadataProvider extends ProductionProvider { readonly id = "website-metadata"; readonly name = "Website Metadata Provider"; readonly version = "1.0.0"; readonly category = "business_profile" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported || !t.websiteUrl) throw new Error("Not Supported"); const r = await acquireTimedSharedHttp(context); const desc = r.text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1]; return { findings: [], evidence: [{ id: "metadata-domain", type: "observation", label: "Website domain", value: t.domain, source: r.finalUrl || r.requestedUrl }, { id: "metadata-description", type: "document", label: "Website metadata description", value: desc || "unavailable", source: r.finalUrl || r.requestedUrl }], metadata: { integrationStatus: "connected", lookupPerformed: true, domain: t.domain, httpOutcome: r.outcome, httpDiagnostics: r.diagnostics, httpAttempts: r.attempts, sharedHttpFetchCount: (context as MutableProviderContext).sharedHttpFetchCount } }; } }

function stripScriptsAndMetadata(html: string) { return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<meta[^>]*>/gi, " "); }
function validPhone(value: string) { const trimmed = value.trim(); if (/\b\d{4}-\d{2}-\d{2}\b/.test(trimmed)) return false; const digits = trimmed.replace(/\D/g, ""); if (digits.length < 7 || digits.length > 15) return false; if (/^\d{8,}$/.test(trimmed) && !/^\+/.test(trimmed)) return false; return true; }
function extractVisiblePhones(html: string) { const telLinks = Array.from(html.matchAll(/href=["']tel:([^"']+)["']/gi)).map((m) => m[1]); const schemaPhones = Array.from(html.matchAll(/"telephone"\s*:\s*"([^"]+)"/gi)).map((m) => m[1]); const visible = stripScriptsAndMetadata(html); const contextual = Array.from(visible.matchAll(/(?:phone|tel|telephone|contact|call)[^+\d]{0,40}(\+?\d[\d\s().-]{5,}\d)/gi)).map((m) => m[1]); return Array.from(new Set([...telLinks, ...schemaPhones, ...contextual].map((p) => p.trim()).filter(validPhone))).slice(0, 5); }
export class ContactDiscoveryProvider extends ProductionProvider { readonly id = "contact-discovery"; readonly name = "Contact Discovery Provider"; readonly version = "1.0.0"; readonly category = "business_profile" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported || !t.websiteUrl) throw new Error("Not Supported"); const r = await acquireTimedSharedHttp(context); const emails = Array.from(new Set(r.text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])); const phones = extractVisiblePhones(r.text); return { findings: [], evidence: [{ id: "contact-email", type: "observation", label: "Discovered contact email", value: emails[0] || t.email || "unavailable", source: r.finalUrl || r.requestedUrl }, { id: "contact-phone", type: "observation", label: "Discovered contact phone", value: phones[0] || "unavailable", source: r.finalUrl || r.requestedUrl }], metadata: { integrationStatus: "connected", lookupPerformed: true, emailCount: emails.length, phoneCount: phones.length, httpOutcome: r.outcome, httpDiagnostics: r.diagnostics, httpAttempts: r.attempts, sharedHttpFetchCount: (context as MutableProviderContext).sharedHttpFetchCount } }; } }
export class SocialProfileProvider extends ProductionProvider { readonly id = "social-profile"; readonly name = "Social Profile Discovery Provider"; readonly version = "1.0.0"; readonly category = "business_profile" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported || !t.websiteUrl) throw new Error("Not Supported"); const r = await acquireTimedSharedHttp(context); const links = Array.from(new Set((r.text.match(/https?:\/\/[^"'\s<>]+/gi) || []).filter((u) => WELL_KNOWN_SOCIALS.some((s) => u.toLowerCase().includes(s))))).slice(0, 10); return { findings: [], evidence: [{ id: "social-links", type: "observation", label: "Social profile links", value: links.join(", ") || "unavailable", source: r.finalUrl || r.requestedUrl }], metadata: { integrationStatus: "connected", lookupPerformed: true, socialProfileCount: links.length, httpOutcome: r.outcome, httpDiagnostics: r.diagnostics, httpAttempts: r.attempts, sharedHttpFetchCount: (context as MutableProviderContext).sharedHttpFetchCount } }; } }
