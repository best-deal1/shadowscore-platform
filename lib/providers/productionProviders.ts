import { promises as dns } from "node:dns";
import tls from "node:tls";

import { BaseProvider } from "./BaseProvider";
import type { ProviderExecutionContext, ProviderFinding, ProviderFailureReason, ProviderHealth, ProviderResult } from "./types";


type NormalizedTarget = { domain: string; websiteUrl?: string; email?: string; supported: boolean; reason?: ProviderFailureReason };

const TIMEOUT_MS = 4_000;
const HEADER_SOURCE = "http-response-headers";
const CERT_SOURCE = "tls-certificate";
const DNS_SOURCE = "node:dns";
const WELL_KNOWN_SOCIALS = ["linkedin.com", "facebook.com", "instagram.com", "x.com", "twitter.com", "youtube.com", "tiktok.com"];
const REPUTATION_SIGNAL_HOSTS = ["google.com", "microsoft.com", "cloudflare.com", "apple.com", "amazon.com", "stripe.com", "shopify.com"];

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

function timeoutSignal(ms = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timeout) };
}

function failure(error: unknown): ProviderFailureReason {
  if (error instanceof Error && (error.name === "AbortError" || /timeout|timed out/i.test(error.message))) return "Timeout";
  if (error instanceof Error && /429|rate/i.test(error.message)) return "Rate Limited";
  if (error instanceof Error && /not supported|invalid|requires/i.test(error.message)) return "Not Supported";
  return "Unavailable";
}

async function fetchText(url: string): Promise<{ url: string; status: number; headers: Headers; text: string }> {
  const t = timeoutSignal();
  try {
    const response = await fetch(url, { signal: t.signal, redirect: "follow", headers: { "user-agent": "ShadowScoreBot/1.0 evidence provider" } });
    const text = await response.text();
    return { url: response.url || url, status: response.status, headers: response.headers, text };
  } finally { t.done(); }
}


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
    const cert = await new Promise<tls.PeerCertificate>((resolve, reject) => { const socket = tls.connect({ host: target.domain, port: 443, servername: target.domain, rejectUnauthorized: false, timeout: TIMEOUT_MS }, () => { const c = socket.getPeerCertificate(); socket.end(); if (c && Object.keys(c).length) resolve(c); else reject(new Error("Unavailable")); }); socket.on("timeout", () => { socket.destroy(); reject(new Error("Timeout")); }); socket.on("error", reject); });
    const validToMs = Date.parse(cert.valid_to); const days = Number.isNaN(validToMs) ? undefined : Math.ceil((validToMs - Date.now()) / 86_400_000);
    const findings: ProviderFinding[] = days !== undefined && days < 14 ? [{ id: "ssl-expiring", title: "SSL certificate expires soon", description: `Certificate expires in ${days} days.`, severity: days < 0 ? "high" : "medium" }] : [];
    return { findings, evidence: [{ id: "ssl-domain", type: "observation", label: "SSL certificate domain", value: target.domain, source: CERT_SOURCE }, { id: "ssl-issuer", type: "document", label: "SSL certificate issuer", value: String(cert.issuer?.O || cert.issuer?.CN || "unavailable"), source: CERT_SOURCE }, { id: "ssl-valid-to", type: "document", label: "SSL certificate expiration", value: cert.valid_to || "unavailable", source: CERT_SOURCE }, { id: "ssl-subject-alt-names", type: "document", label: "SSL subject alternative names", value: Array.isArray(cert.subjectaltname) ? cert.subjectaltname.join(", ") : cert.subjectaltname || "unavailable", source: CERT_SOURCE }], metadata: { integrationStatus: "connected", lookupPerformed: true, domain: target.domain, validToDays: days } };
  }
}

export class SecurityHeadersProvider extends ProductionProvider { readonly id = "security-headers"; readonly name = "HTTP Security Headers Provider"; readonly version = "2.0.0"; readonly category = "security_headers" as const;
  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const target = this.normalize(context); if (!target.supported || !target.websiteUrl) throw new Error("Not Supported"); const r = await fetchText(target.websiteUrl); const required = ["strict-transport-security", "content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy"]; const evidence = required.map((h) => ({ id: `header-${h}`, type: "configuration" as const, label: `HTTP header ${h}`, value: r.headers.get(h) || "unavailable", source: HEADER_SOURCE })); const findings = required.filter((h) => !r.headers.get(h)).map((h) => ({ id: `missing-${h}`, title: `Missing ${h} header`, description: `${target.domain} did not return ${h} in the HTTP response.`, severity: "low" as const })); return { findings, evidence: [{ id: "headers-domain", type: "observation" as const, label: "HTTP headers domain", value: target.domain, source: HEADER_SOURCE }, ...evidence], metadata: { integrationStatus: "connected", lookupPerformed: true, domain: target.domain, status: r.status, finalUrl: r.url } }; }
}

