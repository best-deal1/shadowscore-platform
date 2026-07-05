import type { ProviderResult } from "./providers";

export const RISK_ENGINE_VERSION = "risk-engine-v19";
export type RiskSeverity = "Low" | "Medium" | "High" | "Critical";
export type HealthStage = "Healthy" | "Warning" | "Restricted" | "Suspended" | "Critical";
export type RevenueImpact = "Low" | "Medium" | "High" | "Critical";

export type RiskFinding = {
  id: string;
  domain: string;
  title: string;
  severity: RiskSeverity;
  points: number;
  evidence: string[];
  explanation: string;
  recommendedAction: string;
};

export type RiskEngineInput = {
  marketplace: string;
  caseType?: string;
  store?: string;
  email?: string;
  fileNames?: string[];
  rawText?: string;
  evidencePresent?: number;
  evidenceRequired?: number;
  providerResults?: ProviderResult[];
};

export type RiskTimelinePoint = {
  label: string;
  status: string;
  detail: string;
};

export type RiskEngineOutput = {
  score: number;
  trustScore: number;
  revenueRiskScore: number;
  stage: HealthStage;
  restrictionProbability: RiskSeverity;
  revenueImpact: RevenueImpact;
  confidence: number;
  primaryRiskDomain: string;
  rootCauseHypothesis: string;
  nextLikelyOutcome: string;
  findings: RiskFinding[];
  missingEvidence: string[];
  recommendedActions: string[];
  timeline: RiskTimelinePoint[];
  disclaimer: string;
};

