"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { restoreCurrentSession } from "../../lib/auth";
import { getWorkspace, ShadowScoreReport } from "../../lib/workspace";

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
    const directReportId = new URLSearchParams(window.location.search).get("reportId") || "";
    setReportId(directReportId);

    restoreCurrentSession()
      .then((session) => {
        if (!session) return null;
        return getWorkspace(session);
      })
      .then((workspace) => {
        if (workspace) setReports(workspace.reports);
      })
      .finally(() => setLoaded(true));
  }, []);

  const report = useMemo(() => reports.find((item) => item.reportId === reportId), [reports, reportId]);
  const isReady = report?.reportStatus === "ready";

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
