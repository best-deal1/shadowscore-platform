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
  const query = new URLSearchParams({ cmd: "_xclick", business: PAYPAL_BUSINESS_EMAIL, item_name: REPORT_PRODUCT.name, amount: "9.90", currency_code: "USD", invoice: intent.id, custom: reportId, return: `${window.location.origin}/reports/${reportId}/processing` });
  return `https://www.paypal.com/cgi-bin/webscr?${query}`;
}

export default function ReportFlow({ reportId, mode }: { reportId: string; mode: Mode }) {
  const router = useRouter();
  const [report, setReport] = useState<ShadowScoreReport>();
  const [intent, setIntent] = useState<PaymentIntent>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    {loading && <p className="mt-10 text-zinc-300">Loading report status...</p>}
    {error && <section className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-6"><h1 className="text-2xl font-black">Report unavailable</h1><p className="mt-3 text-zinc-300">{error}</p><button onClick={() => void load()} className="mt-5 rounded-xl bg-white px-4 py-3 font-bold text-black">Try again</button></section>}

    {!loading && report && mode === "unlock" && <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.75fr]">
      <section className="rounded-3xl border border-white/10 bg-white/[.035] p-7"><p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-300">Purchase summary</p><h1 className="mt-3 text-3xl font-black">{REPORT_PRODUCT.name}</h1><dl className="mt-6 space-y-3 text-sm"><div><dt className="text-zinc-500">Investigated entity</dt><dd className="font-bold">{report.entity}</dd></div><div><dt className="text-zinc-500">Investigation type</dt><dd className="font-bold">{report.scanMode || report.platform}</dd></div>{sourceCount !== undefined && <div><dt className="text-zinc-500">Sources checked</dt><dd className="font-bold">{sourceCount}</dd></div>}</dl><h2 className="mt-7 font-black">The full report includes</h2><ul className="mt-3 space-y-2 text-sm text-zinc-300">{REPORT_PRODUCT.includes.map((item) => <li key={item}>✓ {item}</li>)}</ul></section>
      <aside className="rounded-3xl border border-emerald-400/25 bg-emerald-500/[.07] p-7"><p className="text-sm text-zinc-400">Final price</p><p className="mt-1 text-4xl font-black">{REPORT_PRODUCT.price}</p><p className="mt-5 text-sm text-zinc-300">{REPORT_PRODUCT.estimatedGenerationTime}. The report will be saved to your account.</p><p className="mt-5 text-xs leading-5 text-zinc-400">By continuing, you confirm that you accept the Terms of Service and Privacy Policy. The report is an analytical assessment based on available evidence.</p>{paid ? <Link href={`/reports/${reportId}/processing`} className="mt-6 block rounded-xl bg-emerald-400 px-4 py-4 text-center font-black text-black">Continue to report status</Link> : <button onClick={pay} disabled={!intent || submitting} className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-4 font-black text-black disabled:opacity-50">{submitting ? "Processing payment..." : failedPayment ? "Retry payment" : "Pay and Generate Report"}</button>}</aside>
    </div>}

    {!loading && report && mode === "processing" && <section className="mt-8 rounded-3xl border border-white/10 bg-white/[.035] p-7"><p className={`text-sm font-bold ${paid ? "text-emerald-300" : "text-amber-200"}`}>{paid ? "Payment confirmed" : failedPayment ? "Payment failed" : "Payment processing"}</p><h1 className="mt-3 text-4xl font-black">{ready ? "Your report is ready" : failedGeneration ? "Report generation failed" : paid ? "Your report is being generated" : "Waiting for payment confirmation"}</h1><p className="mt-4 text-zinc-300">{failedGeneration ? "Your payment is confirmed. Retry generation or contact support. You will not be charged again." : "Status is loaded from your account and remains available after a refresh or browser restart."}</p><ol className="mt-8 grid gap-3 sm:grid-cols-5">{["Payment confirmed", "Entity verified", "Evidence collection", "Report generation", "Report ready"].map((step, index) => <li key={step} className={`rounded-xl border p-3 text-xs ${ready || (paid && index < 1) ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 text-zinc-500"}`}>{step}</li>)}</ol><div className="mt-7 flex flex-wrap gap-3">{ready && <Link href={`/reports/${reportId}`} className="rounded-xl bg-emerald-400 px-5 py-3 font-black text-black">View Full Report</Link>} {!ready && <button onClick={() => void load()} className="rounded-xl border border-white/15 px-5 py-3 font-bold">Refresh status</button>}<a href="mailto:support@shadowscore.com" className="rounded-xl border border-white/15 px-5 py-3 font-bold">Contact support</a></div></section>}

    {!loading && report && mode === "report" && (ready ? <ExecutiveIntelligenceReport report={report} /> : <section className="mt-8 rounded-3xl border border-amber-400/25 bg-amber-500/10 p-7"><h1 className="text-3xl font-black">Full report locked</h1><p className="mt-3 text-zinc-300">Payment must be confirmed and report generation must be complete.</p><Link href={paid ? `/reports/${reportId}/processing` : `/reports/${reportId}/unlock`} className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-black text-black">{paid ? "View report status" : "Unlock Full Report"}</Link></section>)}
  </main></ShadowScoreLayout>;
}
