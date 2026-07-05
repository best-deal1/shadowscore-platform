"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { getAdminLiteData, isAdminLiteAllowed, type AdminLiteData } from "../../lib/admin-lite";
import { getCurrentSession, getCurrentUser } from "../../lib/auth";
import type { PaymentStatus, ReportStatus } from "../../lib/workspace";

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[30px] border border-white/10 bg-white/[0.035] p-6 ${className}`}>{children}</section>;
}

function StatusPill({ value }: { value?: PaymentStatus | ReportStatus | string }) {
  const tone = value === "ready" || value === "paid" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : value === "failed" ? "border-red-400/30 bg-red-500/10 text-red-100" : "border-yellow-400/30 bg-yellow-500/10 text-yellow-100";
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tone}`}>{value || "unknown"}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="mt-5 rounded-2xl border border-white/10 bg-black/45 p-4 text-sm text-zinc-500">No {label} records available in the current workspace.</div>;
}

function AccessDenied({ email }: { email?: string }) {
  return (
    <ShadowScoreLayout>
      <main className="mx-auto max-w-3xl px-6 py-20">
        <Panel>
          <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Admin Lite Protected</div>
          <h1 className="mt-3 text-4xl font-black text-white">Access Denied</h1>
          <p className="mt-4 text-zinc-400">{email ? `${email} is not listed in NEXT_PUBLIC_ADMIN_EMAILS.` : "This signed-in account is not listed in NEXT_PUBLIC_ADMIN_EMAILS."}</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-zinc-200">Return to dashboard</Link>
        </Panel>
      </main>
    </ShadowScoreLayout>
  );
}

export default function AdminLitePage() {
  const router = useRouter();
  const [data, setData] = useState<AdminLiteData | null>(null);
  const [deniedEmail, setDeniedEmail] = useState<string | undefined>();

  useEffect(() => {
    const user = getCurrentUser();
    const session = getCurrentSession();
    if (!user || !session) {
      router.push("/login");
      return;
    }
    if (!isAdminLiteAllowed(user.email)) {
      setDeniedEmail(user.email);
      return;
    }
    getAdminLiteData().then(setData).catch(() => setDeniedEmail(user.email));
  }, [router]);

  const overview = useMemo(() => data ? [
    ["Signed-in admin email", data.currentUser.email],
    ["Workspace mode", data.workspaceMode],
    ["Total users", data.overview.totalUsers.toString()],
    ["Total intakes", data.overview.totalIntakes.toString()],
    ["Total payment intents", data.overview.totalPaymentIntents.toString()],
    ["Total reports", data.overview.totalReports.toString()],
    ["Pending payments", data.overview.pendingPayments.toString()],
    ["Paid payments", data.overview.paidPayments.toString()],
    ["Ready reports", data.overview.readyReports.toString()],
  ] : [], [data]);

  if (deniedEmail) return <AccessDenied email={deniedEmail} />;
  if (!data) return <ShadowScoreLayout><main className="mx-auto max-w-4xl px-6 py-20 text-zinc-400">Loading Admin Lite...</main></ShadowScoreLayout>;

  return (
    <ShadowScoreLayout>
      <main className="mx-auto max-w-7xl px-6 py-14">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-red-300">Read Only</div>
        <h1 className="mt-4 text-5xl font-black tracking-tight text-white">Admin Lite</h1>
        <p className="mt-4 max-w-3xl text-zinc-400">Business visibility for users, intakes, payment intents, and reports. This route is read-only and exposes no mutation controls.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {overview.map(([label, value]) => <Panel key={label}><div className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-600">{label}</div><div className="mt-3 break-words text-2xl font-black text-white">{value}</div></Panel>)}
        </div>

        <div className="mt-10 grid gap-8">
          <Panel><h2 className="text-2xl font-black text-white">Users</h2><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.18em] text-zinc-600"><tr>{["Email","User ID","Report count","Payment count","Intake count"].map((h) => <th key={h} className="pb-3">{h}</th>)}</tr></thead><tbody>{data.users.map((user) => <tr key={user.id} className="border-t border-white/10"><td className="py-4 text-zinc-300">{user.email}</td><td className="font-mono text-xs text-zinc-400">{user.id}</td><td>{user.reportCount}</td><td>{user.paymentCount}</td><td>{user.intakeCount}</td></tr>)}</tbody></table></div></Panel>

          <Panel><h2 className="text-2xl font-black text-white">Intakes</h2>{data.intakes.length === 0 ? <EmptyState label="intake" /> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.18em] text-zinc-600"><tr>{["Intake ID","Email","Target","Scan mode","Payment status","Report status","Created at"].map((h) => <th key={h} className="pb-3">{h}</th>)}</tr></thead><tbody>{data.intakes.map((intake) => <tr key={intake.intakeId} className="border-t border-white/10"><td className="py-4 font-mono text-xs text-zinc-300">{intake.intakeId}</td><td>{intake.email}</td><td className="font-black text-white">{intake.target}</td><td>{intake.scanMode}</td><td><StatusPill value={intake.paymentStatus} /></td><td><StatusPill value={intake.reportStatus} /></td><td>{formatDate(intake.createdAt)}</td></tr>)}</tbody></table></div>}</Panel>

          <Panel><h2 className="text-2xl font-black text-white">Payments</h2>{data.paymentIntents.length === 0 ? <EmptyState label="payment" /> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.18em] text-zinc-600"><tr>{["Payment ID","Email","Plan","Price","Method","Status","Created at"].map((h) => <th key={h} className="pb-3">{h}</th>)}</tr></thead><tbody>{data.paymentIntents.map((payment) => { const intake = data.intakes.find((item) => item.intakeId === payment.intakeId); return <tr key={payment.id} className="border-t border-white/10"><td className="py-4 font-mono text-xs text-zinc-300">{payment.id}</td><td>{intake?.email || data.currentUser.email}</td><td>{payment.planName}</td><td className="font-black text-white">{payment.price}</td><td>{payment.method}</td><td><StatusPill value={payment.paymentStatus} /></td><td>{formatDate(payment.createdAt)}</td></tr>; })}</tbody></table></div>}</Panel>

          <Panel><h2 className="text-2xl font-black text-white">Reports</h2>{data.reports.length === 0 ? <EmptyState label="report" /> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.18em] text-zinc-600"><tr>{["Report ID","Email/User ID","Target","Payment status","Report status","Created at","Ready at"].map((h) => <th key={h} className="pb-3">{h}</th>)}</tr></thead><tbody>{data.reports.map((report) => { const intake = data.intakes.find((item) => item.intakeId === report.intakeId); return <tr key={report.reportId} className="border-t border-white/10"><td className="py-4 font-mono text-xs text-zinc-300">{report.reportId}</td><td>{intake?.email || report.userId || data.currentUser.email}</td><td className="font-black text-white">{report.target || report.entity}</td><td><StatusPill value={report.paymentStatus || "unknown"} /></td><td><StatusPill value={report.reportStatus} /></td><td>{formatDate(report.createdAt)}</td><td>{formatDate(report.readyAt)}</td></tr>; })}</tbody></table></div>}</Panel>
        </div>
      </main>
    </ShadowScoreLayout>
  );
}
