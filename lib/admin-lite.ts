import { getCurrentSession, getCurrentUser, type ShadowScoreUser } from "./auth";
import { getWorkspace, workspaceModeLabel, type PaymentIntent, type ShadowScoreIntake, type ShadowScoreReport } from "./workspace";

export type AdminLiteUserRow = {
  id: string;
  email: string;
  reportCount: number;
  paymentCount: number;
  intakeCount: number;
};

export type AdminLiteData = {
  currentUser: ShadowScoreUser;
  workspaceMode: string;
  users: AdminLiteUserRow[];
  intakes: ShadowScoreIntake[];
  paymentIntents: PaymentIntent[];
  reports: ShadowScoreReport[];
  overview: {
    totalUsers: number;
    totalIntakes: number;
    totalPaymentIntents: number;
    totalReports: number;
    pendingPayments: number;
    paidPayments: number;
    readyReports: number;
  };
};

function configuredAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminLiteAllowed(email?: string) {
  if (!email) return false;
  const allowlist = configuredAdminEmails();
  return allowlist.length > 0 && allowlist.includes(email.trim().toLowerCase());
}

function ensureUser(usersById: Map<string, AdminLiteUserRow>, id: string | undefined, email: string | undefined) {
  const userId = id || email || "unknown-user";
  if (!usersById.has(userId)) {
    usersById.set(userId, {
      id: userId,
      email: email || "Unavailable",
      reportCount: 0,
      paymentCount: 0,
      intakeCount: 0,
    });
  }
  const user = usersById.get(userId)!;
  if (user.email === "Unavailable" && email) user.email = email;
  return user;
}

export async function getAdminLiteData(): Promise<AdminLiteData> {
  const session = getCurrentSession();
  const currentUser = getCurrentUser();
  if (!session || !currentUser) throw new Error("Admin Lite requires an authenticated session.");
  if (!isAdminLiteAllowed(currentUser.email)) throw new Error("This signed-in account is not on the admin allowlist.");

  const workspace = await getWorkspace(session);
  const usersById = new Map<string, AdminLiteUserRow>();
  ensureUser(usersById, currentUser.id, currentUser.email);

  workspace.intakes.forEach((intake) => {
    const user = ensureUser(usersById, intake.userId, intake.email);
    user.intakeCount += 1;
  });

  workspace.reports.forEach((report) => {
    const intake = workspace.intakes.find((item) => item.intakeId === report.intakeId);
    const user = ensureUser(usersById, report.userId || intake?.userId || currentUser.id, intake?.email || currentUser.email);
    user.reportCount += 1;
  });

  workspace.paymentIntents.forEach((payment) => {
    const intake = workspace.intakes.find((item) => item.intakeId === payment.intakeId);
    const user = ensureUser(usersById, intake?.userId || currentUser.id, intake?.email || currentUser.email);
    user.paymentCount += 1;
  });

  return {
    currentUser,
    workspaceMode: workspaceModeLabel(),
    users: Array.from(usersById.values()),
    intakes: workspace.intakes,
    paymentIntents: workspace.paymentIntents,
    reports: workspace.reports,
    overview: {
      totalUsers: usersById.size,
      totalIntakes: workspace.intakes.length,
      totalPaymentIntents: workspace.paymentIntents.length,
      totalReports: workspace.reports.length,
      pendingPayments: workspace.paymentIntents.filter((payment) => payment.paymentStatus === "payment_pending" || payment.paymentStatus === "processing").length,
      paidPayments: workspace.paymentIntents.filter((payment) => payment.paymentStatus === "paid").length,
      readyReports: workspace.reports.filter((report) => report.reportStatus === "ready").length,
    },
  };
}
