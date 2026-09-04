import "server-only";

import { buildReadyReport } from "./reportPipeline";
import { normalizeIntakeIdentitySignals } from "./personalIdentity";
import { classifyEmailInvestigation } from "./emailDomains";
import { isSupabaseConfigured, supabaseFetch } from "./supabase";
import { presentReportForEndUser, type ShadowScoreIntake, type ShadowScoreReport, type WorkspaceSession } from "./workspace";

export const ADMIN_REPORT_NOTICE = "Administrator test report - no customer payment was processed.";
export type AdministratorRole = "user" | "admin";

type ProfileRow = { role: string };
type IntakeRow = Record<string, unknown> & { intake_id: string; user_id: string; scan_mode: ShadowScoreIntake["scanMode"]; target: string; platform: string; email: string };

export class AdminReportAccessError extends Error {
  constructor(message: string, readonly status: 400 | 403 | 404 | 503) {
    super(message);
  }
}

export async function getAdministratorRole(session: WorkspaceSession): Promise<AdministratorRole> {
  if (!session.accessToken || !isSupabaseConfigured()) return "user";
  const rows = await supabaseFetch<ProfileRow[]>(`/rest/v1/profiles?id=eq.${encodeURIComponent(session.userId)}&select=role&limit=1`, {}, session.accessToken);
  return rows[0]?.role === "admin" ? "admin" : "user";
}

function mapAdministratorIntake(row: IntakeRow): ShadowScoreIntake {
  return {
    intakeId: row.intake_id,
    userId: row.user_id,
    scanMode: row.scan_mode,
    target: row.target,
    platform: row.platform,
    caseType: typeof row.case_type === "string" ? row.case_type : undefined,
    email: row.email,
    submittedSeed: typeof row.submitted_seed === "string" ? row.submitted_seed : row.target,
    investigationRouting: (row.investigation_routing as ShadowScoreIntake["investigationRouting"]) || classifyEmailInvestigation(row.target),
    identitySignals: row.scan_mode === "personal"
      ? normalizeIntakeIdentitySignals(row.identity_signals, { target: row.target, email: row.email })
      : undefined,
    fileNames: Array.isArray(row.file_names) ? row.file_names as string[] : [],
    visibleSignalCategories: Array.isArray(row.visible_signal_categories) ? row.visible_signal_categories as string[] : [],
    paymentStatus: "admin_comped",
    reportStatus: "generating",
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export async function generateAdministratorReport(session: WorkspaceSession, intakeId: string, reason: "production testing" | "internal review" = "production testing"): Promise<ShadowScoreReport> {
  if (await getAdministratorRole(session) !== "admin") throw new AdminReportAccessError("Administrator access is required.", 403);
  if (!session.accessToken || !isSupabaseConfigured()) throw new AdminReportAccessError("Persistent administrator storage is required.", 503);

  const existing = await supabaseFetch<Record<string, unknown>[]>(`/rest/v1/reports?intake_id=eq.${encodeURIComponent(intakeId)}&access_type=eq.administrator&select=*&order=created_at.desc&limit=1`, {}, session.accessToken);
  if (existing[0]) {
    const row = existing[0];
    const audit = await supabaseFetch<Record<string, unknown>[]>(`/rest/v1/admin_report_audit?report_id=eq.${encodeURIComponent(String(row.report_id))}&select=id&limit=1`, {}, session.accessToken);
    if (!audit[0]) await supabaseFetch("/rest/v1/admin_report_audit", { method: "POST", body: JSON.stringify({ administrator_user_id: session.userId, investigation_id: intakeId, report_id: String(row.report_id), reason }) }, session.accessToken);
    return presentReportForEndUser({ reportId: String(row.report_id), intakeId: String(row.intake_id), userId: String(row.user_id), title: String(row.title), entity: String(row.entity), platform: String(row.platform), scanMode: row.scan_mode as ShadowScoreReport["scanMode"], target: String(row.target), riskScore: Number(row.risk_score), confidenceScore: Number(row.confidence_score), stage: row.stage as ShadowScoreReport["stage"], createdAt: String(row.created_at), readyAt: String(row.ready_at), paymentStatus: "admin_comped", accessType: "administrator", administratorNotice: ADMIN_REPORT_NOTICE, reportStatus: row.report_status as ShadowScoreReport["reportStatus"], source: String(row.source), engineVersion: String(row.risk_engine_version), providerVersions: row.provider_versions as Record<string, string>, providerResults: row.provider_results as ShadowScoreReport["providerResults"], evidenceSummary: row.evidence_snapshot, reportSummary: (row.metadata as { reportSummary?: ShadowScoreReport["reportSummary"] })?.reportSummary, topFactors: row.top_factors as string[] });
  }

  const intakes = await supabaseFetch<IntakeRow[]>(`/rest/v1/intakes?intake_id=eq.${encodeURIComponent(intakeId)}&select=*&limit=1`, {}, session.accessToken);
  if (!intakes[0]) throw new AdminReportAccessError("Investigation not found.", 404);
  const intake = mapAdministratorIntake(intakes[0]);
  const now = new Date().toISOString();
  const reportId = `admin-${intake.intakeId}-${Date.now().toString(36)}`;
  const report = await buildReadyReport({
    intake,
    paymentIntent: { id: `admin-access-${intake.intakeId}`, intakeId: intake.intakeId, planName: "Administrator access", price: "$0.00", method: "administrator", paymentStatus: "paid", createdAt: now },
    reportId,
    createdAt: now,
  });
  const metadata = { paymentStatus: "admin_comped", reportStatus: "ready", accessType: "administrator", administratorNotice: ADMIN_REPORT_NOTICE, reportSummary: report.reportSummary };
  await supabaseFetch("/rest/v1/reports", { method: "POST", body: JSON.stringify({ user_id: session.userId, report_id: reportId, intake_id: intake.intakeId, title: report.title, entity: report.entity, platform: report.platform, scan_mode: report.scanMode, target: report.target, risk_score: report.riskScore || 0, confidence_score: report.confidenceScore || 0, stage: report.stage, source: report.source, top_factors: report.topFactors, risk_engine_version: report.engineVersion || "current", provider_versions: report.providerVersions || {}, provider_results: report.providerResults || [], evidence_snapshot: report.evidenceSummary || {}, report_version: "admin-v1", score_explanation: report.reportSummary?.message || "Report generated.", payment_status: "admin_comped", access_type: "administrator", report_status: "ready", metadata, created_at: report.createdAt, ready_at: report.readyAt }) }, session.accessToken);
  await supabaseFetch("/rest/v1/admin_report_audit", { method: "POST", body: JSON.stringify({ administrator_user_id: session.userId, investigation_id: intake.intakeId, report_id: reportId, reason }) }, session.accessToken);
  return presentReportForEndUser({ ...report, paymentStatus: "admin_comped", accessType: "administrator", administratorNotice: ADMIN_REPORT_NOTICE });
}
