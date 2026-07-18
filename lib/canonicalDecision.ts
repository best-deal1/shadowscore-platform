export type InvestigationStatus = "PASS" | "REVIEW" | "STOP";
export type DecisionOutcome = "PROCEED" | "PROCEED_WITH_VERIFICATION" | "PAUSE_AND_VERIFY" | "DO_NOT_PROCEED";
export type DecisionLight = "GREEN" | "YELLOW" | "ORANGE" | "RED";
export type DecisionRiskLevel = "LOW" | "MODERATE" | "ELEVATED" | "HIGH";
export type CompanyType = "PUBLIC_COMPANY" | "PRIVATE_COMPANY" | "BANK" | "REGULATED_FINANCIAL_INSTITUTION" | "GOVERNMENT" | "NONPROFIT" | "EDUCATIONAL_INSTITUTION" | "MARKETPLACE" | "SMALL_BUSINESS" | "INDIVIDUAL" | "UNKNOWN";

export type CanonicalDecision = {
  status: InvestigationStatus;
  decisionOutcome: DecisionOutcome;
  decisionLight: DecisionLight;
  riskLevel: DecisionRiskLevel;
  headline: string;
  userMeaning: string;
  allowedActions: string[];
  blockedActions: string[];
  verificationRequired: string[];
  primaryUncertainty: string;
  decisionReasons: string[];
  confidence: { score: number; label: "High" | "Medium" | "Low" | "Unknown" };
};

const YELLOW_ALLOWED = ["continue preliminary discussions", "request documents", "perform limited onboarding", "perform a small reversible test transaction", "collect additional evidence"];
const YELLOW_BLOCKED = ["large payment", "full system access", "long-term contract", "high-value shipment", "sharing sensitive information"];
const ORANGE_BLOCKED = ["any payment beyond a reversible test", "granting access", "shipment", "signing a contract", "relying on the claimed legal identity"];

function confidence(score: number): CanonicalDecision["confidence"] {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  return { score: normalized, label: normalized >= 80 ? "High" : normalized >= 50 ? "Medium" : normalized > 0 ? "Low" : "Unknown" };
}

export function decisionDisplayLabel(outcome?: string) {
  if (outcome === "PROCEED") return "Proceed";
  if (outcome === "PROCEED_WITH_VERIFICATION") return "Proceed with verification";
  if (outcome === "PAUSE_AND_VERIFY") return "Review required";
  if (outcome === "DO_NOT_PROCEED") return "Do not proceed";
  return "Proceed with verification";
}

export function decisionLightDisplayLabel(light?: string) {
  if (light === "GREEN") return "Ready to proceed";
  if (light === "YELLOW") return "Verify first";
  if (light === "ORANGE") return "Review required";
  if (light === "RED") return "Do not proceed";
  return "Verify first";
}

export function decisionRiskDisplayLabel(riskLevel?: string) {
  if (riskLevel === "LOW") return "Low risk";
  if (riskLevel === "MODERATE") return "Moderate risk";
  if (riskLevel === "ELEVATED") return "Elevated risk";
  if (riskLevel === "HIGH") return "High risk";
  return "Risk under review";
}

export function buildCanonicalDecision(input: {
  status?: InvestigationStatus | "FAIL";
  hasMaterialContradiction?: boolean;
  hasConfirmedSeriousNegative?: boolean;
  hasStrongCorroboratedIdentity?: boolean;
  hasMissingCoreIdentity?: boolean;
  missingEvidence?: string[];
  decisionReasons?: string[];
  confidenceScore?: number;
}): CanonicalDecision {
  const reasons = input.decisionReasons?.filter(Boolean) || [];
  const missing = input.missingEvidence?.filter(Boolean) || [];
  if (input.hasConfirmedSeriousNegative || input.status === "STOP" || input.status === "FAIL") {
    return { status: "STOP", decisionOutcome: "DO_NOT_PROCEED", decisionLight: "RED", riskLevel: "HIGH", headline: "Do not proceed", userMeaning: "Material identity conflicts, serious unsupported claims, or significant negative indicators were detected. Do not proceed unless the issue is independently resolved.", allowedActions: ["independently resolve the issue", "document remediation evidence"], blockedActions: ["payment", "shipment", "granting access", "signing a contract", "sharing sensitive information"], verificationRequired: missing.length ? missing : ["Resolve confirmed negative indicators with authoritative evidence."], primaryUncertainty: missing[0] || "Confirmed serious negative evidence", decisionReasons: reasons.length ? reasons : ["Confirmed serious negative evidence was detected."], confidence: confidence(input.confidenceScore ?? 30) };
  }
  if (input.hasMaterialContradiction) {
    return { status: "REVIEW", decisionOutcome: "PAUSE_AND_VERIFY", decisionLight: "ORANGE", riskLevel: "ELEVATED", headline: "Review required", userMeaning: "Conflicting evidence, meaningful uncertainty, or elevated risk signals were detected. Payment, shipment, access, or contractual commitment should wait until the issue is resolved.", allowedActions: ["request authoritative documents", "resolve conflicting identity evidence", "run only reversible checks"], blockedActions: ORANGE_BLOCKED, verificationRequired: missing.length ? missing : ["Resolve the material identity contradiction."], primaryUncertainty: missing[0] || "Material identity contradiction", decisionReasons: reasons.length ? reasons : ["Material identity contradiction requires resolution."], confidence: confidence(input.confidenceScore ?? 45) };
  }
  if (input.status === "PASS" && input.hasStrongCorroboratedIdentity !== false && !input.hasMissingCoreIdentity) {
    return { status: "PASS", decisionOutcome: "PROCEED", decisionLight: "GREEN", riskLevel: "LOW", headline: "Proceed", userMeaning: "Sufficient reliable evidence was found. No material contradiction or significant warning was detected. You may proceed under normal commercial controls.", allowedActions: ["proceed under normal commercial controls", "archive the evidence chain", "continue routine monitoring"], blockedActions: [], verificationRequired: [], primaryUncertainty: "Routine commercial controls", decisionReasons: reasons.length ? reasons : ["Strong corroborated identity with no material warning."], confidence: confidence(input.confidenceScore ?? 85) };
  }
  return { status: "REVIEW", decisionOutcome: "PROCEED_WITH_VERIFICATION", decisionLight: "YELLOW", riskLevel: "MODERATE", headline: "Proceed with verification", userMeaning: "Public evidence is incomplete, but no material negative indicator was confirmed. You may continue preliminary discussions, request documents, perform limited onboarding, or run a small reversible test. High-risk actions must wait until verification checks are completed.", allowedActions: YELLOW_ALLOWED, blockedActions: YELLOW_BLOCKED, verificationRequired: missing.length ? missing : ["Verify legal business identity before high-risk action."], primaryUncertainty: missing[0] || "Legal business identity verification", decisionReasons: reasons.length ? reasons : ["Public evidence is incomplete without confirmed negative indicators."], confidence: confidence(input.confidenceScore ?? 55) };
}
