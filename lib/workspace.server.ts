import { buildReadyReport, canGenerateReport } from "./reportPipeline";
import { getMutableMemoryWorkspace } from "./workspaceStore";
import { presentReportForEndUser, type WorkspaceSession } from "./workspace";
import { loadWebsiteChangeTimeline, persistWebsiteScan } from "./websiteIntelligence/history";

export async function markPaymentPaidAndGenerateReport(session: WorkspaceSession, paymentIntentId: string) {
  const workspace = getMutableMemoryWorkspace(session.userId);
  const intent = workspace.paymentIntents.find((item) => item.id === paymentIntentId);
  if (!intent) throw new Error("Payment intent not found.");
  intent.paymentStatus = "paid";
  const intake = workspace.intakes.find((item) => item.intakeId === intent.intakeId);
  if (!intake) throw new Error("Intake not found for payment intent.");
  intake.paymentStatus = "paid";
  intake.reportStatus = "generating";
  if (!canGenerateReport(intent)) throw new Error("Payment is not paid.");
  const report = await buildReadyReport({ intake, paymentIntent: intent });
  const websiteScan = report.reportSummary?.websiteIntelligence;
  if (websiteScan && report.reportSummary) {
    const stored = await persistWebsiteScan({ userId: session.userId, report: websiteScan, accessToken: session.accessToken });
    report.reportSummary.websiteChangeReport = stored.changeReport;
    report.reportSummary.websiteChangeTimeline = await loadWebsiteChangeTimeline({ userId: session.userId, target: websiteScan.target, accessToken: session.accessToken });
  }
  workspace.reports = [report, ...workspace.reports.filter((item) => item.paymentIntentId !== intent.id)].slice(0, 25);
  intake.reportStatus = "ready";
  return presentReportForEndUser(report);
}
