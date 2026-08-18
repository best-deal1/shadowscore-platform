import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";

export type FirstPartyEntity = {
  type: "Email" | "Person" | "Role" | "Organization" | "Phone";
  value: string;
  evidenceUrls: string[];
};

export type FirstPartyRelationship = {
  from: string;
  type: "has role" | "works at" | "uses email" | "uses phone";
  to: string;
  evidenceUrl: string;
};

export type FirstPartyResolution = {
  originalInput: string;
  inputType: "email" | "domain" | "url";
  resolvedDomain: string;
  discovery: {
    homepageFetched: boolean;
    sitemapFetched: boolean;
    internalLinksDiscovered: number;
    sitemapUrlsDiscovered: number;
    totalUrlsDiscovered: number;
    totalUrlsFetched: number;
    failures: Array<{ url: string; reason: string }>;
  };
  entities: FirstPartyEntity[];
  relationships: FirstPartyRelationship[];
  evidenceUrls: string[];
};

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type LookupAddress = { address: string; family: 4 | 6 };
type LookupLike = (hostname: string) => Promise<LookupAddress[]>;
const MAX_URLS = 24;
const MAX_REDIRECTS = 5;
const MAX_SITEMAP_INDEXES = 3;
const USER_AGENT = "ShadowScore First-Party Intelligence/1.0 (+https://shadowscore.com)";

function ipv4Bytes(address: string) {
  const bytes = address.split(".").map(Number);
  return bytes.length === 4 && bytes.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) ? bytes : undefined;
}

function ipv6Bytes(address: string) {
  const withoutZone = address.toLowerCase().split("%")[0];
  const halves = withoutZone.split("::");
  if (halves.length > 2) return undefined;
  const expand = (part: string) => part ? part.split(":") : [];
  let left = expand(halves[0]);
  let right = expand(halves[1] || "");
  const convertIpv4 = (items: string[]) => items.flatMap((item) => {
    const bytes = ipv4Bytes(item);
    return bytes ? [((bytes[0] << 8) | bytes[1]).toString(16), ((bytes[2] << 8) | bytes[3]).toString(16)] : [item];
  });
  left = convertIpv4(left); right = convertIpv4(right);
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) return undefined;
  const groups = [...left, ...Array(missing).fill("0"), ...right];
  if (groups.length !== 8 || groups.some((item) => !/^[0-9a-f]{1,4}$/.test(item))) return undefined;
  return groups.flatMap((item) => { const value = Number.parseInt(item, 16); return [value >> 8, value & 255]; });
}

/** Reject every non-global address class before the crawler opens a socket. */
export function isPublicIpAddress(address: string) {
  if (isIP(address) === 4) {
    const b = ipv4Bytes(address)!;
    return !(b[0] === 0 || b[0] === 10 || b[0] === 127 || b[0] >= 224
      || (b[0] === 100 && b[1] >= 64 && b[1] <= 127)
      || (b[0] === 169 && b[1] === 254) || (b[0] === 172 && b[1] >= 16 && b[1] <= 31)
      || (b[0] === 192 && b[1] === 0) || (b[0] === 192 && b[1] === 168)
      || (b[0] === 198 && (b[1] === 18 || b[1] === 19))
      || (b[0] === 198 && b[1] === 51 && b[2] === 100)
      || (b[0] === 203 && b[1] === 0 && b[2] === 113));
  }
  if (isIP(address) === 6) {
    const b = ipv6Bytes(address)!;
    const mapped = b.slice(0, 10).every((part) => part === 0) && b[10] === 255 && b[11] === 255;
    if (mapped) return isPublicIpAddress(b.slice(12).join("."));
    return !(b.every((part) => part === 0) || (b.slice(0, 15).every((part) => part === 0) && b[15] === 1)
      || (b[0] & 0xfe) === 0xfc || (b[0] === 0xfe && (b[1] & 0xc0) === 0x80) || b[0] === 0xff
      || (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x0d && b[3] === 0xb8)
      || (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x00 && b[3] === 0x02)
      || (b[0] === 0x01 && b.slice(1, 8).every((part) => part === 0)));
  }
  return false;
}

