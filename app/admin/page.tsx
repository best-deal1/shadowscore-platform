"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { getAdminConsoleData, isAdminAllowed, type AdminConsoleData } from "../../lib/admin";
import { restoreCurrentSession } from "../../lib/auth";
import type { PaymentStatus, ReportStatus } from "../../lib/workspace";

function formatDate(value?: string) {
  if (!value || value === "Unavailable" || value === "No activity") return value || "—";
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
  const tone = value === "ready" || value === "paid" || value === "completed" || value === "healthy" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : value === "failed" ? "border-red-400/30 bg-red-500/10 text-red-100" : "border-yellow-400/30 bg-yellow-500/10 text-yellow-100";
  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${tone}`}>{value || "unknown"}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/45 p-4 text-sm text-zinc-500">No {label} records available in the current workspace.</div>;
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminConsoleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedJson, setSelectedJson] = useState<unknown>(null);

  useEffect(() => {
    restoreCurrentSession()
      .then((session) => {
        if (!session) {
          router.push("/login");
          return;
        }
        if (!isAdminAllowed(session.email)) {
          setError("This signed-in account is not on the admin allowlist.");
          return;
        }
        return getAdminConsoleData().then(setData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load admin console."));
  }, [router]);

  const overview = useMemo(() => {
    if (!data) return [];
    return [
      ["Total Users", data.users.length.toString()],
      ["Total Intakes", data.intakes.length.toString()],
      ["Total Payments", data.paymentIntents.length.toString()],
      ["Total Reports", data.reports.length.toString()],
      ["Reports Ready", data.reports.filter((report) => report.reportStatus === "ready").length.toString()],
      ["Reports Pending", data.reports.filter((report) => report.reportStatus === "payment_pending" || report.reportStatus === "generating" || report.reportStatus === "preview").length.toString()],
      ["Reports Failed", data.reports.filter((report) => report.reportStatus === "failed").length.toString()],
      ["Workspace Mode", data.systemStatus.workspaceMode],
    ];
  }, [data]);

  if (error) {
    return (
      <ShadowScoreLayout>
        <main className="mx-auto max-w-3xl px-6 py-20">
          <Panel>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Admin Console Protected</div>
            <h1 className="mt-3 text-4xl font-black text-white">Access denied</h1>
            <p className="mt-4 text-zinc-400">{error}</p>
            <Link href="/dashboard" className="mt-6 inline-flex rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-zinc-200">Return to dashboard</Link>
          </Panel>
        </main>
      </ShadowScoreLayout>
    );
  }

  if (!data) {
    return <ShadowScoreLayout><main className="mx-auto max-w-4xl px-6 py-20 text-zinc-400">Loading read-only admin console...</main></ShadowScoreLayout>;
  }

  return (
    <ShadowScoreLayout>
      <main className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-red-300">Production Preview • Read Only</div>
            <h1 className="mt-4 text-5xl font-black tracking-tight text-white">Admin Console</h1>
            <p className="mt-4 max-w-3xl text-zinc-400">Operational visibility for users, intakes, payments, reports, provider results, evidence, and system health. This console does not modify customer data automatically.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/45 p-4 text-sm text-zinc-400">Admin: <span className="font-black text-white">{data.currentUser.email}</span></div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {overview.map(([label, value]) => <Panel key={label}><div className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-600">{label}</div><div className="mt-3 text-3xl font-black text-white">{value}</div></Panel>)}
        </div>

        <div className="mt-10 grid gap-8">
          <Panel><h2 className="text-2xl font-black">Users</h2><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.18em] text-zinc-600"><tr>{["User","Email","Created","Reports","Payments","Last Activity"].map(h=><th key={h} className="pb-3">{h}</th>)}</tr></thead><tbody>{data.users.map(user=><tr key={user.id} className="border-t border-white/10"><td className="py-4 font-black text-white">{user.name}<div className="text-xs font-normal text-zinc-600">{user.id}</div></td><td className="text-zinc-300">{user.email}</td><td className="text-zinc-400">{formatDate(user.createdAt)}</td><td>{user.reports}</td><td>{user.payments}</td><td className="text-zinc-400">{formatDate(user.lastActivity)}</td></tr>)}</tbody></table></div></Panel>

          <Panel><h2 className="text-2xl font-black">Intakes</h2>{data.intakes.length === 0 ? <div className="mt-5"><EmptyState label="intake" /></div> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.18em] text-zinc-600"><tr>{["Intake ID","User","Target","Scan Mode","Created","Status","Open Intake"].map(h=><th key={h} className="pb-3">{h}</th>)}</tr></thead><tbody>{data.intakes.map(intake=><tr key={intake.intakeId} className="border-t border-white/10"><td className="py-4 font-mono text-xs text-zinc-300">{intake.intakeId}</td><td>{intake.email}<div className="text-xs text-zinc-600">{intake.userId}</div></td><td className="font-black text-white">{intake.target}</td><td>{intake.scanMode}</td><td>{formatDate(intake.createdAt)}</td><td><StatusPill value={intake.reportStatus} /></td><td><Link className="text-red-300 hover:text-red-100" href={`/intake?intakeId=${encodeURIComponent(intake.intakeId)}`}>Open Intake</Link></td></tr>)}</tbody></table></div>}</Panel>

          <Panel><h2 className="text-2xl font-black">Payment Intents</h2>{data.paymentIntents.length === 0 ? <div className="mt-5"><EmptyState label="payment intent" /></div> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.18em] text-zinc-600"><tr>{["Payment ID","User","Amount","Status","Provider","Created","Open Payment"].map(h=><th key={h} className="pb-3">{h}</th>)}</tr></thead><tbody>{data.paymentIntents.map(payment=><tr key={payment.id} className="border-t border-white/10"><td className="py-4 font-mono text-xs text-zinc-300">{payment.id}</td><td>{data.currentUser.email}</td><td className="font-black text-white">{payment.price}</td><td><StatusPill value={payment.paymentStatus} /></td><td>{payment.method}</td><td>{formatDate(payment.createdAt)}</td><td><button onClick={() => setSelectedJson(payment)} className="text-red-300 hover:text-red-100">Open Payment</button></td></tr>)}</tbody></table></div>}</Panel>

          <Panel><h2 className="text-2xl font-black">Reports</h2>{data.reports.length === 0 ? <div className="mt-5"><EmptyState label="report" /></div> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.18em] text-zinc-600"><tr>{["Report ID","Target","User","Payment Status","Report Status","Created","Ready","Actions"].map(h=><th key={h} className="pb-3">{h}</th>)}</tr></thead><tbody>{data.reports.map(report=><tr key={report.reportId} className="border-t border-white/10"><td className="py-4 font-mono text-xs text-zinc-300">{report.reportId}</td><td className="font-black text-white">{report.target || report.entity}</td><td>{report.userId || data.currentUser.id}</td><td><StatusPill value={report.paymentStatus || "unknown"} /></td><td><StatusPill value={report.reportStatus} /></td><td>{formatDate(report.createdAt)}</td><td>{formatDate(report.readyAt)}</td><td className="space-x-3"><Link href={`/report?reportId=${encodeURIComponent(report.reportId)}`} className="text-red-300">Open Report</Link><button onClick={() => setSelectedJson(report)} className="text-red-300">View JSON</button><button onClick={() => setSelectedJson(report.providerResults || [])} className="text-red-300">View Provider Results</button><button onClick={() => setSelectedJson(report.evidenceSummary || {})} className="text-red-300">View Evidence</button></td></tr>)}</tbody></table></div>}</Panel>

          <Panel><h2 className="text-2xl font-black">Provider Results</h2>{data.providerResults.length === 0 ? <div className="mt-5"><EmptyState label="provider result" /></div> : <div className="mt-5 grid gap-4 md:grid-cols-2">{data.providerResults.map((result, index)=><div key={`${result.reportId}-${result.providerId}-${index}`} className="rounded-2xl border border-white/10 bg-black/45 p-4"><div className="flex items-center justify-between gap-3"><div className="font-black text-white">{result.providerId}</div><StatusPill value={result.status} /></div><div className="mt-2 text-xs text-zinc-500">Report {result.reportId} • v{result.providerVersion} • {result.duration}ms</div><div className="mt-3 text-sm text-zinc-400">Findings: {result.findings.length} • Evidence: {result.evidence.length} • Errors: {result.errors.length}</div><button onClick={() => setSelectedJson(result)} className="mt-3 text-sm font-black text-red-300">View JSON</button></div>)}</div>}</Panel>

          <Panel><h2 className="text-2xl font-black">Evidence</h2>{data.evidence.length === 0 ? <div className="mt-5"><EmptyState label="evidence" /></div> : <div className="mt-5 grid gap-4 md:grid-cols-2">{data.evidence.map(item=><div key={item.reportId} className="rounded-2xl border border-white/10 bg-black/45 p-4"><div className="font-black text-white">{item.target}</div><div className="mt-1 text-xs text-zinc-500">{item.reportId} • Provider evidence items: {item.providerEvidenceCount}</div><button onClick={() => setSelectedJson(item)} className="mt-3 text-sm font-black text-red-300">View Evidence JSON</button></div>)}</div>}</Panel>

          <Panel><h2 className="text-2xl font-black">System Status</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{[["Current Provider Framework Version",data.systemStatus.providerFrameworkVersion],["Risk Engine Version",data.systemStatus.riskEngineVersion],["Workspace Mode",data.systemStatus.workspaceMode],["Supabase Connected",data.systemStatus.supabaseConnected ? "yes" : "no"],["Payment Provider Status",data.systemStatus.paymentProviderStatus],["Report Engine Version",data.systemStatus.reportEngineVersion]].map(([label,value])=><div key={label} className="rounded-2xl border border-white/10 bg-black/45 p-4"><div className="text-xs uppercase tracking-[0.2em] text-zinc-600">{label}</div><div className="mt-2 font-black text-white">{value}</div></div>)}</div><div className="mt-6"><div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-600">Registered Providers</div><div className="mt-3 flex flex-wrap gap-2">{data.systemStatus.registeredProviders.map(provider=><span key={provider.id} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">{provider.name} v{provider.version}</span>)}</div></div>{process.env.NODE_ENV === "development" && <div className="mt-6 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-sm text-yellow-100"><div className="font-black">Testing Controls</div><p className="mt-1 text-yellow-100/75">Development-only controls are visible here. No destructive controls are enabled in the production preview.</p></div>}</Panel>
        </div>

        {selectedJson !== null && <div className="fixed inset-0 z-50 overflow-auto bg-black/80 p-6"><div className="mx-auto max-w-5xl rounded-[28px] border border-white/10 bg-zinc-950 p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-black text-white">Read-only JSON</h2><button onClick={() => setSelectedJson(null)} className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white">Close</button></div><pre className="mt-5 max-h-[70vh] overflow-auto rounded-2xl border border-white/10 bg-black p-4 text-xs leading-5 text-zinc-300">{JSON.stringify(selectedJson, null, 2)}</pre></div></div>}
      </main>
    </ShadowScoreLayout>
  );
}
