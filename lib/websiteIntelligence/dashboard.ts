import type { CanonicalWebsiteReport, CanonicalWebsiteReportStatus } from "./canonicalReport";

export const WEBSITE_FINDING_SEVERITIES = ["high", "medium", "low", "info"] as const;

const statusLabels: Record<CanonicalWebsiteReportStatus, string> = {
  complete: "Assessment complete",
  partial: "Partial evidence",
  unavailable: "Evidence unavailable",
};

/** Derives presentation metrics without adding data to the canonical report. */
export function getWebsiteIntelligenceDashboardMetrics(report: CanonicalWebsiteReport) {
  const severityCounts = Object.fromEntries(
    WEBSITE_FINDING_SEVERITIES.map((severity) => [
      severity,
      report.findings.filter((finding) => finding.severity === severity).length,
    ]),
  ) as Record<(typeof WEBSITE_FINDING_SEVERITIES)[number], number>;

  return {
    statusLabel: statusLabels[report.status],
    severityCounts,
    topRecommendedActions: report.recommendedActions.slice(0, 3),
    hasLimitedEvidence: report.status !== "complete" || report.limitations.length > 0,
  };
}
