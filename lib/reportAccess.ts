import type { PaymentStatus, ReportStatus, ShadowScoreReport } from "./workspace";

export function canViewFullReport(report: Pick<ShadowScoreReport, "paymentStatus" | "reportStatus">) {
  return report.paymentStatus === "paid" && report.reportStatus === "ready";
}

export function nextReportRoute(reportId: string, paymentStatus: PaymentStatus, reportStatus: ReportStatus) {
  if (paymentStatus === "paid" && reportStatus === "ready") return `/reports/${reportId}`;
  if (paymentStatus === "paid" || paymentStatus === "processing" || reportStatus === "generating" || reportStatus === "failed") return `/reports/${reportId}/processing`;
  return `/reports/${reportId}/unlock`;
}
