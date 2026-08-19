import { BaseProvider } from "./BaseProvider";
import type { ProviderEvidence, ProviderExecutionContext, ProviderFinding, ProviderResult } from "./types";

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
  matchLevel: "exact_match" | "strong_match" | "weak_match" | "unverified_candidate";
  matchBasis: string;
  confidence: number;
  evidenceUrl: string;
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
    return results.map((result) => ({ ...result, method: search.method }));
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
    const exactEmail = matches.some((item) => item.exactEmail);
    const corroborated = methods.length > 1;
    const matchLevel: ExternalIdentityCandidate["matchLevel"] = exactEmail && corroborated
      ? "exact_match"
      : corroborated
        ? "strong_match"
        : exactEmail
          ? "weak_match"
          : "unverified_candidate";
    const confidence = matchLevel === "exact_match" ? 92 : matchLevel === "strong_match" ? 76 : matchLevel === "weak_match" ? 58 : 30;
    return {
      platform: matches[0].platform,
      profileUrl,
      matchLevel,
      confidence,
      evidenceUrl: matches.find((item) => item.exactEmail)?.url || matches[0].url,
      methods,
      matchBasis: exactEmail
        ? (corroborated ? "The exact submitted email appears in public search evidence and an independent query returned the same profile." : "The exact submitted email appears in public search evidence for this profile.")
        : (corroborated ? "Multiple independent username/context searches returned the same public profile candidate." : "The submitted email local-part generated this public profile candidate. Candidate only, not verified identity."),
    };
  }).sort((a, b) => b.confidence - a.confidence || a.profileUrl.localeCompare(b.profileUrl));
}

export class ExternalIdentityProvider extends BaseProvider {
  readonly id = "external-identity";
  readonly name = "External Identity Discovery";
  readonly version = "1.0.0";
  readonly category = "business_profile" as const;

  protected async collect(context: ProviderExecutionContext): Promise<Pick<ProviderResult, "findings" | "evidence" | "metadata">> {
    const email = emailFromContext(context);
    if (!email) throw new Error("External identity discovery requires an email target.");
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) throw new Error("BRAVE_SEARCH_API_KEY is required for external identity discovery.");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const candidates = await discoverExternalIdentityCandidates(email, apiKey, controller.signal);
      const evidence: ProviderEvidence[] = candidates.map((candidate, index) => ({
        id: `external-identity-${index + 1}`,
        type: "document",
        label: candidate.matchLevel === "unverified_candidate" ? "Potential public identity candidate" : "Public identity match",
        value: `${candidate.platform} | ${candidate.profileUrl} | ${candidate.matchLevel} | confidence ${candidate.confidence}% | ${candidate.matchBasis}`,
        source: candidate.evidenceUrl,
        investigationId: context.investigationId || context.intakeId,
        canonicalTarget: email,
        providerName: this.name,
        collectedAt: new Date().toISOString(),
      }));
      const findings: ProviderFinding[] = candidates.slice(0, 5).map((candidate, index) => ({
        id: `external-identity-finding-${index + 1}`,
        title: `${candidate.platform} identity candidate`,
        description: `${candidate.matchBasis} Evidence: ${candidate.evidenceUrl}`,
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
          evidencePolicy: "Candidates are not promoted to verified people or organizations without direct or corroborated evidence.",
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
