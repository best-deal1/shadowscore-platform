"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { isAdminEmail } from "../../lib/admin";
import { getCurrentSession } from "../../lib/auth";
import {
  PaymentIntent,
  ShadowScoreIntake,
  ShadowScoreReport,
  WorkspaceData,
  getWorkspace,
  markPaymentFailed,
  markPaymentPaidAndGenerateReport,
  workspaceModeLabel,
} from "../../lib/workspace";

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[30px] border border-white/10 bg-white/[0.035] p-6 ${className}`}>{children}</div>;
}

function formatDate(value?: string) {
  if (!value) return "Pending";
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

function JsonBlock({ value }: { value: unknown }) {
  return <pre className="mt-3 max-h-80 overflow-auto rounded-2xl border border-white/10 bg-black/60 p-4 text-xs leading-6 text-zinc-400">{JSON.stringify(value, null, 2)}</pre>;
}

export default function AdminPage() {
  const [session] = useState<ReturnType<typeof getCurrentSession>>(() => getCurrentSession());
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ShadowScoreReport | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<PaymentIntent | null>(null);
  const [selectedIntake, setSelectedIntake] = useState<ShadowScoreIntake | null>(null);
  const [message, setMessage] = useState("");

  const isAdmin = isAdminEmail(session?.email);

  async function refresh(current = session) {
    if (!current) return;
    const data = await getWorkspace(current);
    setWorkspace(data);
    setSelectedIntent((intent) => data.paymentIntents.find((item) => item.id === intent?.id) || intent);
    setSelectedReport((report) => data.reports.find((item) => item.reportId === report?.reportId) || report);
    setSelectedIntake((intake) => data.intakes.find((item) => item.intakeId === intake?.intakeId) || intake);
  }

  useEffect(() => {
    const current = session;
    if (!current) {
      Promise.resolve().then(() => setLoaded(true));
      return;
    }
    if (!isAdminEmail(current.email)) {
      Promise.resolve().then(() => setLoaded(true));
      return;
    }
    getWorkspace(current).then(setWorkspace).finally(() => setLoaded(true));
  }, [session]);

  const reports = useMemo(() => workspace?.reports || [], [workspace]);
  const intakes = useMemo(() => workspace?.intakes || [], [workspace]);
  const paymentIntents = useMemo(() => workspace?.paymentIntents || [], [workspace]);
  const readyReports = useMemo(() => reports.filter((report) => report.paymentStatus === "paid" && report.reportStatus === "ready"), [reports]);

  async function markPaid(paymentIntentId: string) {
    if (!session || !isAdmin) return;
    await markPaymentPaidAndGenerateReport(session, paymentIntentId);
    setMessage(`Marked ${paymentIntentId} paid and generated the report in this workspace only.`);
    await refresh(session);
  }

  async function markFailed(paymentIntentId: string) {
    if (!session || !isAdmin) return;
    await markPaymentFailed(session, paymentIntentId);
    setMessage(`Marked ${paymentIntentId} failed in this workspace only.`);
    await refresh(session);
  }

  async function generateReport(paymentIntentId: string) {
    if (!session || !isAdmin) return;
    await markPaymentPaidAndGenerateReport(session, paymentIntentId);
    setMessage(`Generated report for ${paymentIntentId}; customer unlock still requires paymentStatus == paid && reportStatus == ready.`);
    await refresh(session);
  }

  if (!loaded) {
    return <ShadowScoreLayout><section className="mx-auto max-w-4xl px-6 py-20 text-zinc-400">Loading admin console...</section></ShadowScoreLayout>;
  }

  if (!session || !isAdmin) {
    return (
      <ShadowScoreLayout>
        <section className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-[30px] border border-red-400/20 bg-red-500/10 p-8">
            <div className="text-xs font-black uppercase tracking-[0.32em] text-red-200">Access Denied</div>
            <h1 className="mt-4 text-4xl font-black text-white">Admin access is restricted</h1>
            <p className="mt-4 leading-7 text-zinc-300">Only emails listed in NEXT_PUBLIC_ADMIN_EMAILS can access /admin. A signed-in customer session is not sufficient.</p>
            <Link href="/dashboard" className="mt-6 inline-block rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-zinc-200">Back to dashboard</Link>
          </div>
        </section>
      </ShadowScoreLayout>
    );
  }

  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-xs font-black uppercase tracking-[0.36em] text-red-300">V23 Admin Console</div>
        <h1 className="mt-4 text-5xl font-black">Current Workspace Admin Preview</h1>
        <p className="mt-5 max-w-4xl leading-8 text-zinc-400">This console is scoped to the currently signed-in workspace ({workspaceModeLabel()}). It is not a secure all-customer admin API and does not claim to show all customer reports.</p>
        {message && <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">{message}</div>}

        <div className="mt-10 grid gap-4 md:grid-cols-5">
          {[["Overview", `${reports.length} reports`], ["Intakes", `${intakes.length} records`], ["Payment Intents", `${paymentIntents.length} intents`], ["Reports", `${readyReports.length} unlocked`], ["Test Controls", "Admin only"]].map(([label, value]) => (
            <Panel key={label}><div className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-600">{label}</div><div className="mt-3 text-2xl font-black text-white">{value}</div></Panel>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <Panel>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Intakes</div>
            <div className="mt-5 space-y-3">{intakes.length === 0 && <p className="text-sm text-zinc-500">No intake records in this workspace.</p>}{intakes.map((intake) => <div key={intake.intakeId} className="rounded-2xl border border-white/10 bg-black/50 p-4"><div className="font-black text-white">{intake.target}</div><div className="mt-1 text-xs text-zinc-500">{intake.intakeId} • {intake.platform} • {formatDate(intake.createdAt)}</div><button onClick={() => setSelectedIntake(intake)} className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-zinc-200">View Intake Source</button></div>)}</div>
          </Panel>

          <Panel>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-yellow-300">Payment Intents</div>
            <div className="mt-5 space-y-3">{paymentIntents.length === 0 && <p className="text-sm text-zinc-500">No payment intents in this workspace.</p>}{paymentIntents.map((intent) => <div key={intent.id} className="rounded-2xl border border-white/10 bg-black/50 p-4"><div className="font-black text-white">{intent.planName} · {intent.price}</div><div className="mt-1 text-xs text-zinc-500">{intent.id} • {intent.paymentStatus} • {formatDate(intent.createdAt)}</div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => markPaid(intent.id)} className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-100">Mark Payment as Paid</button><button onClick={() => markFailed(intent.id)} className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-100">Mark Payment as Failed</button><button onClick={() => generateReport(intent.id)} className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-3 py-2 text-xs font-black text-yellow-100">Generate Report</button><button onClick={() => setSelectedIntent(intent)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-zinc-200">View Payment Intent</button></div></div>)}</div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Reports</div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">{reports.length === 0 && <p className="text-sm text-zinc-500">No reports in this workspace.</p>}{reports.map((report) => <div key={report.reportId} className="rounded-2xl border border-white/10 bg-black/50 p-4"><div className="font-black text-white">{report.title}</div><div className="mt-1 text-xs text-zinc-500">{report.reportId} • paymentStatus={report.paymentStatus || "unknown"} • reportStatus={report.reportStatus}</div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setSelectedReport(report)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-zinc-200">View Report JSON</button><button onClick={() => setSelectedReport(report)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-zinc-200">View Provider Results</button><button onClick={() => setSelectedReport(report)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-zinc-200">View Evidence Summary</button><Link href={`/report?reportId=${encodeURIComponent(report.reportId)}&admin=1`} className="rounded-xl border border-red-400/30 px-3 py-2 text-xs font-black text-red-100">Open Admin Inspection</Link></div></div>)}</div>
        </Panel>

        {(selectedReport || selectedIntent || selectedIntake) && <Panel className="mt-8"><div className="text-xs font-black uppercase tracking-[0.26em] text-zinc-500">Inspection Output</div>{selectedReport && <><h3 className="mt-4 text-xl font-black">Report JSON / Provider Results / Evidence Summary</h3><JsonBlock value={{ report: selectedReport, providerResults: selectedReport.providerResults || [], evidenceSummary: selectedReport.evidenceSummary || {} }} /></>}{selectedIntent && <><h3 className="mt-4 text-xl font-black">Payment Intent</h3><JsonBlock value={selectedIntent} /></>}{selectedIntake && <><h3 className="mt-4 text-xl font-black">Intake Source</h3><JsonBlock value={selectedIntake} /></>}</Panel>}
      </section>
    </ShadowScoreLayout>
  );
}
