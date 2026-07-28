/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { EmptyState, ErrorState, LoadingState } from "../../components/AsyncState";
import ExecutiveIntelligenceReport from "../../components/report/ExecutiveIntelligenceReport";
import { getCurrentSession } from "../../lib/auth";
import { getWorkspace, type ShadowScoreReport } from "../../lib/workspace";

function ExecutiveBrief({ report }: { report: ShadowScoreReport }) {
  return <ExecutiveIntelligenceReport report={report} />;
}

export default function ReportPage() {
  const [reportId, setReportId] = useState("");
  const [reports, setReports] = useState<ShadowScoreReport[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  async function loadReport() {
    setLoaded(false);
    setLoadError(false);
    setReportId(new URLSearchParams(window.location.search).get("reportId") || "");
    const session = getCurrentSession();
    if (!session) { setLoaded(true); return; }
    try {
      const workspace = await getWorkspace(session);
      setReports(workspace.reports);
    } catch {
      setLoadError(true);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    void loadReport();
  }, []);

  const report = useMemo(() => reports.find((item) => item.reportId === reportId), [reports, reportId]);
  const isReady = report?.reportStatus === "ready";

  return (
    <ShadowScoreLayout>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/workspace" className="text-sm font-bold text-red-300 hover:text-red-200">← Back to dashboard</Link>
        {!loaded && <div className="mt-8"><LoadingState label="Preparing report..." /></div>}
        {loaded && loadError && <div className="mt-8"><ErrorState title="Report unavailable" description="We could not load this report. Check your connection and try again." onRetry={() => void loadReport()} /></div>}
        {loaded && !loadError && !report && <div className="mt-8"><EmptyState title="Report not found" description="Open a ready report from your dashboard." /></div>}
        {report && !isReady && <section className="mt-8 rounded-[28px] border border-yellow-400/20 bg-yellow-500/10 p-7"><h1 className="text-3xl font-black text-yellow-100">Report locked</h1><p className="mt-4 leading-7 text-zinc-300">This report will be available after payment is confirmed and preparation is complete.</p></section>}
        {report && isReady && <ExecutiveBrief report={report} />}
      </main>
    </ShadowScoreLayout>
  );
}
