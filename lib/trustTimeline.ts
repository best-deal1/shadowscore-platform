import type { TrustInsight } from "./insightEngine";
import type { ProviderResult } from "./providers/types";

export type TrustTimelineStatus = "completed" | "unavailable" | "pending";

export type TrustTimelineItem = {
  title: string;
  description: string;
  status: TrustTimelineStatus;
  evidenceSource: string;
};

type TimelineAudience = "free" | "paid";

const PROVIDER_LABELS: Record<string, string> = {
  dns: "DNS Intelligence",
  whois: "WHOIS/RDAP Intelligence",
  ssl: "SSL Inspection",
  "security-headers": "Security Headers Inspection",
  spf: "SPF Inspection",
  dmarc: "DMARC Inspection",
  reputation: "Reputation Inspection",
  "business-profile": "Business Profile Inspection",
  marketplace: "Marketplace Inspection",
  payment: "Payment Inspection",
  compliance: "Compliance Inspection",
};

function hasProductionEvidence(result: ProviderResult | undefined) {
  return Boolean(result?.evidence.some((item) => item.type !== "placeholder"));
}

function statusFor(result: ProviderResult | undefined): TrustTimelineStatus {
  if (!result) return "pending";
  if (result.status !== "completed") return "unavailable";
  return hasProductionEvidence(result) ? "completed" : "pending";
}

function evidenceSource(result: ProviderResult | undefined, fallback: string) {
  if (!result) return fallback;
  const sources = Array.from(new Set(result.evidence.map((item) => item.source).filter(Boolean)));
  if (sources.length) return `${PROVIDER_LABELS[result.providerId] || result.providerId} (${sources.join(", ")})`;
  if (result.errors.length) return `${PROVIDER_LABELS[result.providerId] || result.providerId} (${result.errors[0]})`;
  return PROVIDER_LABELS[result.providerId] || fallback;
}

function hasInsightEvidence(insights: TrustInsight[] | undefined) {
  return Boolean(insights?.some((insight) => insight.evidence.length > 0));
}

export function buildTrustTimeline(input: {
  providerResults?: ProviderResult[];
  insights?: TrustInsight[];
  insightEngineVersion?: string;
  audience: TimelineAudience;
}): TrustTimelineItem[] {
  const providerResults = input.providerResults || [];
  const provider = (id: string) => providerResults.find((result) => result.providerId === id);
  const dns = provider("dns");
  const whois = provider("whois");
  const spf = provider("spf");
  const dmarc = provider("dmarc");
  const reputation = provider("reputation");
  const businessProfile = provider("business-profile");
  const insights = input.insights || [];

  const emailStatus: TrustTimelineStatus = statusFor(dns) === "completed" || statusFor(spf) === "completed" || statusFor(dmarc) === "completed"
    ? "completed"
    : [statusFor(dns), statusFor(spf), statusFor(dmarc)].includes("unavailable") ? "unavailable" : "pending";

  const identityStatus: TrustTimelineStatus = statusFor(whois) === "completed" || statusFor(businessProfile) === "completed"
    ? "completed"
    : [statusFor(whois), statusFor(businessProfile)].includes("unavailable") ? "unavailable" : "pending";

  const providerReviewDescriptions: Record<string, string> = {
    ssl: "Certificate evidence was reviewed where an SSL provider response was available.",
    "security-headers": "Website security-header evidence was reviewed where a provider response was available.",
    marketplace: "Marketplace evidence was reviewed where a provider response was available.",
    payment: "Payment-provider evidence was reviewed where a provider response was available.",
    compliance: "Compliance evidence was reviewed where a provider response was available.",
  };

  const items: TrustTimelineItem[] = [
    {
      title: "Domain identified",
      description: "The investigation established the domain or business target used for the trust review.",
      status: statusFor(dns),
      evidenceSource: evidenceSource(dns, "ProviderResults: dns"),
    },
    {
      title: "DNS infrastructure analyzed",
      description: "Public domain infrastructure records were reviewed for routing and continuity signals.",
      status: statusFor(dns),
      evidenceSource: evidenceSource(dns, "ProviderResults: dns"),
    },
    {
      title: "Business email configuration inspected",
      description: "Mail routing and domain-authentication evidence were checked where provider evidence was available.",
      status: emailStatus,
      evidenceSource: [dns, spf, dmarc].filter(Boolean).map((result) => evidenceSource(result, "ProviderResults")).join("; ") || "ProviderResults: dns, spf, dmarc",
    },
    {
      title: "Ownership information checked",
      description: "Public registration and business-profile evidence were reviewed for identity context.",
      status: identityStatus,
      evidenceSource: [whois, businessProfile].filter(Boolean).map((result) => evidenceSource(result, "ProviderResults")).join("; ") || "ProviderResults: whois, business-profile",
    },
    {
      title: "Initial trust indicators generated",
      description: "Provider evidence was converted into business-facing trust indicators by the Insight Engine.",
      status: insights.length ? (hasInsightEvidence(insights) ? "completed" : "unavailable") : "pending",
      evidenceSource: input.insightEngineVersion ? `Insight Engine (${input.insightEngineVersion})` : "Insight Engine output",
    },
    {
      title: "Reputation and business profile evidence reviewed",
      description: "External reputation and business-profile provider evidence were included when available in the paid report.",
      status: statusFor(reputation) === "completed" || statusFor(businessProfile) === "completed" ? "completed" : [statusFor(reputation), statusFor(businessProfile)].includes("unavailable") ? "unavailable" : "pending",
      evidenceSource: [reputation, businessProfile].filter(Boolean).map((result) => evidenceSource(result, "ProviderResults")).join("; ") || "ProviderResults: reputation, business-profile",
    },
  ];

  if (input.audience === "paid") {
    const groupedProviderIds = new Set(["dns", "whois", "spf", "dmarc", "reputation", "business-profile"]);
    for (const result of providerResults) {
      if (groupedProviderIds.has(result.providerId)) continue;
      items.push({
        title: `${PROVIDER_LABELS[result.providerId] || result.providerId} reviewed`,
        description: providerReviewDescriptions[result.providerId] || "Provider evidence was reviewed where a provider response was available.",
        status: statusFor(result),
        evidenceSource: evidenceSource(result, `ProviderResults: ${result.providerId}`),
      });
    }
  }

  return input.audience === "free" ? items.filter((item) => item.status === "completed") : items;
}
