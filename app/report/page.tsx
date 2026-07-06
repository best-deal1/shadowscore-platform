"use client";

import { useMemo } from "react";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { getCurrentSession } from "../../lib/auth";
import { buildTrustTimeline } from "../../lib/trustTimeline";
import { getWorkspace, ShadowScoreReport } from "../../lib/workspace";
import { useEffect, useState } from "react";

function formatDate(value?: string) {
  if (!value) return "Pending";
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function ReportPage() {
  const [reportId, setReportId] = useState("");
  const [reports, setReports] = useState<ShadowScoreReport[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setReportId(new URLSearchParams(window.location.search).get("reportId") || "");
    const session = getCurrentSession();
    if (!session) {
      setLoaded(true);
      return;
    }
    getWorkspace(session).then((workspace) => setReports(workspace.reports)).finally(() => setLoaded(true));
  }, []);

  const report = useMemo(() => reports.find((item) => item.reportId === reportId), [reports, reportId]);
  const isReady = report?.reportStatus === "ready";
  const trustTimeline = useMemo(() => report ? buildTrustTimeline({
    providerResults: report.providerResults,
    insights: report.reportSummary?.insights,
    insightEngineVersion: report.reportSummary?.insightEngineVersion,
    audience: "paid",
  }) : [], [report]);

  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/dashboard" className="text-sm font-bold text-red-300 hover:text-red-200">← Back to dashboard</Link>
        <div className="mt-8 text-xs uppercase tracking-[0.45em] text-red-300">Private Intelligence Report</div>
        {!loaded && <p className="mt-6 text-zinc-400">Loading report...</p>}
        {loaded && !report && (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.035] p-7">
            <h1 className="text-3xl font-black">Report not found</h1>
            <p className="mt-4 leading-7 text-zinc-400">Open a ready report from your dashboard. ShadowScore does not display demo reports.</p>
          </div>
        )}
        {report && !isReady && (
          <div className="mt-8 rounded-[28px] border border-yellow-400/20 bg-yellow-500/10 p-7">
            <h1 className="text-3xl font-black text-yellow-100">Report locked</h1>
            <p className="mt-4 leading-7 text-zinc-300">This report is not ready. Full report details and downloads appear only when paymentStatus is paid and reportStatus is ready.</p>
          </div>
        )}
        {report && isReady && (
          <div className="mt-8 rounded-[32px] border border-white/10 bg-black/55 p-8 shadow-[0_0_60px_rgba(120,0,20,0.16)]">
            <h1 className="text-5xl font-extrabold">{report.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">{report.reportSummary?.message}</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                ["Report ID", report.reportId],
                ["Target", report.target || report.entity],
                ["Scan mode", report.scanMode || "Unknown"],
                ["Ready at", formatDate(report.readyAt)],
                ["Payment status", report.paymentStatus || "paid"],
                ["Report status", report.reportStatus],
                ["Engine version", report.engineVersion || "Unknown"],
                ["Primary domain", report.reportSummary?.primaryRiskDomain || "Provider placeholder"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">{label}</div>
                  <div className="mt-3 break-words text-xl font-bold text-white">{value}</div>
                </div>
              ))}
            </div>
            {report.reportSummary?.decision ? (
              <div className="mt-8 rounded-2xl border border-red-400/25 bg-red-500/[0.06] p-5">
                <div className="text-xs uppercase tracking-[0.28em] text-red-200">Business Decision</div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="text-3xl font-black text-white">{report.reportSummary.decision.decisionLabel}</div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-300">{report.reportSummary.decision.confidenceLevel} confidence</span>
                </div>
                <div className="mt-5 text-sm font-black text-zinc-100">Top reasons</div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
                  {report.reportSummary.decision.topReasons.map((reason) => <li key={reason}>• {reason}</li>)}
                </ul>
                <p className="mt-5 text-sm leading-6 text-zinc-300"><span className="font-bold text-zinc-100">What this means:</span> {report.reportSummary.decision.whatThisMeans}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300"><span className="font-bold text-zinc-100">Recommended action:</span> {report.reportSummary.decision.recommendedAction}</p>
              </div>
            ) : null}

            {report.reportSummary?.identityProfile?.identitySummary ? (
              <div className="mt-8 rounded-2xl border border-sky-400/20 bg-sky-500/[0.05] p-5">
                <div className="text-xs uppercase tracking-[0.28em] text-sky-200">Identity Summary</div>
                <p className="mt-4 text-sm leading-6 text-zinc-300">{report.reportSummary.identityProfile.identitySummary}</p>
              </div>
            ) : null}

            {report.reportSummary?.insights?.length ? (
              <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-5">
                <div className="text-xs uppercase tracking-[0.28em] text-emerald-200">Insight Engine</div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {report.reportSummary.insights.map((insight) => (
                    <div key={insight.category} className="rounded-2xl border border-white/10 bg-black/40 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="font-black text-white">{insight.category}</div>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-300">{insight.riskLevel}</span>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-zinc-300">{insight.insight}</p>
                      <p className="mt-3 text-xs leading-5 text-zinc-500"><span className="text-zinc-400">Why it matters:</span> {insight.whyItMatters}</p>
                      <p className="mt-2 text-xs leading-5 text-zinc-500"><span className="text-zinc-400">Recommended next step:</span> {insight.recommendedNextStep}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {trustTimeline.length ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.28em] text-red-300">Trust Timeline</div>
                <div className="mt-5 space-y-4">
                  {trustTimeline.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="rounded-2xl border border-white/10 bg-black/40 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="font-black text-white">Step {index + 1}: {item.title}</div>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-300">{item.status}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">{item.description}</p>
                      <p className="mt-3 text-xs leading-5 text-zinc-500"><span className="text-zinc-400">Evidence source:</span> {item.evidenceSource}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs uppercase tracking-[0.28em] text-red-300">Provider results</div>
              <pre className="mt-4 overflow-x-auto text-xs leading-6 text-zinc-400">{JSON.stringify(report.providerResults || [], null, 2)}</pre>
            </div>
            <button className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm font-black text-emerald-100">Download Report placeholder</button>
          </div>
        )}
      </section>
    </ShadowScoreLayout>
  );
}
