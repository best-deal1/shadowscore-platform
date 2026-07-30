import { buildReadyReport, canGenerateReport } from "./reportPipeline";
import { getMutableMemoryWorkspace } from "./workspaceStore";
import { getWorkspace, presentReportForEndUser, type WorkspaceSession } from "./workspace";
import { isSupabaseConfigured, requirePersistentSessionInProduction, supabaseFetch } from "./supabase";
import { SupabaseWebsiteScanHistoryRepository } from "./websiteIntelligence/supabaseHistory";
import { SupabaseWebsiteAlertRepository } from "./websiteIntelligence/supabaseAlerts";
import { SupabaseWebsiteWatchlistRepository } from "./websiteIntelligence/supabaseWatchlist";

export async function markPaymentPaidAndGenerateReport(session: WorkspaceSession, paymentIntentId: string) {
  if (isSupabaseConfigured() && session.accessToken) {
    const snapshot = await getWorkspace(session);
    const intent = snapshot.paymentIntents.find((item) => item.id === paymentIntentId);
    if (!intent) throw new Error("Payment intent not found.");
    const completed = snapshot.reports.find((item) => item.paymentIntentId === paymentIntentId && item.paymentStatus === "paid" && item.reportStatus === "ready");
    if (completed) return completed;
    const intake = snapshot.intakes.find((item) => item.intakeId === intent.intakeId);
    if (!intake) throw new Error("Intake not found for payment intent.");
    intent.paymentStatus = "paid";
    await supabaseFetch(`/rest/v1/payment_intents?id=eq.${encodeURIComponent(paymentIntentId)}`, { method: "PATCH", body: JSON.stringify({ status: "paid", updated_at: new Date().toISOString() }) }, session.accessToken);
    await supabaseFetch(`/rest/v1/intakes?intake_id=eq.${encodeURIComponent(intake.intakeId)}`, { method: "PATCH", body: JSON.stringify({ payment_status: "paid", report_status: "generating", updated_at: new Date().toISOString() }) }, session.accessToken);
    await supabaseFetch(`/rest/v1/reports?payment_intent_id=eq.${encodeURIComponent(paymentIntentId)}`, { method: "PATCH", body: JSON.stringify({ payment_status: "paid", report_status: "generating" }) }, session.accessToken);
    const websiteHistoryRepository = new SupabaseWebsiteScanHistoryRepository(session.userId, session.accessToken);
    const websiteAlertRepository = new SupabaseWebsiteAlertRepository(session.userId, session.accessToken);
    const websiteWatchlistRepository = new SupabaseWebsiteWatchlistRepository(session.userId, session.accessToken);
    try {
      const report = await buildReadyReport({ intake, paymentIntent: intent, websiteHistoryRepository, websiteAlertRepository, websiteWatchlistRepository, websiteTenantId: session.userId });
      await supabaseFetch(`/rest/v1/reports?payment_intent_id=eq.${encodeURIComponent(paymentIntentId)}`, { method: "PATCH", body: JSON.stringify({ title: report.title, entity: report.entity, platform: report.platform, risk_score: report.riskScore || 0, confidence_score: report.confidenceScore || 0, stage: report.stage, source: report.source, top_factors: report.topFactors, risk_engine_version: report.engineVersion || "current", provider_versions: report.providerVersions || {}, evidence_snapshot: report.evidenceSummary || {}, report_version: "pr5", score_explanation: report.reportSummary?.message || "Report generated.", provider_results: report.providerResults || [], payment_status: "paid", report_status: "ready", ready_at: report.readyAt, metadata: { paymentStatus: "paid", reportStatus: "ready", reportSummary: report.reportSummary } }) }, session.accessToken);
      await supabaseFetch(`/rest/v1/intakes?intake_id=eq.${encodeURIComponent(intake.intakeId)}`, { method: "PATCH", body: JSON.stringify({ report_status: "ready", updated_at: new Date().toISOString() }) }, session.accessToken);
      return presentReportForEndUser(report);
    } catch (error) {
      await supabaseFetch(`/rest/v1/reports?payment_intent_id=eq.${encodeURIComponent(paymentIntentId)}`, { method: "PATCH", body: JSON.stringify({ payment_status: "paid", report_status: "failed" }) }, session.accessToken);
      await supabaseFetch(`/rest/v1/intakes?intake_id=eq.${encodeURIComponent(intake.intakeId)}`, { method: "PATCH", body: JSON.stringify({ report_status: "failed", updated_at: new Date().toISOString() }) }, session.accessToken);
      throw error;
    }
  }
  requirePersistentSessionInProduction(session.accessToken);
  const workspace = getMutableMemoryWorkspace(session.userId);
  const intent = workspace.paymentIntents.find((item) => item.id === paymentIntentId);
  if (!intent) throw new Error("Payment intent not found.");
  const completed = workspace.reports.find((item) => item.paymentIntentId === paymentIntentId && item.paymentStatus === "paid" && item.reportStatus === "ready");
  if (completed) return presentReportForEndUser(completed);
  const active = workspace.reports.find((item) => item.paymentIntentId === paymentIntentId && item.reportStatus === "generating");
  if (active) return presentReportForEndUser(active);
  intent.paymentStatus = "paid";
  const intake = workspace.intakes.find((item) => item.intakeId === intent.intakeId);
  if (!intake) throw new Error("Intake not found for payment intent.");
  intake.paymentStatus = "paid";
  intake.reportStatus = "generating";
  if (!canGenerateReport(intent)) throw new Error("Payment is not paid.");
  const websiteHistoryRepository = isSupabaseConfigured() && session.accessToken ? new SupabaseWebsiteScanHistoryRepository(session.userId, session.accessToken) : undefined;
  const websiteAlertRepository = isSupabaseConfigured() && session.accessToken ? new SupabaseWebsiteAlertRepository(session.userId, session.accessToken) : undefined;
  const websiteWatchlistRepository = isSupabaseConfigured() && session.accessToken ? new SupabaseWebsiteWatchlistRepository(session.userId, session.accessToken) : undefined;
  try {
    const report = await buildReadyReport({ intake, paymentIntent: intent, websiteHistoryRepository, websiteAlertRepository, websiteWatchlistRepository, websiteTenantId: websiteAlertRepository ? session.userId : undefined });
    workspace.reports = [report, ...workspace.reports.filter((item) => item.paymentIntentId !== intent.id)].slice(0, 25);
    intake.reportStatus = "ready";
    return presentReportForEndUser(report);
  } catch (error) {
    intake.reportStatus = "failed";
    workspace.reports = workspace.reports.map((item) => item.paymentIntentId === intent.id ? { ...item, paymentStatus: "paid", reportStatus: "failed" } : item);
    throw error;
  }
}