const rules: Array<{
  id: string;
  terms: string[];
  domain: string;
  title: string;
  severity: RiskSeverity;
  points: number;
  revenuePoints?: number;
  explanation: string;
  recommendedAction: string;
}> = [
  {
    id: "ebay-mc081",
    terms: ["mc081", "registration suspension", "registration review"],
    domain: "Security Risk",
    title: "MC081 / registration integrity signal",
    severity: "Critical",
    points: 26,
    revenuePoints: 16,
    explanation: "MC081-style notices usually indicate registration, identity or account integrity concerns rather than a simple seller-performance issue.",
    recommendedAction: "Review identity, registration, payment, device, IP and linked-account consistency before submitting another appeal.",
  },
  {
    id: "amazon-resale-warning",
    terms: ["purpose of resale", "rental", "ship such products to your customers", "amazon conditions of use", "refunds on your amazon account"],
    domain: "Supplier Risk",
    title: "Amazon retail sourcing / resale detection",
    severity: "High",
    points: 20,
    revenuePoints: 12,
    explanation: "The evidence suggests Amazon detected buyer-account activity consistent with commercial resale or dropshipping.",
    recommendedAction: "Reduce dependency on retail buyer accounts, diversify suppliers and move toward invoice-backed wholesale or authorized sourcing.",
  },
  {
    id: "tiktok-fair-trading",
    terms: ["fair trading", "flash deal", "platform-funded discount", "daily order creation is limited"],
    domain: "Compliance Risk",
    title: "TikTok Shop fair trading enforcement",
    severity: "High",
    points: 18,
    revenuePoints: 22,
    explanation: "Fair trading enforcement can limit promotions, order creation and withdrawals while the account remains under restrictions.",
    recommendedAction: "Review shop activity, promotional behavior, customer complaints and seller terms before appealing.",
  },
  {
    id: "product-quality-rating",
    terms: ["low product rating", "product rating", "violation points", "deferred settlement", "customer complaints"],
    domain: "Reputation Risk",
    title: "Product quality and rating risk",
    severity: "High",
    points: 17,
    revenuePoints: 20,
    explanation: "Low product ratings and complaint patterns can trigger violation points, settlement delays and broader shop health issues.",
    recommendedAction: "Audit product quality, listing claims, customer expectations, refunds, reviews and complaint responses.",
  },

  {
    id: "ebay-mc011",
    terms: ["mc011", "proof of delivery", "delivery verification"],
    domain: "Marketplace Risk",
    title: "MC011 / delivery verification signal",
    severity: "High",
    points: 18,
    revenuePoints: 10,
    explanation: "The evidence suggests the account may be under delivery verification or proof-of-delivery review.",
    recommendedAction: "Prepare a single evidence timeline with tracking, carrier proof, delivery photos, buyer feedback and order IDs.",
  },
  {
    id: "ebay-bbe",
    terms: ["bbe", "bad buyer experience", "bad buying experience"],
    domain: "Reputation Risk",
    title: "Bad Buyer Experience signal",
    severity: "High",
    points: 19,
    revenuePoints: 12,
    explanation: "BBE-style language usually indicates marketplace trust deterioration beyond visible seller metrics.",
    recommendedAction: "Review buyer complaints, order defects, late shipments, item quality, unresolved INR patterns and repeat complaints.",
  },
  {
    id: "permanent-restriction",
    terms: ["permanently restricted", "not eligible to use", "selling privileges", "cannot be reversed", "not appealable"],
    domain: "Enforcement Risk",
    title: "Permanent restriction language",
    severity: "Critical",
    points: 30,
    revenuePoints: 20,
    explanation: "The language indicates a severe enforcement stage rather than a normal warning.",
    recommendedAction: "Stop repeated unsupported appeals and build a post-mortem. Focus on root cause, evidence quality and future operating controls.",
  },
  {
    id: "payout-hold",
    terms: ["payout hold", "funds on hold", "managed payments", "deferred settlement", "withdrawal freeze", "reserve"],
    domain: "Financial Risk",
    title: "Payout or settlement risk",
    severity: "High",
    points: 18,
    revenuePoints: 26,
    explanation: "The evidence indicates direct cashflow exposure through payout holds, settlement delays or reserves.",
    recommendedAction: "Prioritize cashflow protection: resolve verification issues, reduce disputes and prepare proof of fulfillment.",
  },
  {
    id: "paypal-chargeback",
    terms: ["chargeback", "paypal limitation", "paypal reserve", "stripe reserve", "dispute rate"],
    domain: "Payment Risk",
    title: "Payment processor risk",
    severity: "High",
    points: 17,
    revenuePoints: 22,
    explanation: "Payment processors usually react to chargeback, dispute, delivery and business-model signals.",
    recommendedAction: "Review chargeback ratio, refund policy, delivery proof and processor verification requirements.",
  },
  {
    id: "vero-ip",
    terms: ["vero", "intellectual property", "copyright", "trademark", "rights owner", "brand complaint"],
    domain: "VeRO / IP Risk",
    title: "IP or brand-rights complaint",
    severity: "High",
    points: 18,
    revenuePoints: 8,
    explanation: "Rights-owner complaints can remove listings and can accumulate into account restrictions.",
    recommendedAction: "Remove reused images, copied descriptions and unauthorized brand references. Keep supplier authorization evidence.",
  },
  {
    id: "counterfeit",
    terms: ["counterfeit", "authenticity", "fake item", "not authentic", "brand authenticity"],
    domain: "Authenticity Risk",
    title: "Counterfeit / authenticity concern",
    severity: "Critical",
    points: 26,
    revenuePoints: 16,
    explanation: "Authenticity concerns are severe because they challenge the legitimacy of inventory and supplier chain.",
    recommendedAction: "Prepare valid supplier invoices, distributor authorization, product photos and chain-of-custody evidence.",
  },
  {
    id: "verification",
    terms: ["verification", "business license", "utility bill", "passport", "kyc", "identity", "company documents", "warehouse"],
    domain: "Verification Risk",
    title: "Verification or KYC gap",
    severity: "Medium",
    points: 14,
    revenuePoints: 14,
    explanation: "Business, identity or warehouse verification gaps can trigger payout holds or account restrictions.",
    recommendedAction: "Ensure company country, address, tax, bank, Payoneer and ID data are consistent across systems.",
  },
  {
    id: "security",
    terms: ["security concerns", "suspicious activity", "linked account", "vpn", "ip address", "device", "unauthorized access"],
    domain: "Security Risk",
    title: "Security or account-activity concern",
    severity: "Critical",
    points: 24,
    revenuePoints: 14,
    explanation: "Security-language restrictions often relate to identity, access, device, IP or account-linking signals.",
    recommendedAction: "Review access patterns, user permissions, VPN usage, linked accounts, payment changes and device consistency.",
  },
  {
    id: "late-shipment",
    terms: ["late shipment", "late dispatch", "handling time", "valid tracking", "on-time delivery", "inr", "item not received"],
    domain: "Performance Risk",
    title: "Fulfillment performance risk",
    severity: "Medium",
    points: 13,
    revenuePoints: 8,
    explanation: "Late shipment, tracking and INR issues can degrade account health and escalate into wider trust issues.",
    recommendedAction: "Fix handling-time settings, tracking-upload timing, supplier SLA and carrier-verifiable tracking.",
  },
  {
    id: "product-quality",
    terms: ["product rating", "violation points", "low rating", "quality", "customer complaint", "return rate"],
    domain: "Reputation Risk",
    title: "Product quality / reputation risk",
    severity: "High",
    points: 16,
    revenuePoints: 16,
    explanation: "Low product ratings and complaint patterns can trigger platform actions even before full suspension.",
    recommendedAction: "Identify weak SKUs, remove high-risk products and review complaint themes before they become enforcement.",
  },
  {
    id: "supplier-risk",
    terms: ["amazon", "tba", "aliexpress", "retail arbitrage", "dropshipping", "supplier invoice", "unauthorized distributor"],
    domain: "Supplier Risk",
    title: "Supplier or sourcing exposure",
    severity: "High",
    points: 18,
    revenuePoints: 10,
    explanation: "Supplier-source signals can weaken marketplace confidence, especially when invoices or tracking show retail dependency.",
    recommendedAction: "Move toward authorized suppliers, clean invoices, carrier-verifiable tracking and consistent fulfillment control.",
  },
  {
    id: "product-policy",
    terms: ["adult item", "military", "restricted item", "weapon", "medical claim", "supplement", "category policy"],
    domain: "Product Policy Risk",
    title: "Restricted product or category risk",
    severity: "High",
    points: 17,
    revenuePoints: 8,
    explanation: "Some products are allowed only under strict conditions. Wrong category, images or claims can create violations.",
    recommendedAction: "Review product category, listing images, keywords and marketplace-specific restricted-product rules before relisting.",
  },
  {
    id: "community-reporting",
    terms: ["reported by competitors", "competitor reporting", "reports against me", "reported my listing"],
    domain: "Community Reporting Risk",
    title: "Community or competitor reporting risk",
    severity: "Medium",
    points: 12,
    revenuePoints: 6,
    explanation: "Repeated community reports can trigger listing reviews or account-level attention even when seller metrics look healthy.",
    recommendedAction: "Track whether reports are listing-level or account-level and reduce ambiguous claims in high-complaint categories.",
  },
  {
    id: "url-trust",
    terms: ["refund complaints", "trustpilot", "reddit", "scam", "fake reviews", "guaranteed results", "medical claims", "financial claims"],
    domain: "URL Trust Risk",
    title: "Business or URL trust concern",
    severity: "Medium",
    points: 14,
    revenuePoints: 4,
    explanation: "The signals indicate possible trust gaps such as exaggerated claims, refund friction or weak external validation.",
    recommendedAction: "Separate business legitimacy from claim credibility. Check reviews, refund complaints, proof and independent validation.",
  },
];

