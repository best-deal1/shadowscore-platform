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
const MAX_URLS = 24;
const MAX_SITEMAP_INDEXES = 3;
const USER_AGENT = "ShadowScore First-Party Intelligence/1.0 (+https://shadowscore.com)";

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

function extractPage(content: string, url: string, targetEmail: string | undefined, entities: FirstPartyEntity[], relationships: FirstPartyRelationship[]) {
  const text = decode(content);
  const emailFound = targetEmail && text.toLowerCase().includes(targetEmail);
  if (emailFound) addEntity(entities, "Email", targetEmail, url);
  for (const match of text.matchAll(/(?:\+|00)?\d[\d ().-]{7,}\d/g)) addEntity(entities, "Phone", match[0], url);
  const organization = /<meta[^>]+(?:property|name)=["'](?:og:site_name|application-name)["'][^>]+content=["']([^"']+)/i.exec(content)?.[1]
    || /"(?:legalName|name)"\s*:\s*"([^"]{2,100})"/i.exec(content)?.[1];
  if (organization) addEntity(entities, "Organization", organization, url);
  if (!emailFound || !targetEmail) return;
  const local = targetEmail.split("@")[0].replace(/[._-]+/g, " ");
  const escaped = targetEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const context = text.match(new RegExp(`.{0,180}${escaped}.{0,180}`, "i"))?.[0] || "";
  const personPattern = /\b([A-Z][a-z]{1,30}(?:\s+[A-Z][a-z]{1,30}){1,3})\b/g;
  const names = [...context.matchAll(personPattern)].map((match) => match[1]).filter((name) => !/Contact|Email|Phone|Office|About|Team|Partners/i.test(name));
  const person = names.sort((a, b) => Number(b.toLowerCase().includes(local)) - Number(a.toLowerCase().includes(local)))[0];
  const role = /\b(?:Managing Partner|Senior Partner|Partner|Chief Executive Officer|CEO|Founder|Director|Attorney|Lawyer|Counsel|Manager)\b/i.exec(context)?.[0];
  if (person) addEntity(entities, "Person", person, url);
  if (role) addEntity(entities, "Role", role, url);
  if (person) relationships.push({ from: person, type: "uses email", to: targetEmail, evidenceUrl: url });
  if (person && role) relationships.push({ from: person, type: "has role", to: role, evidenceUrl: url });
  if (person && organization) relationships.push({ from: person, type: "works at", to: decode(organization), evidenceUrl: url });
}

export async function resolveFirstPartyEntities(input: string, options: { fetch?: FetchLike; timeoutMs?: number; maxUrls?: number } = {}): Promise<FirstPartyResolution> {
  const target = resolutionTarget(input);
  const fetcher = options.fetch || fetch;
  const limit = Math.min(Math.max(options.maxUrls || MAX_URLS, 2), MAX_URLS);
  const homepage = `https://${target.domain}/`;
  const sitemap = new URL("/sitemap.xml", homepage).href;
  const queue = [homepage, sitemap];
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
      const response = await fetcher(url, { redirect: "follow", signal: AbortSignal.timeout(options.timeoutMs || 8_000), headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.5" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = (await response.text()).slice(0, 2_000_000);
      fetched.add(url);
      extractPage(content, url, target.inputType === "email" ? target.originalInput : undefined, entities, relationships);
      const links = urlsFrom(content, url, target.domain);
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