const defaultLookup: LookupLike = async (hostname) => (await dnsLookup(hostname, { all: true, verbatim: true })) as LookupAddress[];

async function validatedAddresses(hostname: string, lookup: LookupLike) {
  const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) as 4 | 6 }] : await lookup(hostname);
  if (!addresses.length || addresses.some(({ address }) => !isPublicIpAddress(address))) throw new Error("Destination resolves to a non-public network address.");
  return addresses;
}

function pinnedHttpsFetch(url: URL, init: RequestInit, addresses: LookupAddress[]) {
  return new Promise<Response>((resolve, reject) => {
    const selected = addresses[0];
    const request = httpsRequest(url, {
      method: "GET", headers: Object.fromEntries(new Headers(init.headers)), signal: init.signal || undefined,
      lookup: (_hostname, _options, callback) => callback(null, selected.address, selected.family),
    }, (response) => {
      const chunks: Buffer[] = []; let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 2_000_000) request.destroy(new Error("Response exceeded the fetch size limit.")); else chunks.push(chunk);
      });
      response.on("end", () => resolve(new Response(Buffer.concat(chunks), { status: response.statusCode || 500, headers: response.headers as HeadersInit })));
    });
    request.on("error", reject); request.end();
  });
}

async function safeFetch(start: string, domain: string, fetcher: FetchLike | undefined, lookup: LookupLike, timeoutMs: number) {
  let current = new URL(start);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    if (current.protocol !== "https:" || current.hostname.toLowerCase().replace(/^www\./, "") !== domain) throw new Error("Redirect left the first-party HTTPS domain.");
    const addresses = await validatedAddresses(current.hostname, lookup);
    const init = { redirect: "manual" as const, signal: AbortSignal.timeout(timeoutMs), headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.5" } };
    // Native requests use the validated address directly, preventing a second DNS lookup from rebinding the connection.
    const response = fetcher ? await fetcher(current, init) : await pinnedHttpsFetch(current, init, addresses);
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, url: current.href };
    const location = response.headers.get("location");
    if (!location) throw new Error("Redirect response has no location.");
    current = new URL(location, current);
  }
  throw new Error("Too many redirects.");
}

export function resolutionTarget(input: string) {
  const value = input.trim();
  const email = /^[^\s@]+@([^\s@]+)$/i.exec(value);
  if (email) return { originalInput: value.toLowerCase(), inputType: "email" as const, domain: email[1].toLowerCase().replace(/^www\./, "") };
  const explicitUrl = /^https?:\/\//i.test(value);
  const url = new URL(explicitUrl ? value : `https://${value}`);
  const domain = url.hostname.toLowerCase().replace(/^www\./, "");
  if (domain === "localhost" || !domain.includes(".") || /^(?:127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?$)/.test(domain)) throw new Error("A public business domain is required.");
  return { originalInput: value, inputType: explicitUrl ? "url" as const : "domain" as const, domain };
}

function decode(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#64;/g, "@").replace(/\s+/g, " ").trim();
}

