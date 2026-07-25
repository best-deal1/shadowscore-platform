import type { WebsiteIntelligenceReport, WebsiteModuleStatus } from "./types";

export const WEBSITE_REPORT_SCHEMA_VERSION = "website-intelligence-report-v1" as const;

export type CanonicalWebsiteReportStatus = "complete" | "partial" | "unavailable";

export type CanonicalWebsiteEvidence = {
  id: string;
  moduleId: string;
  label: string;
  value: string;
  source: string;
  observedAt: string;
  availability: "observed" | "unavailable";
};

export type CanonicalWebsiteFinding = {
  id: string;
  moduleId: string;
  title: string;
  statement: string;
  severity: "info" | "low" | "medium" | "high";
  businessImpact: string;
  recommendation: string;
  evidenceIds: string[];
};

export type CanonicalWebsiteReport = {
  schemaVersion: typeof WEBSITE_REPORT_SCHEMA_VERSION;
  reportType: "website-intelligence";
  subject: { domain: string };
  generatedAt: string;
  status: CanonicalWebsiteReportStatus;
  summary: string;
  coverage: { completedModules: number; totalModules: number; percent: number };
  assessments: Array<{ id: string; title: string; summary: string }>;
  modules: Array<{ id: string; name: string; status: WebsiteModuleStatus; source: string; confidence: number; summary: string }>;
  findings: CanonicalWebsiteFinding[];
  evidence: CanonicalWebsiteEvidence[];
  recommendedActions: string[];
  limitations: string[];
};

/**
 * Converts acquisition output into the stable report contract used by every
 * Website Intelligence renderer. Claims retain their module and evidence IDs.
 */
export function toCanonicalWebsiteReport(report: WebsiteIntelligenceReport): CanonicalWebsiteReport {
  const completedModules = report.modules.filter((module) => module.status === "completed").length;
  const totalModules = report.modules.length;
  const evidenceIds = new Set<string>();
  const canonicalId = (moduleId: string, evidenceId: string) => `${moduleId}:${evidenceId}`;
  const evidence = report.modules.flatMap((module) => module.evidence.map((item) => {
    const id = canonicalId(module.moduleId, item.id);
    evidenceIds.add(id);
    return {
      id,
      moduleId: module.moduleId,
      label: item.label,
      value: item.value,
      source: item.source,
      observedAt: item.observedAt,
      availability: module.status === "completed" ? "observed" as const : "unavailable" as const,
    };
  }));
  const findings = report.modules.flatMap((module) => module.findings.map((finding) => ({
    ...finding,
    id: `${module.moduleId}:${finding.id}`,
    moduleId: module.moduleId,
    evidenceIds: finding.evidenceIds
      .map((id) => canonicalId(module.moduleId, id))
      .filter((id) => evidenceIds.has(id)),
  })));
  const limitations = report.modules
    .filter((module) => module.status !== "completed")
    .map((module) => `${module.moduleName}: ${module.executiveSummary}`);
  const status: CanonicalWebsiteReportStatus = completedModules === totalModules
    ? "complete"
    : completedModules > 0 ? "partial" : "unavailable";

  return {
    schemaVersion: WEBSITE_REPORT_SCHEMA_VERSION,
    reportType: "website-intelligence",
    subject: { domain: report.target },
    generatedAt: report.scannedAt,
    status,
    summary: report.executiveSummary,
    coverage: {
      completedModules,
      totalModules,
      percent: totalModules ? Math.round((completedModules / totalModules) * 100) : 0,
    },
    assessments: [
      { id: "technical-health", title: "Technical health", summary: report.technicalHealth },
      { id: "security-posture", title: "Security posture", summary: report.securityPosture },
      { id: "infrastructure-maturity", title: "Infrastructure maturity", summary: report.infrastructureMaturity },
      { id: "trust-indicators", title: "Website trust indicators", summary: report.trustIndicators },
    ],
    modules: report.modules.map((module) => ({
      id: module.moduleId,
      name: module.moduleName,
      status: module.status,
      source: module.source,
      confidence: module.confidence,
      summary: module.executiveSummary,
    })),
    findings,
    evidence,
    recommendedActions: report.recommendedActions,
    limitations,
  };
}