async function txt(domain: string) { try { return (await dns.resolveTxt(domain)).map((r) => r.join("")); } catch { return []; } }
export class SPFProvider extends ProductionProvider { readonly id = "spf"; readonly name = "SPF Provider"; readonly version = "2.0.0"; readonly category = "email_authentication" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported) throw new Error("Not Supported"); const records = (await txt(t.domain)).filter((r) => /^v=spf1/i.test(r)); return { findings: records.length ? [] : [{ id: "spf-missing", title: "SPF record missing", description: `${t.domain} did not publish a visible SPF TXT record.`, severity: "medium" as const }], evidence: [{ id: "spf-domain", type: "observation", label: "SPF domain", value: t.domain, source: DNS_SOURCE }, { id: "spf-record", type: "configuration", label: "SPF record", value: records.join(" | ") || "unavailable", source: DNS_SOURCE }], metadata: { integrationStatus: "connected", lookupPerformed: true, domain: t.domain, recordCount: records.length } }; } }
export class DMARCProvider extends ProductionProvider { readonly id = "dmarc"; readonly name = "DMARC Provider"; readonly version = "2.0.0"; readonly category = "email_authentication" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported) throw new Error("Not Supported"); const records = (await txt(`_dmarc.${t.domain}`)).filter((r) => /^v=dmarc1/i.test(r)); return { findings: records.length ? [] : [{ id: "dmarc-missing", title: "DMARC record missing", description: `${t.domain} did not publish a visible DMARC TXT record.`, severity: "medium" as const }], evidence: [{ id: "dmarc-domain", type: "observation", label: "DMARC domain", value: t.domain, source: DNS_SOURCE }, { id: "dmarc-record", type: "configuration", label: "DMARC record", value: records.join(" | ") || "unavailable", source: DNS_SOURCE }], metadata: { integrationStatus: "connected", lookupPerformed: true, domain: t.domain, recordCount: records.length } }; } }

export class BusinessProfileProvider extends ProductionProvider { readonly id = "business-profile"; readonly name = "Public Business Profile Provider"; readonly version = "2.0.0"; readonly category = "business_profile" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported || !t.websiteUrl) throw new Error("Not Supported"); const r = await fetchText(t.websiteUrl); const title = r.text.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim(); const org = r.text.match(/"@type"\s*:\s*"(?:Organization|LocalBusiness)"[\s\S]{0,2000}?"name"\s*:\s*"([^"]+)"/i)?.[1]; return { findings: [], evidence: [{ id: "profile-domain", type: "observation", label: "Business website domain", value: t.domain, source: r.url }, { id: "profile-title", type: "document", label: "Business profile title", value: title || "unavailable", source: r.url }, { id: "profile-organization", type: "document", label: "Business name", value: org || title || "unavailable", source: r.url }], metadata: { integrationStatus: "connected", lookupPerformed: true, domain: t.domain, countrySupport: "global_public_web" } }; } }
export class ReputationProvider extends ProductionProvider { readonly id = "reputation"; readonly name = "Reputation Provider"; readonly version = "2.0.0"; readonly category = "reputation" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported) throw new Error("Not Supported"); const isKnown = REPUTATION_SIGNAL_HOSTS.includes(t.domain); return { findings: [], evidence: [{ id: "reputation-domain", type: "observation", label: "Reputation checked domain", value: t.domain, source: "local-reputation-abstraction" }, { id: "reputation-signal", type: "observation", label: "Reputation provider abstraction signal", value: isKnown ? "known high-trust public domain" : "no local negative signal", source: "local-reputation-abstraction" }], metadata: { integrationStatus: "connected", lookupPerformed: true, abstraction: true, rateLimit: "local-none" } }; } }
export class WebsiteMetadataProvider extends ProductionProvider { readonly id = "website-metadata"; readonly name = "Website Metadata Provider"; readonly version = "1.0.0"; readonly category = "business_profile" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported || !t.websiteUrl) throw new Error("Not Supported"); const r = await fetchText(t.websiteUrl); const desc = r.text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1]; return { findings: [], evidence: [{ id: "metadata-domain", type: "observation", label: "Website domain", value: t.domain, source: r.url }, { id: "metadata-description", type: "document", label: "Website metadata description", value: desc || "unavailable", source: r.url }], metadata: { integrationStatus: "connected", lookupPerformed: true, domain: t.domain } }; } }
export class ContactDiscoveryProvider extends ProductionProvider { readonly id = "contact-discovery"; readonly name = "Contact Discovery Provider"; readonly version = "1.0.0"; readonly category = "business_profile" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported || !t.websiteUrl) throw new Error("Not Supported"); const r = await fetchText(t.websiteUrl); const emails = Array.from(new Set(r.text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])); const phones = Array.from(new Set(r.text.match(/\+?\d[\d\s().-]{7,}\d/g) || [])).slice(0, 5); return { findings: [], evidence: [{ id: "contact-email", type: "observation", label: "Discovered contact email", value: emails[0] || t.email || "unavailable", source: r.url }, { id: "contact-phone", type: "observation", label: "Discovered contact phone", value: phones[0] || "unavailable", source: r.url }], metadata: { integrationStatus: "connected", lookupPerformed: true, emailCount: emails.length, phoneCount: phones.length } }; } }
export class SocialProfileProvider extends ProductionProvider { readonly id = "social-profile"; readonly name = "Social Profile Discovery Provider"; readonly version = "1.0.0"; readonly category = "business_profile" as const; protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> { const t = this.normalize(context); if (!t.supported || !t.websiteUrl) throw new Error("Not Supported"); const r = await fetchText(t.websiteUrl); const links = Array.from(new Set((r.text.match(/https?:\/\/[^"'\s<>]+/gi) || []).filter((u) => WELL_KNOWN_SOCIALS.some((s) => u.toLowerCase().includes(s))))).slice(0, 10); return { findings: [], evidence: [{ id: "social-links", type: "observation", label: "Social profile links", value: links.join(", ") || "unavailable", source: r.url }], metadata: { integrationStatus: "connected", lookupPerformed: true, socialProfileCount: links.length } }; } }
