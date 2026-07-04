import { getCurrentSession, getCurrentUser, type ShadowScoreUser } from "./auth";
import { createDefaultProviders, type Provider } from "./providers";
import { REPORT_ENGINE_VERSION } from "./reportPipeline";
import { RISK_ENGINE_VERSION } from "./riskEngine";
import { isSupabaseConfigured } from "./supabase";
import { getWorkspace, workspaceModeLabel, type PaymentIntent, type ShadowScoreIntake, type ShadowScoreReport } from "./workspace";

export const PROVIDER_FRAMEWORK_VERSION = "provider-framework-v23";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  reports: number;
  payments: number;
  lastActivity: string;
};

export type AdminConsoleData = {
  currentUser: ShadowScoreUser;
  users: AdminUserRow[];
  intakes: ShadowScoreIntake[];
  paymentIntents: PaymentIntent[];
  reports: ShadowScoreReport[];
  providerResults: Array<NonNullable<ShadowScoreReport["providerResults"]>[number] & { reportId: string; target: string; userId?: string }>;
  evidence: Array<{ reportId: string; target: string; userId?: string; evidenceSummary: unknown; providerEvidenceCount: number }>;
  systemStatus: {
    providerFrameworkVersion: string;
    riskEngineVersion: string;
    reportEngineVersion: string;
    workspaceMode: string;
    supabaseConnected: boolean;
    paymentProviderStatus: string;
    registeredProviders: Array<Pick<Provider, "id" | "name" | "version" | "category">>;
  };
};

function configuredAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_ALLOWLIST || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminAllowed(email?: string) {
  if (!email) return false;
  const allowlist = configuredAdminEmails();
  return allowlist.length > 0 && allowlist.includes(email.trim().toLowerCase());
}

function latestDate(values: Array<string | undefined>) {
  return values.filter(Boolean).sort().at(-1) || "No activity";
}

export async function getAdminConsoleData(): Promise<AdminConsoleData> {
  const session = getCurrentSession();
  const currentUser = getCurrentUser();
  if (!session || !currentUser) throw new Error("Admin console requires an authenticated session.");
  if (!isAdminAllowed(currentUser.email)) throw new Error("This account is not on the admin allowlist.");

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
      registeredProviders: createDefaultProviders().map((provider) => ({ id: provider.id, name: provider.name, version: provider.version, category: provider.category })),
    },
  };
}
