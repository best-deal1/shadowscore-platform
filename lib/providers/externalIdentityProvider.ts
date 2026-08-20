import { BaseProvider } from "./BaseProvider";
import type { ProviderEvidence, ProviderExecutionContext, ProviderFailureReason, ProviderResult } from "./types";
import { isPublicMailboxDomain } from "../emailDomains";

const SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const SOCIAL_HOSTS: Record<string, string> = {
  "facebook.com": "Facebook",
  "instagram.com": "Instagram",
  "linkedin.com": "LinkedIn",
  "x.com": "X",
  "twitter.com": "X",
  "tiktok.com": "TikTok",
  "github.com": "GitHub",
  "youtube.com": "YouTube",
};

export type ExternalIdentityCandidate = {
  platform: string;
  profileUrl: string;
  observedDisplayName?: string;
  matchedIdentifiers: string[];
  matchType: "exact_email" | "username";
  status: "Candidate" | "Corroborated" | "Verified";
  matchLevel: "exact_match" | "unverified_candidate";
  matchBasis: string;
  confidence: number;
  evidenceUrl: string;
  evidenceQuery: string;
  evidenceSnippet: string;
  methods: string[];
  sourceProvider: "Brave Search";
  evidenceReference: string;
};

type SearchResult = { title: string; url: string; description?: string };