function urlsFrom(content: string, base: string, domain: string) {
  const found = new Set<string>();
  for (const match of content.matchAll(/(?:href=["']([^"'#]+)|<loc>\s*([^<]+)\s*<\/loc>)/gi)) {
    try {
      const url = new URL(match[1] || match[2], base);
      if (url.protocol === "https:" && url.hostname.replace(/^www\./, "") === domain) {
        url.hash = "";
        found.add(url.href);
      }
    } catch { /* Ignore malformed links published by the target website. */ }
  }
  return [...found];
}

function addEntity(entities: FirstPartyEntity[], type: FirstPartyEntity["type"], value: string, url: string) {
  const clean = decode(value).replace(/^[|,:;\s-]+|[|,:;\s-]+$/g, "");
  if (!clean) return;
  const existing = entities.find((item) => item.type === type && item.value.toLowerCase() === clean.toLowerCase());
  if (existing) { if (!existing.evidenceUrls.includes(url)) existing.evidenceUrls.push(url); return; }
  entities.push({ type, value: clean, evidenceUrls: [url] });
}

function isCrediblePhone(value: string) {
  const clean = value.trim();
  const digits = clean.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return false;
  // Sitemap dates and timestamps can otherwise resemble punctuated phone numbers.
  if (/^(?:19|20)\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])(?:\D|$)/.test(clean)) return false;
  const internationalPrefix = /^\s*(?:\+|00)\d/.test(clean);
  const parenthesizedAreaCode = /\(\s*\d{2,4}\s*\)/.test(clean);
  const separatedGroups = (clean.match(/[ .-]/g) || []).length >= 2;
  return internationalPrefix || parenthesizedAreaCode || separatedGroups;
}

function organizationNamesFromJsonLd(content: string) {
  const names: string[] = [];
  const organizationalTypes = new Set(["organization", "corporation", "localbusiness"]);
  const visit = (value: unknown, organizationalContext = false) => {
    if (Array.isArray(value)) { for (const item of value) visit(item, organizationalContext); return; }
    if (!value || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    const types = Array.isArray(record["@type"]) ? record["@type"] : [record["@type"]];
    const isOrganization = organizationalContext || types.some((type) => typeof type === "string" && organizationalTypes.has(type.toLowerCase()));
    const name = typeof record.legalName === "string" ? record.legalName : isOrganization && typeof record.name === "string" ? record.name : undefined;
    if (isOrganization && name) names.push(name);
    for (const [key, child] of Object.entries(record)) {
      if (key !== "name" && key !== "legalName" && key !== "@type") visit(child, isOrganization);
    }
  };
  for (const script of content.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visit(JSON.parse(script[1])); } catch { /* Ignore invalid publisher-supplied structured data. */ }
  }
  return names;
}

function extractPage(content: string, url: string, targetEmail: string | undefined, entities: FirstPartyEntity[], relationships: FirstPartyRelationship[]) {
  const text = decode(content);
  const emailFound = targetEmail && text.toLowerCase().includes(targetEmail);
  if (emailFound) addEntity(entities, "Email", targetEmail, url);
  const phones = [...text.matchAll(/(?:\+|00)?\d[\d ().-]{7,}\d/g)].map((match) => match[0]).filter(isCrediblePhone);
  for (const phone of phones) addEntity(entities, "Phone", phone, url);
  const organization = /<meta[^>]+(?:property|name)=["'](?:og:site_name|application-name)["'][^>]+content=["']([^"']+)/i.exec(content)?.[1]
    || organizationNamesFromJsonLd(content)[0];
  if (organization) addEntity(entities, "Organization", organization, url);
  if (!emailFound || !targetEmail) return;
  const escaped = targetEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const context = text.match(new RegExp(`.{0,180}${escaped}.{0,180}`, "i"))?.[0] || "";
  const rolePattern = String.raw`(?:Managing Partner|Senior Partner|Partner|Chief Executive Officer|CEO|Founder|Director|Attorney|Lawyer|Counsel|Manager|שותף מנהל|שותפה מנהלת|שותף|שותפה|עורך דין|עורכת דין|מנכ[״"]?ל|מייסד|מייסדת|מנהל|מנהלת|דירקטור|דירקטורית)`;
  const role = new RegExp(rolePattern, "iu").exec(context)?.[0];
  const latinName = String.raw`[\p{Lu}][\p{Ll}\p{M}'’-]{1,30}(?:\s+[\p{Lu}][\p{Ll}\p{M}'’-]{1,30}){1,3}`;
  const hebrewName = String.raw`[\p{Script=Hebrew}\p{M}'״׳-]{2,30}(?:\s+[\p{Script=Hebrew}\p{M}'״׳-]{2,30}){1,3}`;
  // A name is reliable only when the page explicitly pairs it with a recognized professional role.
  const paired = role && (new RegExp(`(${latinName}|${hebrewName})\\s*[,|:;·-]?\\s*${rolePattern}`, "iu").exec(context)
    || new RegExp(`${rolePattern}\\s*[,|:;·-]?\\s*(${latinName}|${hebrewName})`, "iu").exec(context));
  const person = paired?.[1];
  if (person) addEntity(entities, "Person", person, url);
  if (role) addEntity(entities, "Role", role, url);
  if (person) relationships.push({ from: person, type: "uses email", to: targetEmail, evidenceUrl: url });
  if (person && role) relationships.push({ from: person, type: "has role", to: role, evidenceUrl: url });
  if (person && organization) relationships.push({ from: person, type: "works at", to: decode(organization), evidenceUrl: url });
  if (person) for (const phone of phones) relationships.push({ from: person, type: "uses phone", to: decode(phone), evidenceUrl: url });
}

export async function resolveFirstPartyEntities(input: string, options: { fetch?: FetchLike; lookup?: LookupLike; timeoutMs?: number; maxUrls?: number } = {}): Promise<FirstPartyResolution> {
  const target = resolutionTarget(input);
  const limit = Math.min(Math.max(options.maxUrls || MAX_URLS, 2), MAX_URLS);
  const homepage = `https://${target.domain}/`;
  const sitemap = new URL("/sitemap.xml", homepage).href;
  const submittedUrl = target.inputType === "url" ? new URL(target.originalInput) : undefined;
  if (submittedUrl) { submittedUrl.protocol = "https:"; submittedUrl.hash = ""; }
  const queue = [...new Set([...(submittedUrl ? [submittedUrl.href] : []), homepage, sitemap])];
  const discovered = new Set(queue);
  const internal = new Set<string>();
  const sitemapUrls = new Set<string>();
  const fetched = new Set<string>();
  const failures: Array<{ url: string; reason: string }> = [];
  const entities: FirstPartyEntity[] = [];
  const relationships: FirstPartyRelationship[] = [];
  let sitemapIndexes = 0;
  while (queue.length && fetched.size < limit) {
    const url = queue.shift()!;
    try {
      const { response, url: evidenceUrl } = await safeFetch(url, target.domain, options.fetch, options.lookup || defaultLookup, options.timeoutMs || 8_000);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = (await response.text()).slice(0, 2_000_000);
      fetched.add(url);
      extractPage(content, evidenceUrl, target.inputType === "email" ? target.originalInput : undefined, entities, relationships);
      const links = urlsFrom(content, evidenceUrl, target.domain);
      const isSitemap = /sitemap.*\.xml|<urlset|<sitemapindex/i.test(`${url} ${content.slice(0, 500)}`);
      for (const link of links) {
        if (isSitemap) sitemapUrls.add(link); else internal.add(link);
        if (discovered.size < limit && !discovered.has(link)) { discovered.add(link); queue.push(link); }
      }
      if (/<sitemapindex/i.test(content) && sitemapIndexes++ >= MAX_SITEMAP_INDEXES) queue.splice(0, queue.length, ...queue.filter((item) => !/sitemap.*\.xml/i.test(item)));
    } catch (cause) {
      failures.push({ url, reason: cause instanceof Error ? cause.message : "Fetch failed" });
    }
  }
  return {
    originalInput: target.originalInput, inputType: target.inputType, resolvedDomain: target.domain,
    discovery: { homepageFetched: fetched.has(homepage), sitemapFetched: fetched.has(sitemap), internalLinksDiscovered: internal.size, sitemapUrlsDiscovered: sitemapUrls.size, totalUrlsDiscovered: discovered.size, totalUrlsFetched: fetched.size, failures },
    entities, relationships: relationships.filter((item, index, all) => all.findIndex((other) => JSON.stringify(other) === JSON.stringify(item)) === index),
    evidenceUrls: [...new Set(entities.flatMap((entity) => entity.evidenceUrls))],
  };
}
