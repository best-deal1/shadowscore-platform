import { classifyEmailInvestigation, type EmailInvestigationRouting } from "./emailDomains";
import type { ShadowScoreReport } from "./workspace";

export type ExecutiveReportKind = "personal_identity" | "business_domain_legal_entity" | "business";

/** Recovers the persisted decision, with a compatibility fallback for reports created before routing was stored. */
export function reportEmailRouting(report: Pick<ShadowScoreReport, "target" | "entity" | "reportSummary">): EmailInvestigationRouting | undefined {
  return report.reportSummary?.investigationRouting || classifyEmailInvestigation(report.reportSummary?.submittedSeed || report.target || report.entity);
}

export function executiveReportKind(report: Pick<ShadowScoreReport, "target" | "entity" | "reportSummary">): ExecutiveReportKind {
  const routing = reportEmailRouting(report);
  if (routing?.primaryInvestigationType === "DOMAIN_BUSINESS_LEGAL_ENTITY") return "business_domain_legal_entity";
  if (routing?.primaryInvestigationType === "PERSON_IDENTITY" || report.reportSummary?.investigationType === "PERSONAL_IDENTITY") return "personal_identity";
  return "business";
}