function emailFromContext(context: ProviderExecutionContext) {
  const values = [context.requestedTarget, context.target, context.email].filter(Boolean) as string[];
  return values.map((value) => value.trim().toLowerCase()).find((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

function containsExactEmailToken(text: string, email: string) {
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Z0-9._%+\\-])${escaped}($|[^A-Z0-9._%+\\-])`, "i").test(text);
}

function platformFor(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return Object.entries(SOCIAL_HOSTS).find(([domain]) => host === domain || host.endsWith(`.${domain}`))?.[1]
      || (/\/(?:profile|people|member|team|author)\b/i.test(parsed.pathname) ? "Public profile" : undefined);
  } catch {
    return undefined;
  }
}

function canonicalUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

function publicSearchEvidenceUrl(query: string) {
  const url = new URL("https://search.brave.com/search");
  url.searchParams.set("q", query);
  return url.toString();
}

async function braveSearch(query: string, apiKey: string, signal: AbortSignal): Promise<SearchResult[]> {
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("count", "10");
  url.searchParams.set("safesearch", "strict");
  const response = await fetch(url, {
    signal,
    headers: { accept: "application/json", "x-subscription-token": apiKey },
  });
  if (!response.ok) throw new Error(`Public search returned HTTP ${response.status}.`);
  const payload = await response.json() as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } };
  return (payload.web?.results || []).filter((item): item is SearchResult => Boolean(item.title && item.url));
}

export async function discoverExternalIdentityCandidates(email: string, apiKey: string, signal: AbortSignal) {
  const normalized = email.trim().toLowerCase();
  const localPart = normalized.split("@")[0];
  const domain = normalized.split("@")[1];
  const searches = [
    { method: "exact_email", query: `"${normalized}"` },
    { method: "exact_email_profile", query: `"${normalized}" profile OR social` },
    { method: "username_profile", query: `"${localPart}" profile` },
    { method: "social_profile", query: `"${localPart}" site:facebook.com OR site:instagram.com OR site:linkedin.com OR site:x.com OR site:tiktok.com` },
    { method: "identity_context", query: `"${localPart}" "${domain}"` },
  ];

  const hits = (await Promise.all(searches.map(async (search) => {
    const results = await braveSearch(search.query, apiKey, signal);
    return results.map((result) => ({ ...result, method: search.method, query: search.query }));
  }))).flat();

  const grouped = new Map<string, Array<(typeof hits)[number] & { platform: string; exactEmail: boolean }>>();
  for (const hit of hits) {
    const platform = platformFor(hit.url);
    if (!platform) continue;
    const exactEmail = containsExactEmailToken(`${hit.title} ${hit.description || ""}`, normalized);
    const key = canonicalUrl(hit.url);
    grouped.set(key, [...(grouped.get(key) || []), { ...hit, platform, exactEmail }]);
  }

  return [...grouped.entries()].map(([profileUrl, matches]): ExternalIdentityCandidate => {
    const methods = [...new Set(matches.map((item) => item.method))];
    const exact = matches.find((item) => item.exactEmail);
    const matchLevel: ExternalIdentityCandidate["matchLevel"] = exact ? "exact_match" : "unverified_candidate";
    const confidence = exact ? 90 : 30;
    const evidence = exact || matches[0];
    const snippet = `${evidence.title}${evidence.description ? ` - ${evidence.description}` : ""}`.trim();
    return {
      platform: matches[0].platform,
      profileUrl,
      observedDisplayName: evidence.title && !containsExactEmailToken(evidence.title, normalized) ? evidence.title.trim() : undefined,
      matchedIdentifiers: exact ? [normalized] : [localPart],
      matchType: exact ? "exact_email" : "username",
      status: exact ? "Corroborated" : "Candidate",
      matchLevel,
      confidence,
      evidenceUrl: publicSearchEvidenceUrl(evidence.query),
      evidenceQuery: evidence.query,
      evidenceSnippet: snippet,
      methods,
      sourceProvider: "Brave Search",
      evidenceReference: publicSearchEvidenceUrl(evidence.query),
      matchBasis: exact
        ? "The exact submitted email appears as a complete token in preserved public-search result evidence for this profile."
        : "The submitted email local-part generated this public profile candidate. Candidate only, not verified identity.",
    };
  }).sort((a, b) => b.confidence - a.confidence || a.profileUrl.localeCompare(b.profileUrl));
}

export class EmailIntelligenceProvider extends BaseProvider {
  readonly id = "email-intelligence";
  readonly name = "Email Intelligence";
  readonly version = "1.0.0";
  readonly category = "business_profile" as const;

  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const email = emailFromContext(context);
    if (!email) throw new Error("Email intelligence requires an email target.");
    const domain = email.split("@")[1];
    const publicMailbox = isPublicMailboxDomain(domain);
    return {
      findings: [],
      evidence: [{
        id: "email-target-classification",
        type: "placeholder",
        label: "Mailbox classification",
        value: publicMailbox ? "Public mailbox provider" : "Corporate/custom domain candidate",
        source: "submitted-target",
        investigationId: context.investigationId || context.intakeId,
        canonicalTarget: email,
        providerName: this.name,
        collectedAt: new Date().toISOString(),
      }],
      metadata: { lookupPerformed: true, submittedEmail: email, emailDomain: domain, publicMailbox },
    };
  }
}

export class ExternalIdentityProvider extends BaseProvider {
  readonly id = "external-identity";
  readonly name = "External Identity Discovery";
  readonly version = "1.2.0";
  readonly category = "business_profile" as const;

  failureReason(error: unknown): ProviderFailureReason {
    if (error instanceof Error && /BRAVE_SEARCH_API_KEY|credential|not configured|provider unavailable/i.test(error.message)) return "Unavailable";
    return super.failureReason(error);
  }

  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const email = emailFromContext(context);
    if (!email) throw new Error("External identity discovery requires an email target.");
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) throw new Error("External identity provider unavailable: BRAVE_SEARCH_API_KEY is not configured.");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const candidates = await discoverExternalIdentityCandidates(email, apiKey, controller.signal);
      const evidence: ProviderEvidence[] = candidates.map((candidate, index) => ({
        id: `external-identity-${index + 1}`,
        type: "search_result",
        label: candidate.matchLevel === "unverified_candidate" ? "Potential public identity candidate" : "Public identity exact-email match",
        value: `${candidate.platform} | profile ${candidate.profileUrl} | status ${candidate.status} | matched ${candidate.matchedIdentifiers.join(", ")} | confidence ${candidate.confidence}% | query ${candidate.evidenceQuery} | snippet ${candidate.evidenceSnippet} | ${candidate.matchBasis}`,
        source: candidate.evidenceUrl,
        investigationId: context.investigationId || context.intakeId,
        canonicalTarget: email,
        providerName: this.name,
        collectedAt: new Date().toISOString(),
      }));
      return {
        findings: [],
        evidence,
        metadata: {
          lookupPerformed: true,
          submittedEmail: email,
          candidateCount: candidates.length,
          externalIdentityCandidates: candidates,
          evidencePolicy: "Search-result candidates retain their profile URL and provenance. They remain candidates or corroborated search observations, not verified people, unless independent page or primary-source evidence verifies the same identity.",
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
