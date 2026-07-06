import type { ProviderResult } from "./providers/types";
import type { RiskEngineOutput } from "./riskEngine";

export const INSIGHT_ENGINE_VERSION = "insight-engine-v1";

export type InsightAudience = "free" | "paid";
export type InsightRiskLevel = "Low" | "Medium" | "High" | "Unknown";
export type InsightCategory = "Infrastructure Insight" | "Identity Insight" | "Email/Domain Insight" | "Overall Trust Note";

export type TrustInsight = {
  category: InsightCategory;
  insight: string;
  riskLevel: InsightRiskLevel;
  whyItMatters: string;
  recommendedNextStep: string;
  evidence: string[];
};

export type InsightEngineOutput = {
  engineVersion: string;
  generatedAt: string;
  audience: InsightAudience;
  insights: TrustInsight[];
};

function records(result: ProviderResult | undefined, type: string) {
  const raw = result?.metadata.records;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const value = (raw as Record<string, unknown>)[type];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function includesAny(values: string[], terms: string[]) {
  return values.some((value) => terms.some((term) => value.toLowerCase().includes(term)));
}

function evidenceList(items: Array<[string, string[] | string | undefined]>) {
  return items.flatMap(([label, value]) => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.length ? [`${label}: ${values.join(", ")}`] : [];
  });
}

