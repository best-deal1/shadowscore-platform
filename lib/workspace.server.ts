import { buildReadyReport, canGenerateReport } from "./reportPipeline";
import { getMutableMemoryWorkspace } from "./workspaceStore";
import { presentReportForEndUser, type WorkspaceSession } from "./workspace";
import { isSupabaseConfigured } from "./supabase";
import { SupabaseWebsiteScanHistoryRepository } from "./websiteIntelligence/supabaseHistory";
import { SupabaseWebsiteAlertRepository } from "./websiteIntelligence/supabaseAlerts";
import { SupabaseWebsiteWatchlistRepository } from "./websiteIntelligence/supabaseWatchlist";

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
  const websiteHistoryRepository = isSupabaseConfigured() && session.accessToken ? new SupabaseWebsiteScanHistoryRepository(session.userId, session.accessToken) : undefined;
  const websiteAlertRepository = isSupabaseConfigured() && session.accessToken ? new SupabaseWebsiteAlertRepository(session.userId, session.accessToken) : undefined;
  const websiteWatchlistRepository = isSupabaseConfigured() && session.accessToken ? new SupabaseWebsiteWatchlistRepository(session.userId, session.accessToken) : undefined;
  const report = await buildReadyReport({ intake, paymentIntent: intent, websiteHistoryRepository, websiteAlertRepository, websiteWatchlistRepository, websiteTenantId: websiteAlertRepository ? session.userId : undefined });
  workspace.reports = [report, ...workspace.reports.filter((item) => item.paymentIntentId !== intent.id)].slice(0, 25);
  intake.reportStatus = "ready";
  return presentReportForEndUser(report);
}
