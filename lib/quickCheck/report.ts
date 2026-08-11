import type { ProviderEvidence, ProviderFinding, ProviderResult } from "../providers/types";

export const QUICK_CHECK_CATEGORY_IDS = [
  "legal_identity",
  "domain_registration",
  "dns_infrastructure",
  "website_security",
  "threat_reputation",
  "independent_reputation",
  "complaints_reviews",
  "payment_methods",
  "buyer_protection",
  "contact_consistency",
] as const;

export type QuickCheckCategoryId = (typeof QUICK_CHECK_CATEGORY_IDS)[number];
export type QuickCheckVerification = "Verified" | "Partially verified" | "Not verified";
export type QuickCheckSourceQuality = "authoritative" | "independent" | "technical" | "first_party";

export type QuickCheckCategory = {
  id: QuickCheckCategoryId;
  label: string;
  status: QuickCheckVerification;
  summary: string;
  sourceQuality?: QuickCheckSourceQuality;
  evidence: Array<{ label: string; value: string; source: string }>;
};

export type QuickCheckReport = {
  score: number;
  decision: "PROCEED" | "VERIFY BEFORE PAYING" | "AVOID";
  confidence: "Low" | "Medium" | "High";
  evidenceCoverage: number;
  categories: QuickCheckCategory[];
  evidenceGaps: string[];
  sourcesSuccessfullyQueried: string[];
  materialFindings: ProviderFinding[];
};

const LABELS: Record<QuickCheckCategoryId, string> = {
  legal_identity: "Legal or business identity",
  domain_registration: "Domain registration and age",
  dns_infrastructure: "DNS and infrastructure",
  website_security: "HTTPS and technical website state",
  threat_reputation: "Malware and phishing reputation",
  independent_reputation: "Independent website reputation",
  complaints_reviews: "Complaints and reviews",
  payment_methods: "Observable payment methods",
  buyer_protection: "Buyer protection signals",
  contact_consistency: "Business contact consistency",
};

const CATEGORY_WEIGHTS: Record<QuickCheckCategoryId, number> = {
  legal_identity: 18,
  domain_registration: 10,
  dns_infrastructure: 8,
  website_security: 8,
  threat_reputation: 18,
  independent_reputation: 12,
  complaints_reviews: 10,
  payment_methods: 4,
  buyer_protection: 7,
  contact_consistency: 5,
};

function provider(id: string, results: ProviderResult[]) {
  return results.find((result) => result.providerId === id);
}

function usableEvidence(result: ProviderResult | undefined, ids?: RegExp) {
  if (!result || result.status !== "completed") return [];
  return result.evidence.filter((item) => (!ids || ids.test(item.id)) && Boolean(item.value) && !/^(?:unavailable|not verified|not found)$/i.test(String(item.value)));
}

function view(items: ProviderEvidence[]) {
  return items.map((item) => ({ label: item.label, value: String(item.value), source: item.source }));
}

function category(id: QuickCheckCategoryId, status: QuickCheckVerification, summary: string, evidence: ProviderEvidence[] = [], sourceQuality?: QuickCheckSourceQuality): QuickCheckCategory {
  return { id, label: LABELS[id], status, summary, sourceQuality, evidence: view(evidence) };
}

function queriedSource(result: ProviderResult) {
  return result.status === "completed" && result.metadata.lookupPerformed === true;
}

