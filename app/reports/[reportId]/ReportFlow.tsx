/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExecutiveIntelligenceReport from "../../../components/report/ExecutiveIntelligenceReport";
import InvestigationAgent from "./InvestigationAgent";
import { getCurrentSession } from "../../../lib/auth";
import { canViewFullReport } from "../../../lib/reportAccess";
import { PAYPAL_BUSINESS_EMAIL } from "../../../lib/config";
import { REPORT_PRODUCT, getWorkspace, type PaymentIntent, type ShadowScoreReport } from "../../../lib/workspace";

type Mode = "unlock" | "processing" | "report";

function paypalUrl(intent: PaymentIntent, reportId: string) {
  const query = new URLSearchParams({ cmd: "_xclick", business: PAYPAL_BUSINESS_EMAIL, item_name: REPORT_PRODUCT.name, amount: REPORT_PRODUCT.amount, currency_code: "USD", invoice: intent.id, custom: reportId, rm: "2", return: `${window.location.origin}/reports/${reportId}/processing` });
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
  const [administrator, setAdministrator] = useState(false);
  const [generatingAsAdministrator, setGeneratingAsAdministrator] = useState(false);

  const load = useCallback(async (background = false) => {
    if (!background) setLoading(true);
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
    } finally { if (!background) setLoading(false); }
  }, [mode, reportId, router]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    void fetch("/api/admin/report-access").then((response) => response.ok ? response.json() : null).then((body) => setAdministrator(body?.administrator === true)).catch(() => setAdministrator(false));
  }, []);
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
    const timer = window.setInterval(() => void load(true), 5000);
    return () => window.clearInterval(timer);
  }, [load, mode, report]);

  function pay() {
    if (!intent || submitting || intent.paymentStatus === "paid") return;
    setSubmitting(true);
    window.location.assign(paypalUrl(intent, reportId));
  }

  async function generateAsAdministrator() {
    if (!administrator || !report?.intakeId || generatingAsAdministrator) return;
    setGeneratingAsAdministrator(true);
    setError("");
    try {
      const response = await fetch("/api/admin/report-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intakeId: report.intakeId, reason: "production testing" }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Administrator report generation failed.");
      router.push(`/reports/${body.reportId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Administrator report generation failed.");
    } finally {
      setGeneratingAsAdministrator(false);
    }
  }

  const paid = report?.paymentStatus === "paid" || report?.paymentStatus === "admin_comped";
  const administratorReport = report?.accessType === "administrator" || report?.paymentStatus === "admin_comped";
  const ready = report ? canViewFullReport(report) : false;
  const failedPayment = report?.paymentStatus === "failed";
  const failedGeneration = paid && report?.reportStatus === "failed";
  const sourceCount = report?.reportSummary?.sourceProvenance?.length;

  return <div className="min-h-screen bg-black text-white"><header className="border-b border-white/10"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5"><Link href="/" aria-label="ShadowScore home" className="flex items-center gap-3"><Image src="/brand/shadowscore-infinity.svg" alt="" width={56} height={36} className="h-9 w-14 object-contain" /><span className="text-xl font-black">ShadowScore</span></Link><nav aria-label="Report navigation" className="flex flex-wrap items-center gap-4 text-sm font-bold text-zinc-300"><Link href="/investigations" className="hover:text-white">Investigations</Link><Link href="/archive" className="hover:text-white">Archive</Link><Link href="/intake" className="hover:text-white">New Investigation</Link></nav></div><nav aria-label="Breadcrumb" className="border-t border-white/[.06]"><ol className="mx-auto flex max-w-6xl gap-2 px-6 py-3 text-xs font-bold text-zinc-500"><li><Link href="/archive" className="text-zinc-300 hover:text-white">Archive</Link></li><li aria-hidden="true">/</li><li aria-current="page">{mode === "unlock" ? "Review and payment" : mode === "processing" ? "Investigation status" : "Executive Report"}</li></ol></nav></header><main className="mx-auto max-w-6xl px-6 py-10">
    {(loading || confirmingPayment) && <p className="mt-10 text-zinc-300">{confirmingPayment ? "Verifying payment record..." : "Retrieving investigation record..."}</p>}
    {error && <section className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-6"><h1 className="text-2xl font-black">Report unavailable</h1><p className="mt-3 text-zinc-300">{error}</p><button onClick={() => void load()} className="mt-5 rounded-xl bg-white px-4 py-3 font-bold text-black">Try again</button></section>}

    {!loading && report && mode === "unlock" && <div className="mx-auto mt-8 max-w-4xl">
      {administrator && <section className="mb-6 rounded-2xl border border-violet-400/35 bg-violet-500/10 p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><span className="rounded-full border border-violet-300/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-200">Admin access</span><p className="mt-3 text-sm text-zinc-300">Generate this report for production testing or internal review. Customer payment state remains unchanged.</p></div><button type="button" onClick={generateAsAdministrator} disabled={!report.intakeId || generatingAsAdministrator} className="rounded-xl bg-violet-300 px-4 py-3 font-black text-violet-950 disabled:opacity-50">{generatingAsAdministrator ? "Generating report..." : "Generate report as administrator"}</button></div></section>}
      <div className="mb-8 text-center"><p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-300">Review and confirm</p><h1 className="mt-3 text-4xl font-black">Confirm the Business</h1><p className="mt-3 text-zinc-400">One Business Investigation produces one Executive Report for a one-time price of {REPORT_PRODUCT.price}.</p></div>
      <div className="grid overflow-hidden rounded-[32px] border border-white/10 bg-white/[.035] shadow-2xl lg:grid-cols-[1fr_.72fr]">
      <section className="p-7 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">Professional investigation record</p><h2 className="mt-2 text-lg font-black">Executive Report includes</h2><ul className="mt-5 space-y-4 text-sm text-zinc-300">{REPORT_PRODUCT.includes.map((item) => <li className="flex gap-3" key={item}><span className="text-emerald-300">✓</span>{item}</li>)}</ul><dl className="mt-8 border-t border-white/10 pt-6 text-sm"><div className="flex justify-between gap-4"><dt className="text-zinc-500">Business</dt><dd className="font-bold text-right">{report.entity}</dd></div><div className="mt-3 flex justify-between gap-4"><dt className="text-zinc-500">Investigation reference</dt><dd className="font-mono">{report.intakeId || report.reportId}</dd></div><div className="mt-3 flex justify-between gap-4"><dt className="text-zinc-500">Scope</dt><dd className="font-bold">{report.scanMode || report.platform}</dd></div>{sourceCount !== undefined && <div className="mt-3 flex justify-between gap-4"><dt className="text-zinc-500">Sources checked</dt><dd className="font-bold">{sourceCount}</dd></div>}</dl><Link href="/intake?resume=checkout" className="mt-5 inline-block text-sm font-bold underline">Correct Business or scope</Link></section>
      <aside className="border-t border-white/10 bg-emerald-500/[.07] p-7 sm:p-9 lg:border-l lg:border-t-0"><p className="text-sm text-zinc-400">Total</p><p className="mt-1 text-5xl font-black">{REPORT_PRODUCT.price}</p><ul className="mt-4 space-y-2 text-sm text-zinc-300" aria-label="Purchase confidence"><li>✓ One-time payment</li><li>✓ No subscription</li><li>✓ Executive Report available immediately</li><li>✓ Evidence preserved for download</li></ul>{paid ? <Link href={`/reports/${reportId}/processing`} className="mt-7 block rounded-xl bg-emerald-400 px-4 py-4 text-center font-black text-black">Continue</Link> : <button onClick={pay} disabled={!intent || submitting} className="mt-7 w-full rounded-xl bg-emerald-400 px-4 py-4 font-black text-black transition hover:bg-emerald-300 disabled:opacity-50">{submitting ? "Opening secure payment..." : failedPayment ? "Retry payment" : "Pay with PayPal"}</button>}<p className="mt-4 text-center text-xs text-zinc-500">Payment processed by the selected provider. Secure checkout by PayPal.</p></aside>
      </div>
    </div>}

    {!loading && report && mode === "processing" && <div className="mx-auto mt-8 max-w-4xl">
      {paid && !failedGeneration ? <><section className="mb-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5"><p className="font-bold text-emerald-200">Payment confirmed</p><p className="mt-2 text-sm text-zinc-300">Your Investigation continues securely. You can safely close this page. Check its status from Investigations or the Archive.</p></section><InvestigationAgent business={report.entity} startedAt={report.createdAt} ready={ready} onComplete={() => router.replace(`/reports/${reportId}`)} /></> : <section className="rounded-[32px] border border-white/10 bg-white/[.035] p-7 sm:p-10"><p className={`text-sm font-bold ${failedPayment ? "text-red-300" : "text-amber-200"}`}>{failedPayment ? "Payment failed" : "Payment verification in progress"}</p><h1 className="mt-3 text-4xl font-black">{failedGeneration ? "Investigation record unavailable" : "Investigation queued"}</h1><p className="mt-4 text-zinc-300">{failedGeneration ? "The investigation needs support before it can continue." : "The investigation will begin after payment confirmation."}</p>{failedGeneration && <p className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-5">Open <Link className="font-bold underline" href="/contact">Support</Link> and include the investigation reference.</p>}<div className="mt-8 flex flex-wrap gap-3"><Link href={failedPayment ? `/reports/${reportId}/unlock` : "/investigations"} className="rounded-xl border border-white/15 px-5 py-3 font-bold">{failedPayment ? "Retry payment" : "Go to Investigations"}</Link></div></section>}
    </div>}

    {!loading && report && mode === "report" && (ready ? <>{administratorReport && <section className="mb-5 rounded-2xl border border-violet-400/35 bg-violet-500/10 p-5"><span className="rounded-full border border-violet-300/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-200">Admin access</span><p className="mt-3 font-bold text-violet-100">{report.administratorNotice || "Administrator test report - no customer payment was processed."}</p></section>}<ExecutiveIntelligenceReport report={report} /></> : <section className="mt-8 rounded-3xl border border-amber-400/25 bg-amber-500/10 p-7"><h1 className="text-3xl font-black">Executive Report unavailable</h1><p className="mt-3 text-zinc-300">{paid ? "The Investigation is still in progress. Check its current status." : "Payment is required to commission the investigation and access its Executive Report."}</p><Link href={paid ? `/reports/${reportId}/processing` : `/reports/${reportId}/unlock`} className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-black text-black">{paid ? "View Investigation status" : "Review and pay"}</Link></section>)}
  </main><footer className="mx-auto flex max-w-6xl flex-wrap justify-center gap-4 border-t border-white/10 px-6 py-6 text-xs text-zinc-500"><Link href="/terms" className="hover:text-white">Terms</Link><Link href="/contact" className="hover:text-white">Support</Link></footer></div>;
}