function normalize(value = "") {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function severityRank(severity: RiskSeverity) {
  return { Low: 1, Medium: 2, High: 3, Critical: 4 }[severity];
}

function normalizeProviderSeverity(severity: ProviderResult["findings"][number]["severity"]): RiskSeverity {
  return ({ info: "Low", low: "Low", medium: "Medium", high: "High", critical: "Critical" } as const)[severity];
}

function providerSeverityPoints(severity: RiskSeverity) {
  return { Low: 4, Medium: 10, High: 18, Critical: 28 }[severity];
}

function stageFromScore(score: number): HealthStage {
  if (score >= 84) return "Critical";
  if (score >= 68) return "Suspended";
  if (score >= 48) return "Restricted";
  if (score >= 25) return "Warning";
  return "Healthy";
}

function revenueImpactFromScore(score: number): RevenueImpact {
  if (score >= 75) return "Critical";
  if (score >= 55) return "High";
  if (score >= 30) return "Medium";
  return "Low";
}


function restrictionProbabilityFromScore(score: number): RiskSeverity {
  if (score >= 84) return "Critical";
  if (score >= 62) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

function buildTimeline(stage: HealthStage, primaryRiskDomain: string, score: number): RiskTimelinePoint[] {
  if (stage === "Healthy") {
    return [
      { label: "Now", status: "Healthy", detail: "No major enforcement language detected in the supplied evidence." },
      { label: "Next", status: "Monitor", detail: "Keep tracking, verification and payout evidence organized." },
    ];
  }

  if (stage === "Warning") {
    return [
      { label: "Before", status: "Healthy", detail: "Visible seller metrics may still look normal." },
      { label: "Now", status: "Warning", detail: `${primaryRiskDomain} signals are visible and should be handled before escalation.` },
      { label: "Next", status: "Possible restriction", detail: "Unresolved warnings can become payout holds, order limits or account review." },
    ];
  }

  if (stage === "Restricted") {
    return [
      { label: "Before", status: "Warning signs", detail: "Risk was likely building before the restriction appeared." },
      { label: "Now", status: "Restricted", detail: `${primaryRiskDomain} is currently the main visible risk domain.` },
      { label: "Next", status: "Escalation risk", detail: "If evidence is incomplete, the case may move toward suspension or payout freeze." },
    ];
  }

  if (stage === "Suspended") {
    return [
      { label: "Before", status: "Restricted or reviewed", detail: "The account likely passed through a review or warning stage." },
      { label: "Now", status: "Suspended", detail: `Detected score ${score}/100 with ${primaryRiskDomain} as the leading risk domain.` },
      { label: "Next", status: "Appeal or post-mortem", detail: "The outcome depends on root cause clarity, evidence quality and platform severity." },
    ];
  }

  return [
    { label: "Before", status: "High-risk pattern", detail: "Signals suggest severe trust, compliance or payment exposure." },
    { label: "Now", status: "Critical", detail: `${primaryRiskDomain} may already be affecting account access, payouts or listings.` },
    { label: "Next", status: "Business continuity risk", detail: "Prioritize cashflow protection, evidence timeline and operating-model changes." },
  ];
}

function nextOutcome(stage: HealthStage, revenueImpact: RevenueImpact) {
  if (stage === "Critical") return "Funds, listings or account access may already be at severe risk. Manual post-mortem is recommended.";
  if (stage === "Suspended") return "Appeal or recovery path depends on root cause and evidence quality.";
  if (stage === "Restricted") return "If unresolved, this can escalate into suspension, payout hold or permanent restriction.";
  if (stage === "Warning" && (revenueImpact === "High" || revenueImpact === "Critical")) return "Payout friction may escalate before account restriction appears.";
  if (stage === "Warning") return "Operational corrections may prevent escalation.";
  return "Maintain documentation and monitor for early warning signals.";
}

export function analyzeRisk(input: RiskEngineInput): RiskEngineOutput {
  const text = [
    input.marketplace,
    input.caseType || "",
    input.store || "",
    input.email || "",
    ...(input.fileNames || []),
    input.rawText || "",
  ].map(normalize).join(" ");

  const findings: RiskFinding[] = [];

  for (const rule of rules) {
    const evidence = rule.terms.filter((term) => text.includes(normalize(term)));
    if (evidence.length) {
      findings.push({
        id: rule.id,
        domain: rule.domain,
        title: rule.title,
        severity: rule.severity,
        points: rule.points,
        evidence,
        explanation: rule.explanation,
        recommendedAction: rule.recommendedAction,
      });
    }
  }

  for (const providerResult of input.providerResults || []) {
    if (providerResult.providerId !== "whois" || providerResult.status !== "completed") continue;

    for (const providerFinding of providerResult.findings) {
      const severity = normalizeProviderSeverity(providerFinding.severity);
      findings.push({
        id: providerFinding.id,
        domain: "WHOIS Risk",
        title: providerFinding.title,
        severity,
        points: providerSeverityPoints(severity),
        evidence: providerResult.evidence.map((item) => `${item.label}: ${item.value || "unavailable"}`),
        explanation: providerFinding.description,
        recommendedAction: "Validate domain ownership, registration age and domain status before relying on the target as a trusted business signal.",
      });
    }
  }

  const required = input.evidenceRequired || 0;
  const completedProviderCount = input.providerResults?.filter((result) => result.status === "completed").length || 0;
  const present = Math.max(input.evidencePresent || 0, completedProviderCount);
  const missingCount = Math.max(0, required - present);
  const missingEvidence: string[] = [];

  if (!input.store?.trim()) missingEvidence.push("Store URL, seller ID or website URL");
  if (!input.email?.trim()) missingEvidence.push("Report email");
  if (required && missingCount) missingEvidence.push(`${missingCount} required evidence group${missingCount > 1 ? "s" : ""}`);

  if (missingCount >= 2) {
    findings.push({
      id: "missing-evidence",
      domain: "Evidence Quality",
      title: "Evidence package is incomplete",
      severity: "Medium",
      points: 10 + missingCount * 3,
      evidence: [`${present}/${required} evidence groups detected`],
      explanation: "The assessment confidence is limited because important evidence groups are missing.",
      recommendedAction: "Upload the original notice, account dashboard, tracking/order proof and payment or verification evidence where relevant.",
    });
  }

  if (!findings.length) {
    findings.push({
      id: "low-signal",
      domain: "Evidence Quality",
      title: "No strong risk signal detected yet",
      severity: "Low",
      points: 8,
      evidence: [],
      explanation: "The uploaded evidence does not contain strong marketplace or payment-risk language in its metadata.",
      recommendedAction: "Upload the original notice or rename files with the issue type, for example tiktok-deferred-settlement.png.",
    });
  }

  findings.sort((a, b) => {
    const severityDiff = severityRank(b.severity) - severityRank(a.severity);
    return severityDiff || b.points - a.points;
  });

  const base = (input.fileNames?.length || 0) ? 12 : 0;
  const evidencePenalty = missingCount * 4;
  const score = clamp(base + evidencePenalty + findings.reduce((sum, item) => sum + item.points, 0), 0, 96);
  const revenueRiskScore = clamp(findings.reduce((sum, item) => {
    const rule = rules.find((r) => r.id === item.id);
    return sum + (rule?.revenuePoints || Math.round(item.points * 0.45));
  }, missingCount * 3), 0, 96);
  const trustScore = clamp(100 - Math.round(score * 0.72), 4, 100);

  const confidence = clamp(
    28 +
      (input.fileNames?.length || 0) * 7 +
      present * 10 +
      findings.filter((f) => f.id !== "low-signal").length * 5 -
      missingCount * 8,
    12,
    96
  );

  const stage = stageFromScore(score);
  const restrictionProbability = restrictionProbabilityFromScore(score);
  const revenueImpact = revenueImpactFromScore(revenueRiskScore);
  const domainCounts = findings.reduce<Record<string, number>>((acc, item) => {
    acc[item.domain] = (acc[item.domain] || 0) + item.points;
    return acc;
  }, {});
  const primaryRiskDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Evidence Quality";

  const rootCauseHypothesis = findings[0]?.title || "Insufficient evidence";
  const recommendedActions = Array.from(new Set(findings.slice(0, 5).map((item) => item.recommendedAction)));
  const timeline = buildTimeline(stage, primaryRiskDomain, score);

  return {
    score,
    trustScore,
    revenueRiskScore,
    stage,
    restrictionProbability,
    revenueImpact,
    confidence,
    primaryRiskDomain,
    rootCauseHypothesis,
    nextLikelyOutcome: nextOutcome(stage, revenueImpact),
    findings,
    missingEvidence,
    recommendedActions,
    timeline,
    disclaimer:
      "ShadowScore is an independent risk assessment based on seller-supplied evidence and visible indicators. It does not represent internal marketplace or payment-provider data.",
  };
}
