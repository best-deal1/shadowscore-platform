/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { getCurrentSession } from "../../lib/auth";
import { getWorkspace, type ShadowScoreReport } from "../../lib/workspace";

const INTERNAL_LANGUAGE = /\b(observation|inference|confidence|causal(?:ity)?|graph|reasoning|weight(?:ing)?|score|prompt|engine|signal)\b/i;

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  }).format(date);
}

function sectionBody(report: ShadowScoreReport, id: string) {
  return report.reportSummary?.businessNarrative?.sections.find((section) => section.id === id)?.body || [];
}

function publicStatements(items: Array<string | undefined>) {
  return Array.from(new Set(items.filter((item): item is string => Boolean(item?.trim())).filter((item) => !INTERNAL_LANGUAGE.test(item))));
}

function recommendation(report: ShadowScoreReport) {
  const outcome = report.reportSummary?.decision?.canonicalDecision?.decisionOutcome
    || report.reportSummary?.businessNarrative?.decisionMode?.decisionOutcome;
  if (outcome === "PROCEED") return "PROCEED WITH STANDARD DUE DILIGENCE";
  if (outcome === "DO_NOT_PROCEED") return "DO NOT PROCEED";
  return "REVIEW BEFORE PROCEEDING";
}

function ListCard({ title, items, tone = "neutral", numbered = false, emptyMessage }: { title: string; items: string[]; tone?: "neutral" | "concern" | "gap"; numbered?: boolean; emptyMessage?: string }) {
  const toneClass = tone === "concern"
    ? "border-red-400/25 bg-red-500/[0.06]"
    : tone === "gap" ? "border-amber-400/25 bg-amber-500/[0.06]" : "border-white/10 bg-black/35";
  return (
    <section className={`rounded-3xl border p-6 ${toneClass}`}>
      <h2 className="text-xs font-black uppercase tracking-[0.28em] text-red-200">{title}</h2>
      <ol className="mt-4 space-y-3 text-sm leading-6 text-zinc-200">
        {items.length ? items.map((item, index) => <li key={item} className="flex gap-3"><span className="font-black text-red-300">{numbered ? `${index + 1}.` : "•"}</span><span>{item}</span></li>) : <li className="text-zinc-400">{emptyMessage || "No additional information is recorded."}</li>}
      </ol>
    </section>
  );
}

function ExecutiveBrief({ report }: { report: ShadowScoreReport }) {
  const narrative = report.reportSummary?.businessNarrative;
  const canonical = report.reportSummary?.decision?.canonicalDecision || narrative?.decisionMode;
  const decisionBasis = publicStatements([
    canonical?.userMeaning,
    report.reportSummary?.decision?.whatThisMeans,
    ...sectionBody(report, "executiveSummary"),
  ]).slice(0, 2);
  const verified = publicStatements(sectionBody(report, "whatWeFound"))
    .filter((item) => !/no broader|not confirmed|limited public|could not/i.test(item)).slice(0, 5);
  const reviewItems = publicStatements(sectionBody(report, "whatRequiresVerification"));
  const concerns = reviewItems.filter((item) => /inconsistent|conflict|mismatch|different|contradic/i.test(item)).slice(0, 4);
  const gaps = reviewItems.filter((item) => !/inconsistent|conflict|mismatch|different|contradic/i.test(item)).slice(0, 5);
  const impact = publicStatements(sectionBody(report, "decisionCost")).slice(0, 2);
  const actions = publicStatements(sectionBody(report, "recommendedNextSteps")).slice(0, 5);
  const sources = report.reportSummary?.sourceProvenance || [];

  return (
    <article className="mt-8 rounded-[32px] border border-white/10 bg-black/55 p-6 shadow-[0_0_60px_rgba(120,0,20,0.16)] sm:p-8">
      <header className="border-b border-white/10 pb-8">
        <div className="text-xs font-black uppercase tracking-[0.4em] text-red-300">Executive decision brief</div>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">{narrative?.businessName || report.target || report.entity}</h1>
        <div className="mt-6 rounded-3xl border border-red-400/35 bg-red-600/15 p-6">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Recommendation</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{recommendation(report)}</div>
        </div>
      </header>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <h2 className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Decision basis</h2>
        <div className="mt-4 space-y-3 text-base leading-7 text-zinc-200">
          {decisionBasis.length ? decisionBasis.map((item) => <p key={item}>{item}</p>) : <p>Review the available business information before making a commitment.</p>}
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ListCard title="Verified facts" items={verified} emptyMessage="No verified facts are recorded in the available report evidence." />
        <ListCard title="Material concerns" items={concerns} tone="concern" emptyMessage="No material concerns are recorded in the available report evidence." />
        <ListCard title="Evidence gaps" items={gaps} tone="gap" emptyMessage="No additional evidence gaps are recorded in this report." />
        <ListCard title="Business impact" items={impact} emptyMessage="The report does not record a separate business impact statement." />
      </div>
      <div className="mt-5"><ListCard title="Recommended next actions" items={actions} numbered emptyMessage="Complete the standard checks required for this decision." /></div>

      <section className="mt-8 border-t border-white/10 pt-6" aria-label="Source provenance">
        <h2 className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Source provenance</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sources.length ? sources.map((source) => (
            <div key={`${source.label}-${source.completedAt}`} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="font-bold text-zinc-100">{source.label}</div>
              <div className="mt-2 text-xs text-zinc-400">Reviewed {formatDate(source.completedAt)}</div>
            </div>
          )) : <p className="text-sm text-zinc-400">Source timing was not recorded for this report.</p>}
        </div>
        <p className="mt-5 text-xs leading-5 text-zinc-500">Brief prepared {formatDate(narrative?.generatedAt || report.readyAt)}. Claims above are limited to the report evidence available at that time.</p>
      </section>
    </article>
  );
}

export default function ReportPage() {
  const [reportId, setReportId] = useState("");
  const [reports, setReports] = useState<ShadowScoreReport[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setReportId(new URLSearchParams(window.location.search).get("reportId") || "");
    const session = getCurrentSession();
    if (!session) { setLoaded(true); return; }
    getWorkspace(session).then((workspace) => setReports(workspace.reports)).finally(() => setLoaded(true));
  }, []);

  const report = useMemo(() => reports.find((item) => item.reportId === reportId), [reports, reportId]);
  const isReady = report?.reportStatus === "ready";

  return (
    <ShadowScoreLayout>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/workspace" className="text-sm font-bold text-red-300 hover:text-red-200">← Back to dashboard</Link>
        {!loaded && <p className="mt-6 text-zinc-400">Preparing report...</p>}
        {loaded && !report && <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.035] p-7"><h1 className="text-3xl font-black">Report not found</h1><p className="mt-4 leading-7 text-zinc-400">Open a ready report from your dashboard.</p></section>}
        {report && !isReady && <section className="mt-8 rounded-[28px] border border-yellow-400/20 bg-yellow-500/10 p-7"><h1 className="text-3xl font-black text-yellow-100">Report locked</h1><p className="mt-4 leading-7 text-zinc-300">This report will be available after payment is confirmed and preparation is complete.</p></section>}
        {report && isReady && <ExecutiveBrief report={report} />}
      </main>
    </ShadowScoreLayout>
  );
}
