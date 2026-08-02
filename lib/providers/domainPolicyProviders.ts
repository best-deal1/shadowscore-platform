import { promises as dns } from "node:dns";

import { ProductionProvider, normalizeProviderTarget } from "./productionProviders";
import type { ProviderExecutionContext, ProviderFinding, ProviderResult } from "./types";

const DEFAULT_TIMEOUT_MS = 4_000;
const MAX_DOCUMENT_BYTES = 256_000;
const DEFAULT_DKIM_SELECTORS = ["default", "google", "selector1", "selector2", "k1"];

type PublicDocument = {
  url: string;
  status: number;
  body: string;
  contentType: string;
  truncated: boolean;
};

async function fetchPublicDocument(url: string, timeoutMs: number): Promise<PublicDocument> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "ShadowScoreBot/1.0 (+https://shadowscore.io; evidence collection)", accept: "text/plain,*/*;q=0.5" },
    });
    const raw = await response.text();
    const body = raw.slice(0, MAX_DOCUMENT_BYTES);
    return { url: response.url || url, status: response.status, body, contentType: response.headers.get("content-type") || "", truncated: raw.length > body.length };
  } finally {
    clearTimeout(timer);
  }
}

function documentTimeout(context: ProviderExecutionContext) {
  return context.providerTimeoutMs?.http ?? DEFAULT_TIMEOUT_MS;
}

export class RobotsTxtProvider extends ProductionProvider {
  readonly id = "robots-txt";
  readonly name = "robots.txt Provider";
  readonly version = "1.0.0";
  readonly category = "compliance" as const;

  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const target = normalizeProviderTarget(context);
    if (!target.supported || !target.websiteUrl) throw new Error("Not Supported");
    const requestedUrl = new URL("/robots.txt", target.websiteUrl).toString();
    const document = await fetchPublicDocument(requestedUrl, documentTimeout(context));
    const published = document.status >= 200 && document.status < 300 && Boolean(document.body.trim());
    const directives = published ? document.body.split(/\r?\n/).filter((line) => /^(?:user-agent|allow|disallow|sitemap)\s*:/i.test(line.trim())) : [];
    return {
      findings: [],
      evidence: [
        { id: "robots-status", type: "observation", label: "robots.txt HTTP status", value: String(document.status), source: document.url },
        { id: "robots-document", type: "document", label: "robots.txt directives", value: directives.join("\n") || "unavailable", source: document.url },
      ],
      metadata: { integrationStatus: "connected", lookupPerformed: true, domain: target.domain, published, directiveCount: directives.length, contentType: document.contentType, truncated: document.truncated },
    };
  }
}

export class SecurityTxtProvider extends ProductionProvider {
  readonly id = "security-txt";
  readonly name = "security.txt Provider";
  readonly version = "1.0.0";
  readonly category = "compliance" as const;

  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const target = normalizeProviderTarget(context);
    if (!target.supported || !target.websiteUrl) throw new Error("Not Supported");
    const requestedUrl = new URL("/.well-known/security.txt", target.websiteUrl).toString();
    const document = await fetchPublicDocument(requestedUrl, documentTimeout(context));
    const published = document.status >= 200 && document.status < 300 && Boolean(document.body.trim());
    const contacts = published ? Array.from(document.body.matchAll(/^Contact:\s*(.+)$/gim), (match) => match[1].trim()) : [];
    const expires = published ? document.body.match(/^Expires:\s*(.+)$/im)?.[1]?.trim() : undefined;
    const expired = expires ? Date.parse(expires) < Date.now() : false;
    const findings: ProviderFinding[] = [];
    if (published && contacts.length === 0) findings.push({ id: "security-txt-contact-missing", title: "security.txt contact missing", description: `${target.domain} publishes security.txt without a Contact field.`, severity: "low" });
    if (expired) findings.push({ id: "security-txt-expired", title: "security.txt expired", description: `${target.domain} publishes an expired security.txt file.`, severity: "low" });
    return {
      findings,
      evidence: [
        { id: "security-txt-status", type: "observation", label: "security.txt HTTP status", value: String(document.status), source: document.url },
        { id: "security-txt-contact", type: "configuration", label: "Security contact", value: contacts.join(" | ") || "unavailable", source: document.url },
        { id: "security-txt-expires", type: "configuration", label: "security.txt expiration", value: expires || "unavailable", source: document.url },
      ],
      metadata: { integrationStatus: "connected", lookupPerformed: true, domain: target.domain, published, contactCount: contacts.length, expired, contentType: document.contentType, truncated: document.truncated },
    };
  }
}

export type DkimRecord = { selector: string; name: string; value: string };

export async function discoverDkimRecords(
  domain: string,
  selectors = DEFAULT_DKIM_SELECTORS,
  resolver: (name: string) => Promise<string[][]> = dns.resolveTxt,
): Promise<DkimRecord[]> {
  const uniqueSelectors = Array.from(new Set(selectors.map((selector) => selector.trim().toLowerCase()).filter(Boolean))).slice(0, 20);
  const records = await Promise.all(uniqueSelectors.map(async (selector) => {
    const name = `${selector}._domainkey.${domain}`;
    const values = await resolver(name).catch(() => []);
    return values.map((parts) => ({ selector, name, value: parts.join("") })).filter((record) => /^v=dkim1\s*;/i.test(record.value));
  }));
  return records.flat();
}

export class DKIMProvider extends ProductionProvider {
  readonly id = "dkim";
  readonly name = "DKIM Provider";
  readonly version = "1.0.0";
  readonly category = "email_authentication" as const;

  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const target = normalizeProviderTarget(context);
    if (!target.supported) throw new Error("Not Supported");
    const configured = context.dkimSelectors || [];
    const selectors = configured.length ? configured : DEFAULT_DKIM_SELECTORS;
    const records = await discoverDkimRecords(target.domain, selectors);
    return {
      findings: [],
      evidence: [
        { id: "dkim-domain", type: "observation", label: "DKIM domain", value: target.domain, source: "node:dns" },
        { id: "dkim-records", type: "configuration", label: "Discovered DKIM records", value: records.map((record) => `${record.selector}: ${record.value}`).join(" | ") || "unavailable", source: "DNS TXT records" },
      ],
      metadata: { integrationStatus: "connected", lookupPerformed: true, domain: target.domain, selectorsChecked: selectors, selectorSource: configured.length ? "request" : "common_selector_discovery", recordCount: records.length },
    };
  }
}
