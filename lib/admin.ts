import type { ShadowScoreUser } from "./auth";
import type { AdminConsoleData, AdminUserRow } from "./adminTypes";
import { DEFAULT_PROVIDER_METADATA } from "./providers/metadata";
import { REPORT_ENGINE_VERSION } from "./reportPipeline";
import { RISK_ENGINE_VERSION } from "./riskEngine";
import { isSupabaseConfigured } from "./supabase";
import { getWorkspace, workspaceModeLabel } from "./workspace";

export const PROVIDER_FRAMEWORK_VERSION = "provider-framework-v23";

export type { AdminConsoleData, AdminUserRow } from "./adminTypes";

function latestDate(values: Array<string | undefined>) {
  return values.filter(Boolean).sort().at(-1) || "No activity";
}

export async function getAdminConsoleDataForSession(session: import("./workspace").WorkspaceSession, currentUser: ShadowScoreUser): Promise<AdminConsoleData> {
  const workspace = await getWorkspace(session);
  const reports = workspace.reports;
  const paymentIntents = workspace.paymentIntents;
  const intakes = workspace.intakes;
  const usersById = new Map<string, AdminUserRow>();

  const ensureUser = (id: string | undefined, email: string | undefined, name?: string) => {
    const userId = id || "unknown-user";
    if (!usersById.has(userId)) {
      usersById.set(userId, {
        id: userId,
        name: name || (userId === currentUser.id ? currentUser.name : "Unknown user"),
        email: email || (userId === currentUser.id ? currentUser.email : "Unavailable"),
        createdAt: userId === currentUser.id ? currentUser.createdAt : "Unavailable",
        reports: 0,
        payments: 0,
        lastActivity: "No activity",
      });
    }
    return usersById.get(userId)!;
  };

  ensureUser(currentUser.id, currentUser.email, currentUser.name);
  reports.forEach((report) => {
    const row = ensureUser(report.userId, undefined);
    row.reports += 1;
    row.lastActivity = latestDate([row.lastActivity === "No activity" ? undefined : row.lastActivity, report.readyAt, report.createdAt]);
  });
  intakes.forEach((intake) => {
    const row = ensureUser(intake.userId, intake.email);
    row.lastActivity = latestDate([row.lastActivity === "No activity" ? undefined : row.lastActivity, intake.createdAt]);
  });
  paymentIntents.forEach((payment) => {
    const intake = intakes.find((item) => item.intakeId === payment.intakeId);
    const row = ensureUser(intake?.userId || currentUser.id, intake?.email || currentUser.email, currentUser.name);
    row.payments += 1;
    row.lastActivity = latestDate([row.lastActivity === "No activity" ? undefined : row.lastActivity, payment.createdAt]);
  });

  const providerResults = reports.flatMap((report) => (report.providerResults || []).map((result) => ({ ...result, reportId: report.reportId, target: report.target || report.entity, userId: report.userId })));
  const evidence = reports.map((report) => ({
    reportId: report.reportId,
    target: report.target || report.entity,
    userId: report.userId,
    evidenceSummary: report.evidenceSummary || {},
    providerEvidenceCount: (report.providerResults || []).reduce((sum, result) => sum + result.evidence.length, 0),
  }));

  return {
    currentUser,
    users: Array.from(usersById.values()),
    intakes,
    paymentIntents,
    reports,
    providerResults,
    evidence,
    systemStatus: {
      providerFrameworkVersion: PROVIDER_FRAMEWORK_VERSION,
      riskEngineVersion: RISK_ENGINE_VERSION,
      reportEngineVersion: REPORT_ENGINE_VERSION,
      workspaceMode: workspaceModeLabel(),
      supabaseConnected: isSupabaseConfigured(),
      paymentProviderStatus: "not_connected_placeholder",
      registeredProviders: DEFAULT_PROVIDER_METADATA,
    },
  };
}
