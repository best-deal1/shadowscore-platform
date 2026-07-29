/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ShadowScoreLayout from "../../../components/ShadowScoreLayout";
import ExecutiveIntelligenceReport from "../../../components/report/ExecutiveIntelligenceReport";
import { getCurrentSession } from "../../../lib/auth";
import { canViewFullReport } from "../../../lib/reportAccess";
import { PAYPAL_BUSINESS_EMAIL } from "../../../lib/config";
import { REPORT_PRODUCT, getWorkspace, type PaymentIntent, type ShadowScoreReport } from "../../../lib/workspace";

type Mode = "unlock" | "processing" | "report";

function paypalUrl(intent: PaymentIntent, reportId: string) {
  const query = new URLSearchParams({ cmd: "_xclick", business: PAYPAL_BUSINESS_EMAIL, item_name: REPORT_PRODUCT.name, amount: "9.90", currency_code: "USD", invoice: intent.id, custom: reportId, rm: "2", return: `${window.location.origin}/reports/${reportId}/processing` });
  return `https://www.paypal.com/cgi-bin/webscr?${query}`;
}

export default function ReportFlow({ reportId, mode }: { reportId: string; mode: Mode }) {
  const router = useRouter();
  const [report, setReport] = useState<ShadowScoreReport>();
  const [intent, setIntent] = useState<PaymentIntent>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const session = getCurrentSession();
    if (!session) {
      router.replace(`/login?returnTo=${encodeURIComponent(`/reports/${reportId}/${mode === "report" ? "" : mode}`)}`);
      return;
    }
    try {
      const workspace = await getWorkspace(session);
      const current = workspace.reports.find((item) => item.reportId === reportId || item.paymentIntentId === reportId.replace(/^locked-/, ""));
      if (!current) throw new Error("This report was not found in your account.");
      setReport(current);
      setIntent(workspace.paymentIntents.find((item) => item.id === current.paymentIntentId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Report status could not be loaded.");
    } finally { setLoading(false); }
  }, [mode, reportId, router]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (mode !== "processing" || confirmingPayment) return;
    const transactionId = new URLSearchParams(window.location.search).get("tx");
    if (!transactionId) return;
    setConfirmingPayment(true);
    void fetch("/api/payments/paypal/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, transactionId }),
    }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Payment confirmation failed.");
      window.history.replaceState({}, "", `/reports/${reportId}/processing`);
      await load();
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Payment confirmation failed."))
      .finally(() => setConfirmingPayment(false));
  }, [confirmingPayment, load, mode, reportId]);
  useEffect(() => {
    if (mode !== "processing" || !report || report.reportStatus === "ready" || report.reportStatus === "failed") return;
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load, mode, report]);

  function pay() {
    if (!intent || submitting || intent.paymentStatus === "paid") return;
    setSubmitting(true);
    window.location.assign(paypalUrl(intent, reportId));
  }

  const paid = report?.paymentStatus === "paid";
  const ready = report ? canViewFullReport(report) : false;
  const failedPayment = report?.paymentStatus === "failed";
  const failedGeneration = paid && report?.reportStatus === "failed";
  const sourceCount = report?.reportSummary?.sourceProvenance?.length;

  return <ShadowScoreLayout><main className="mx-auto max-w-6xl px-6 py-14">
    <Link href="/intake" className="text-sm font-bold text-red-200">Back to preview</Link>
    {(loading || confirmingPayment) && <p className="mt-10 text-zinc-300">{confirmingPayment ? "Confirming payment..." : "Loading report status..."}</p>}
    {error && <section className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-6"><h1 className="text-2xl font-black">Report unavailable</h1><p className="mt-3 text-zinc-300">{error}</p><button onClick={() => void load()} className="mt-5 rounded-xl bg-white px-4 py-3 font-bold text-black">Try again</button></section>}

    {!loading && report && mode === "unlock" && <div className="mx-auto mt-8 max-w-4xl">
      <div className="mb-8 text-center"><p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-300">One-time purchase</p><h1 className="mt-3 text-4xl font-black">Unlock the full investigation</h1><p className="mt-3 text-zinc-400">Get the decision details for {report.entity}.</p></div>
      <div className="grid overflow-hidden rounded-[32px] border border-white/10 bg-white/[.035] shadow-2xl lg:grid-cols-[1fr_.72fr]">
      <section className="p-7 sm:p-9"><h2 className="text-lg font-black">Included in your report</h2><ul className="mt-5 space-y-4 text-sm text-zinc-300">{REPORT_PRODUCT.includes.map((item) => <li className="flex gap-3" key={item}><span className="text-emerald-300">✓</span>{item}</li>)}</ul><dl className="mt-8 border-t border-white/10 pt-6 text-sm"><div className="flex justify-between gap-4"><dt className="text-zinc-500">Business</dt><dd className="font-bold text-right">{report.entity}</dd></div>{sourceCount !== undefined && <div className="mt-3 flex justify-between gap-4"><dt className="text-zinc-500">Sources checked</dt><dd className="font-bold">{sourceCount}</dd></div>}</dl></section>
      <aside className="border-t border-white/10 bg-emerald-500/[.07] p-7 sm:p-9 lg:border-l lg:border-t-0"><p className="text-sm text-zinc-400">Total</p><p className="mt-1 text-5xl font-black">{REPORT_PRODUCT.price}</p><p className="mt-4 text-sm text-zinc-300">One report. No subscription.</p>{paid ? <Link href={`/reports/${reportId}/processing`} className="mt-7 block rounded-xl bg-emerald-400 px-4 py-4 text-center font-black text-black">Continue</Link> : <button onClick={pay} disabled={!intent || submitting} className="mt-7 w-full rounded-xl bg-emerald-400 px-4 py-4 font-black text-black transition hover:bg-emerald-300 disabled:opacity-50">{submitting ? "Opening checkout..." : failedPayment ? "Retry payment" : "Pay securely"}</button>}<p className="mt-4 text-center text-xs text-zinc-500">Payment processed by PayPal</p></aside>
      </div>
    </div>}

    {!loading && report && mode === "processing" && <section className="mx-auto mt-8 max-w-4xl rounded-[32px] border border-white/10 bg-white/[.035] p-7 sm:p-10"><p className={`text-sm font-bold ${paid ? "text-emerald-300" : "text-amber-200"}`}>{paid ? "Payment confirmed" : failedPayment ? "Payment failed" : "Confirming payment"}</p><h1 className="mt-3 text-4xl font-black">{ready ? "Your report is ready" : failedGeneration ? "Report generation failed" : "Building your report"}</h1><ol className="mt-9 space-y-4">{["Resolving identity", "Collecting evidence", "Analyzing risk", "Building report"].map((step, index) => { const complete = ready || (paid && index < 2); return <li key={step}><div className="flex justify-between gap-4 text-sm font-bold"><span>{step}</span><span className={complete ? "text-emerald-300" : "text-zinc-500"}>{complete ? "Complete" : "Queued"}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${complete ? "w-full bg-emerald-400" : "w-[12%] bg-zinc-700"}`} /></div></li>; })}</ol><div className="mt-8 flex flex-wrap gap-3">{ready && <Link href={`/reports/${reportId}`} className="rounded-xl bg-emerald-400 px-5 py-3 font-black text-black">Open report</Link>} {!ready && <button onClick={() => void load()} className="rounded-xl border border-white/15 px-5 py-3 font-bold">Refresh status</button>}</div></section>}

    {!loading && report && mode === "report" && (ready ? <><ExecutiveIntelligenceReport report={report} /><section className="mx-auto mt-6 max-w-7xl rounded-2xl border border-emerald-400/25 bg-emerald-500/[.07] p-6"><p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Monitoring available</p><h2 className="mt-2 text-xl font-black">Track changes to this business</h2><p className="mt-2 text-sm text-zinc-300">Create score snapshots and receive alerts when material evidence changes.</p><Link href={`/workspace/monitoring?reportId=${encodeURIComponent(reportId)}`} className="mt-4 inline-block rounded-xl bg-emerald-400 px-5 py-3 font-black text-black">Start Monitoring</Link></section></> : <section className="mt-8 rounded-3xl border border-amber-400/25 bg-amber-500/10 p-7"><h1 className="text-3xl font-black">Full report locked</h1><p className="mt-3 text-zinc-300">Payment must be confirmed and report generation must be complete.</p><Link href={paid ? `/reports/${reportId}/processing` : `/reports/${reportId}/unlock`} className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-black text-black">{paid ? "View report status" : "Unlock Full Report"}</Link></section>)}
  </main></ShadowScoreLayout>;
}