export function buildQuickCheckReport(results: ProviderResult[]): QuickCheckReport {
  const company = provider("authoritative-company", results);
  const whois = provider("whois", results);
  const dns = provider("dns", results);
  const ssl = provider("ssl", results);
  const headers = provider("security-headers", results);
  const threat = provider("threat-reputation", results);
  const commerce = provider("website-commerce", results);

  const legalEvidence = usableEvidence(company, /legal-name|company-number|incorporation|cik/i);
  const observedIdentity = usableEvidence(commerce, /observed-business-name|observed-registration-number/i);
  const domainEvidence = usableEvidence(whois, /registration-date|expiration-date|statuses/i);
  const dnsEvidence = usableEvidence(dns, /-a-records|-ns-records|-mx-records/i);
  const sslEvidence = usableEvidence(ssl, /issuer|valid-to|expiration|subject-alt/i);
  const headerEvidence = usableEvidence(headers).filter((item) => item.value !== "unavailable");
  const threatEvidence = usableEvidence(threat);
  const paymentEvidence = usableEvidence(commerce, /payment-methods/i);
  const protectionEvidence = usableEvidence(commerce, /returns-policy|cancellation-policy|terms-page|secure-checkout/i);
  const contactEvidence = usableEvidence(commerce, /contact-email|contact-phone|contact-address|contact-domain-consistency/i);

  const categories: QuickCheckCategory[] = [
    legalEvidence.length
      ? category("legal_identity", "Verified", "An authoritative registry source returned a legal identity.", legalEvidence, "authoritative")
      : observedIdentity.length
        ? category("legal_identity", "Partially verified", "The website publishes identity details, but no authoritative registry confirmed them.", observedIdentity, "first_party")
        : category("legal_identity", "Not verified", "No authoritative legal or business identity was obtained."),
    domainEvidence.length
      ? category("domain_registration", "Verified", "RDAP returned domain registration context.", domainEvidence, "authoritative")
      : category("domain_registration", "Not verified", "No usable registration date or domain status was obtained."),
    dnsEvidence.length
      ? category("dns_infrastructure", "Verified", "Public DNS returned active infrastructure records.", dnsEvidence, "technical")
      : category("dns_infrastructure", "Not verified", "No usable DNS infrastructure evidence was obtained."),
    sslEvidence.length || headerEvidence.length
      ? category("website_security", sslEvidence.length ? "Verified" : "Partially verified", "The live website returned observable transport or security configuration.", [...sslEvidence, ...headerEvidence], "technical")
      : category("website_security", "Not verified", "HTTPS and website security configuration could not be verified."),
    threat?.status === "completed" && threat.metadata.lookupPerformed === true
      ? category("threat_reputation", "Verified", "A threat intelligence source was queried. A clean lookup means no listing was returned, not that the site is guaranteed safe.", threatEvidence, "independent")
      : category("threat_reputation", "Not verified", "No malware or phishing intelligence source completed a lookup."),
    category("independent_reputation", "Not verified", "No independent domain reputation source completed a lookup."),
    category("complaints_reviews", "Not verified", "No independent complaint or review source completed a lookup."),
    paymentEvidence.length
      ? category("payment_methods", "Partially verified", "Payment methods were observed on the merchant website. Availability at checkout was not tested.", paymentEvidence, "first_party")
      : category("payment_methods", "Not verified", "No payment methods were observed."),
    protectionEvidence.length
      ? category("buyer_protection", "Partially verified", "The website publishes buyer-protection or transaction-policy signals. Their enforcement was not independently verified.", protectionEvidence, "first_party")
      : category("buyer_protection", "Not verified", "No usable returns, cancellation, or buyer-protection evidence was observed."),
    contactEvidence.length
      ? category("contact_consistency", "Partially verified", "Contact details were observed and checked for internal consistency across the sampled website pages.", contactEvidence, "first_party")
      : category("contact_consistency", "Not verified", "No consistent business contact details were obtained."),
  ];

  const coveragePoints = categories.reduce((total, item) => total + (item.status === "Verified" ? 1 : item.status === "Partially verified" ? 0.5 : 0), 0);
  const evidenceCoverage = Math.round((coveragePoints / categories.length) * 100);
  const rawScore = categories.reduce((total, item) => total + CATEGORY_WEIGHTS[item.id] * (item.status === "Verified" ? 1 : item.status === "Partially verified" ? 0.45 : 0), 0);
  const materialFindings = results.flatMap((result) => result.findings).filter((finding) => finding.severity === "high" || finding.severity === "critical");
  const severeThreat = materialFindings.some((finding) => /malware|phishing|malicious|threat|blacklist/i.test(`${finding.title} ${finding.description}`));
  const hasVerifiedIdentity = categories.find((item) => item.id === "legal_identity")?.status === "Verified";
  const hasThreatLookup = categories.find((item) => item.id === "threat_reputation")?.status === "Verified";
  const scoreCap = evidenceCoverage < 30 ? 34 : evidenceCoverage < 50 ? 49 : !hasVerifiedIdentity || !hasThreatLookup ? 59 : evidenceCoverage < 70 ? 69 : 100;
  const score = severeThreat ? Math.min(20, Math.round(rawScore)) : Math.min(scoreCap, Math.round(rawScore));
  const decision = severeThreat ? "AVOID" : evidenceCoverage >= 70 && score >= 70 && hasVerifiedIdentity && hasThreatLookup ? "PROCEED" : "VERIFY BEFORE PAYING";
  const confidence = evidenceCoverage >= 75 && hasVerifiedIdentity && hasThreatLookup ? "High" : evidenceCoverage >= 45 ? "Medium" : "Low";

  return {
    score,
    decision,
    confidence,
    evidenceCoverage,
    categories,
    evidenceGaps: categories.filter((item) => item.status === "Not verified").map((item) => item.label),
    sourcesSuccessfullyQueried: results.filter(queriedSource).map((result) => String(result.metadata.providerName || result.providerId)),
    materialFindings,
  };
}
