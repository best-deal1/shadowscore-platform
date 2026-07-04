"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { ShadowScoreReport, getWorkspace, markPaymentPaidAndGenerateReport, workspaceModeLabel } from "../../lib/workspace";
import { getCurrentSession, getCurrentUser } from "../../lib/auth";
import { isSupabaseConfigured } from "../../lib/supabase";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[30px] border border-white/10 bg-white/[0.035] p-6 ${className}`}>{children}</div>;
}

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [reports, setReports] = useState<ShadowScoreReport[]>([]);
  const [actionMessage, setActionMessage] = useState("");
  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentSession = getCurrentSession();
    if (!currentUser || !currentSession) {
      router.push("/login");
      return;
    }
    getWorkspace(currentSession)
      .then((workspace) => setReports(workspace.reports))
      .finally(() => setAuthChecked(true));
  }, [router]);

  async function simulatePaid(paymentIntentId: string) {
    if (supabaseConfigured) return;
    const currentSession = getCurrentSession();
    if (!currentSession) return;
    await markPaymentPaidAndGenerateReport(currentSession, paymentIntentId);
    const workspace = await getWorkspace(currentSession);
    setReports(workspace.reports);
    setActionMessage("Development payment webhook simulation completed.");
  }

  const pendingReports = useMemo(() => reports.filter((report) => report.reportStatus !== "ready" && report.paymentIntentId), [reports]);

  if (!authChecked) {
    return (
      <ShadowScoreLayout>
        <section className="mx-auto max-w-3xl px-6 py-20 text-zinc-400">Loading admin console...</section>
      </ShadowScoreLayout>
    );
  }

  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-[32px] border border-yellow-400/30 bg-yellow-500/10 p-6 text-yellow-100">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-yellow-200">Development / Preview Admin Console</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">Admin Test Controls</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-yellow-100/80">
            These controls are for local development and preview verification only. They are intentionally isolated from the customer dashboard and must not be presented as customer-facing workflow actions.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <Panel>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Environment Warning</div>
            <h2 className="mt-2 text-3xl font-black">{workspaceModeLabel()}</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-500">
              Supabase-backed environments use provider data as the source of truth, so destructive or synthetic test controls are disabled when Supabase configuration is present.
            </p>
            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-black ${supabaseConfigured ? "border-red-400/30 bg-red-500/10 text-red-100" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"}`}>
              Admin test controls: {supabaseConfigured ? "Disabled for Supabase" : "Enabled for development memory workspace"}
            </div>
            {actionMessage && <p className="mt-4 text-sm font-bold text-emerald-200">{actionMessage}</p>}
          </Panel>

          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.26em] text-yellow-300">Payment Test Controls</div>
                <h2 className="mt-2 text-3xl font-black">Pending Report Lifecycle</h2>
              </div>
              <Link href="/dashboard" className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-zinc-300 hover:border-red-400/30 hover:text-white">Customer Dashboard</Link>
            </div>

            <div className="mt-6 space-y-3">
              {pendingReports.length === 0 && <div className="rounded-2xl border border-white/10 bg-black/50 p-4 text-sm text-zinc-500">No pending reports with payment intents are available for test controls.</div>}
              {pendingReports.map((report) => (
                <div key={report.reportId} className="rounded-2xl border border-white/10 bg-black/50 p-4">
                  <div className="font-black text-white">{report.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">{report.entity} • {formatDate(report.createdAt)}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">Payment: {report.paymentStatus || "payment_pending"}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">Report: {report.reportStatus}</span>
                  </div>
                  <button
                    onClick={() => simulatePaid(report.paymentIntentId!)}
                    disabled={supabaseConfigured}
                    className="mt-4 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-xs font-black text-yellow-100 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-zinc-600"
                  >
                    Dev webhook: mark paid and generate
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
