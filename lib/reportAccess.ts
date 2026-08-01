import type { PaymentStatus, ReportStatus, ShadowScoreReport } from "./workspace";

export function canViewFullReport(report: Pick<ShadowScoreReport, "paymentStatus" | "reportStatus">) {
  return report.paymentStatus === "paid" && report.reportStatus === "ready"
    || report.paymentStatus === "admin_comped" && report.reportStatus === "ready";
}

export function nextReportRoute(reportId: string, paymentStatus: PaymentStatus, reportStatus: ReportStatus) {
  if ((paymentStatus === "paid" || paymentStatus === "admin_comped") && reportStatus === "ready") return `/reports/${reportId}`;
  if (paymentStatus === "paid" || paymentStatus === "admin_comped" || paymentStatus === "processing" || reportStatus === "generating" || reportStatus === "failed") return `/reports/${reportId}/processing`;
  return `/reports/${reportId}/unlock`;
}
