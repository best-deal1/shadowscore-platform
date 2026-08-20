import { BaseProvider } from "./BaseProvider";
import type { ProviderEvidence, ProviderExecutionContext, ProviderFailureReason, ProviderFinding, ProviderResult } from "./types";
import { PUBLIC_EMAIL_DOMAINS } from "../entityResolution/firstParty";
import { PUBLIC_MAILBOX_DOMAINS, isPublicMailboxDomain } from "../emailDomains";

for (const domain of PUBLIC_MAILBOX_DOMAINS) PUBLIC_EMAIL_DOMAINS.add(domain);

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
  matchLevel: "exact_match" | "unverified_candidate";
  matchBasis: string;
  confidence: number;
  evidenceUrl: string;
  evidenceQuery: string;
  evidenceSnippet: string;
  methods: string[];
};

type SearchResult = { title: string; url: string; description?: string };

function emailFromContext(context: ProviderExecutionContext) {
  const values = [context.requestedTarget, context.target, context.email].filter(Boolean) as string[];
  return values.map((value) => value.trim().toLowerCase()).find((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
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
    const exactEmail = `${hit.title} ${hit.description || ""}`.toLowerCase().includes(normalized);
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
      matchLevel,
      confidence,
      evidenceUrl: publicSearchEvidenceUrl(evidence.query),
      evidenceQuery: evidence.query,
      evidenceSnippet: snippet,
      methods,
      matchBasis: exact
        ? "The exact submitted email appears in preserved public-search result evidence for this profile."
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
        label: "Submitted email identifier classification",
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
  readonly version = "1.1.0";
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
        type: candidate.matchLevel === "unverified_candidate" ? "placeholder" : "document",
        label: candidate.matchLevel === "unverified_candidate" ? "Potential public identity candidate" : "Public identity exact-email match",
        value: `${candidate.platform} | profile ${candidate.profileUrl} | ${candidate.matchLevel} | confidence ${candidate.confidence}% | query ${candidate.evidenceQuery} | snippet ${candidate.evidenceSnippet} | ${candidate.matchBasis}`,
        source: candidate.evidenceUrl,
        investigationId: context.investigationId || context.intakeId,
        canonicalTarget: email,
        providerName: this.name,
        collectedAt: new Date().toISOString(),
      }));
      const findings: ProviderFinding[] = candidates.filter((candidate) => candidate.matchLevel === "exact_match").slice(0, 5).map((candidate, index) => ({
        id: `external-identity-finding-${index + 1}`,
        title: `${candidate.platform} exact-email identity match`,
        description: `${candidate.matchBasis} Profile: ${candidate.profileUrl}. Search evidence: ${candidate.evidenceUrl}. Query: ${candidate.evidenceQuery}. Snippet: ${candidate.evidenceSnippet}`,
        severity: "info",
      }));
      return {
        findings,
        evidence,
        metadata: {
          lookupPerformed: true,
          submittedEmail: email,
          candidateCount: candidates.length,
          externalIdentityCandidates: candidates,
          evidencePolicy: "Username-only candidates are placeholder evidence and never count as verified identity. Exact-email matches preserve the search query and result snippet used for the claim.",
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