export function buildTrustInsights(input: {
  providerResults?: ProviderResult[];
  riskOutput?: RiskEngineOutput;
  audience: InsightAudience;
}): InsightEngineOutput {
  const providerResults = input.providerResults || [];
  const dns = providerResults.find((result) => result.providerId === "dns");
  const whois = providerResults.find((result) => result.providerId === "whois");
  const ns = records(dns, "NS");
  const mx = records(dns, "MX");
  const a = records(dns, "A");
  const txt = records(dns, "TXT");
  const statuses = stringList(whois?.metadata.statuses);
  const registrationDate = typeof whois?.metadata.registrationDate === "string" ? whois.metadata.registrationDate : undefined;
  const ageDays = typeof whois?.metadata.ageDays === "number" ? whois.metadata.ageDays : undefined;
  const usesCloudflare = includesAny(ns, ["cloudflare"]);
  const usesGoogleMail = includesAny(mx, ["google.com", "googlemail.com", "aspmx.l.google"]);
  const hasSpf = txt.some((record) => record.toLowerCase().includes("v=spf1"));
  const hasDmarc = txt.some((record) => record.toLowerCase().includes("v=dmarc1"));
  const paid = input.audience === "paid";

  let infrastructure: TrustInsight;
  if (dns?.status !== "completed") {
    infrastructure = {
      category: "Infrastructure Insight",
      insight: "DNS infrastructure could not be fully validated from the available provider response.",
      riskLevel: "Unknown",
      whyItMatters: "Business trust checks need observable domain infrastructure before drawing strong conclusions.",
      recommendedNextStep: paid ? "Review DNS availability, hosting continuity and resolver errors before relying on the domain for customer-facing operations." : "Confirm the domain is entered correctly and rerun the scan later.",
      evidence: dns?.errors.length ? [`DNS error: ${dns.errors[0]}`] : [],
    };
  } else if (usesCloudflare && usesGoogleMail) {
    infrastructure = {
      category: "Infrastructure Insight",
      insight: "Infrastructure looks stable because the domain uses Cloudflare name servers and Google mail infrastructure.",
      riskLevel: "Low",
      whyItMatters: "Recognized DNS and mail infrastructure can support uptime, deliverability and customer confidence.",
      recommendedNextStep: paid ? "Keep DNS ownership, mail authentication and recovery contacts documented for audit or marketplace verification requests." : "Keep domain and email records current.",
      evidence: evidenceList([["Name servers", ns], ["MX records", mx]]),
    };
  } else {
    infrastructure = {
      category: "Infrastructure Insight",
      insight: a.length || ns.length ? "Core domain infrastructure is visible, but the scan did not identify both Cloudflare-style name servers and Google mail infrastructure." : "Core DNS records were not clearly detected for this domain.",
      riskLevel: a.length || ns.length ? "Medium" : "High",
      whyItMatters: "Customers, marketplaces and payment partners rely on consistent website and domain configuration as a basic trust signal.",
      recommendedNextStep: paid ? "Validate hosting continuity, authoritative name servers, mail routing and any missing records before using the domain as a business trust anchor." : "Confirm DNS and mail records are intentionally configured.",
      evidence: evidenceList([["A records", a], ["Name servers", ns], ["MX records", mx]]),
    };
  }

  const identity: TrustInsight = whois?.status === "completed" && (registrationDate || ageDays !== undefined || statuses.length)
    ? {
        category: "Identity Insight",
        insight: ageDays !== undefined && ageDays < 90 ? "Domain identity is visible, but the registration appears recent." : "Domain identity signals are publicly visible through WHOIS/RDAP data.",
        riskLevel: ageDays !== undefined && ageDays < 90 ? "Medium" : "Low",
        whyItMatters: "Visible registration history helps users and reviewers understand whether a domain has an observable business footprint.",
        recommendedNextStep: paid ? "Compare registration age, domain statuses and business evidence with marketplace, SSL and reputation findings." : "Make sure public business details match the domain you provided.",
        evidence: evidenceList([["Registration date", registrationDate], ["Domain statuses", statuses]]),
      }
    : {
        category: "Identity Insight",
        insight: "WHOIS data is not publicly available for this domain. Use DNS, SSL, business profile and reputation checks for additional validation.",
        riskLevel: "Unknown",
        whyItMatters: "Unavailable ownership-age data reduces confidence in identity validation, but it does not prove the domain is unsafe.",
        recommendedNextStep: paid ? "Corroborate identity with DNS, SSL, business profile, marketplace, document and reputation evidence." : "Use public business profile and website evidence as supporting validation.",
        evidence: whois?.errors.length ? [`WHOIS/RDAP error: ${whois.errors[0]}`] : [],
      };

  const email: TrustInsight = mx.length
    ? {
        category: "Email/Domain Insight",
        insight: usesGoogleMail ? "Business email routing is detected and appears to use Google mail infrastructure." : "Mail exchange records are detected for this domain.",
        riskLevel: hasSpf || hasDmarc ? "Low" : "Medium",
        whyItMatters: "Working mail routing helps customers, partners and verification teams contact the business reliably.",
        recommendedNextStep: paid ? "Review SPF, DMARC and mail-provider alignment to reduce spoofing and deliverability issues." : "Confirm the mailbox is active and monitored.",
        evidence: evidenceList([["MX records", mx], ["TXT records", [hasSpf ? "SPF detected" : "SPF not detected", hasDmarc ? "DMARC detected" : "DMARC not detected"]]]),
      }
    : {
        category: "Email/Domain Insight",
        insight: "No mail exchange records were detected. This may indicate the domain is not configured for business email.",
        riskLevel: "High",
        whyItMatters: "A business domain without mail routing can make customer contact, verification and dispute communication harder.",
        recommendedNextStep: paid ? "Configure business email routing and authentication, or document why the domain does not receive mail." : "Add business email records if this domain should receive customer or verification mail.",
        evidence: [],
      };

  const overallLevel = [infrastructure.riskLevel, identity.riskLevel, email.riskLevel].includes("High") ? "High" : [infrastructure.riskLevel, identity.riskLevel, email.riskLevel].includes("Unknown") ? "Unknown" : [infrastructure.riskLevel, identity.riskLevel, email.riskLevel].includes("Medium") ? "Medium" : "Low";
  const overall: TrustInsight = {
    category: "Overall Trust Note",
    insight: input.riskOutput ? `Provider evidence was converted into a business trust note alongside the risk engine's ${input.riskOutput.primaryRiskDomain} context.` : "Provider evidence was converted into a business trust note without adding unsupported claims.",
    riskLevel: overallLevel,
    whyItMatters: "Users need a plain-English view of what the visible domain evidence means before they make a trust decision.",
    recommendedNextStep: paid ? "Use these insights with the full report evidence, risk findings and analyst recommendations before taking action." : "Treat this as a limited preview, not a full risk report.",
    evidence: [],
  };

  return { engineVersion: INSIGHT_ENGINE_VERSION, generatedAt: new Date().toISOString(), audience: input.audience, insights: [infrastructure, identity, email, overall] };
}
