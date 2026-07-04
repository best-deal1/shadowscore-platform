"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { getCurrentSession, getCurrentUser } from "../../lib/auth";
import { getWorkspace, PaymentIntent, ShadowScoreIntake, ShadowScoreReport, workspaceModeLabel } from "../../lib/workspace";

function formatDate(value?: string) {
  if (!value) return "Pending";
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <details className="rounded-2xl border border-white/10 bg-black/55 p-4">
      <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.24em] text-red-300">{title}</summary>
      <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-6 text-zinc-400">{JSON.stringify(value ?? null, null, 2)}</pre>
    </details>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [reports, setReports] = useState<ShadowScoreReport[]>([]);
  const [intakes, setIntakes] = useState<ShadowScoreIntake[]>([]);
  const [paymentIntents, setPaymentIntents] = useState<PaymentIntent[]>([]);

  useEffect(() => {
    const session = getCurrentSession();
    if (!getCurrentUser() || !session) {
      router.push("/login");
      return;
    }

    getWorkspace(session)
      .then((workspace) => {
        setReports(workspace.reports);
        setIntakes(workspace.intakes);
        setPaymentIntents(workspace.paymentIntents);
      })
      .finally(() => setLoaded(true));
  }, [router]);

  const readyReports = useMemo(() => reports.filter((report) => report.reportStatus === "ready"), [reports]);

  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.34em] text-red-300">Admin inspection</div>
            <h1 className="mt-4 text-5xl font-black tracking-tight">Ready Report Review</h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-400">
              Admin review is for inspection and testing only. These actions read existing report, provider, intake and payment records; they do not mark reports paid, ready, unlocked or downloaded.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-6 text-zinc-500">
            Data mode: <span className="font-black text-zinc-200">{workspaceModeLabel()}</span><br />
            Ready reports: <span className="font-black text-zinc-200">{readyReports.length}</span>
          </div>
        </div>

        {!loaded && <div className="mt-10 rounded-3xl border border-white/10 bg-black/55 p-6 text-zinc-400">Loading admin report records...</div>}

        {loaded && readyReports.length === 0 && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-black/55 p-6">
            <div className="text-xl font-black text-white">No ready reports found</div>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Only reportStatus == ready records appear in the admin review queue.</p>
          </div>
        )}

        <div className="mt-10 space-y-6">
          {readyReports.map((report) => {
            const paymentIntent = paymentIntents.find((intent) => intent.id === report.paymentIntentId || intent.intakeId === report.intakeId);
            const intake = intakes.find((item) => item.intakeId === report.intakeId);
            const customerCanOpen = report.paymentStatus === "paid" && report.reportStatus === "ready";

            return (
              <article key={report.reportId} className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-600">{report.reportId}</div>
                    <h2 className="mt-2 text-3xl font-black text-white">{report.title}</h2>
                    <p className="mt-2 text-sm text-zinc-500">{report.entity} • {report.platform} • {formatDate(report.readyAt || report.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-black">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">Payment: {report.paymentStatus || "unknown"}</span>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">Report: {report.reportStatus}</span>
                    <span className={`rounded-full border px-3 py-1 ${customerCanOpen ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-yellow-400/30 bg-yellow-500/10 text-yellow-100"}`}>Customer entitlement: {customerCanOpen ? "unlocked" : "locked"}</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  {[
                    ["Risk", report.riskScore ?? "Pending"],
                    ["Confidence", report.confidenceScore ? `${report.confidenceScore}%` : "Pending"],
                    ["Stage", report.stage],
                    ["Source", report.source],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-black/45 p-4">
                      <div className="text-xs uppercase tracking-[0.22em] text-zinc-600">{label}</div>
                      <div className="mt-2 break-words text-lg font-black text-white">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/report?reportId=${encodeURIComponent(report.reportId)}&admin=1`} className="rounded-2xl bg-red-600 px-4 py-3 text-xs font-black text-white hover:bg-red-500">View Report</Link>
                  <Link href={`/report?reportId=${encodeURIComponent(report.reportId)}`} className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-black text-zinc-200 hover:border-red-400/30">Open Customer Report Page</Link>
                  <a href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report, null, 2))}`} download={`${report.reportId}.json`} className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-black text-zinc-200 hover:border-red-400/30">View Report JSON</a>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <JsonPanel title="View Provider Results" value={report.providerResults || []} />
                  <JsonPanel title="View Evidence Summary" value={report.evidenceSummary || {}} />
                  <JsonPanel title="View Payment Intent" value={paymentIntent || { paymentIntentId: report.paymentIntentId, status: "not found in workspace" }} />
                  <JsonPanel title="View Intake Source" value={intake || { intakeId: report.intakeId, status: "not found in workspace" }} />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
