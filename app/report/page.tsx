/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { EmptyState, ErrorState, LoadingState } from "../../components/AsyncState";
import InvestigationTimeline from "../components/InvestigationTimeline";
import { WebsiteIntelligenceReportView } from "../components/WebsiteIntelligenceReport";
import { WebsiteIntelligenceDashboard } from "../components/WebsiteIntelligenceDashboard";
import { getCurrentSession } from "../../lib/auth";
import { getWorkspace, type ShadowScoreReport } from "../../lib/workspace";
import { TechnicalValue, useLocale } from "../../components/LocaleProvider";
import { formatDateTime, localizeReportText } from "../../lib/i18n";

const INTERNAL_LANGUAGE = /\b(observation|inference|confidence|causal(?:ity)?|graph|reasoning|weight(?:ing)?|score|prompt|engine|signal)\b/i;


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
        {items.length ? items.map((item, index) => <li key={`${index}-${item}`} className="flex gap-3"><span className="font-black text-red-300">{numbered ? `${index + 1}.` : "•"}</span><span>{item}</span></li>) : <li className="text-zinc-400">{emptyMessage || "No additional information is recorded."}</li>}
      </ol>
    </section>
  );
}

function ExecutiveBrief({ report }: { report: ShadowScoreReport }) {
  const { locale, t } = useLocale();
  const localize = (value: string) => localizeReportText(value, locale);
  const narrative = report.reportSummary?.businessNarrative;
  const canonical = report.reportSummary?.decision?.canonicalDecision || narrative?.decisionMode;
  const decisionBasis = publicStatements([
    canonical?.userMeaning,
    report.reportSummary?.decision?.whatThisMeans,
    ...sectionBody(report, "executiveSummary"),
  ]).slice(0, 2).map(localize);
  const verified = publicStatements(sectionBody(report, "whatWeFound"))
    .filter((item) => !/no broader|not confirmed|limited public|could not/i.test(item)).slice(0, 5).map(localize);
  const reviewItems = publicStatements(sectionBody(report, "whatRequiresVerification"));
  const concerns = reviewItems.filter((item) => /inconsistent|conflict|mismatch|different|contradic/i.test(item)).slice(0, 4).map(localize);
  const gaps = reviewItems.filter((item) => !/inconsistent|conflict|mismatch|different|contradic/i.test(item)).slice(0, 5).map(localize);
  const impact = publicStatements(sectionBody(report, "decisionCost")).slice(0, 2).map(localize);
  const actions = publicStatements(sectionBody(report, "recommendedNextSteps")).slice(0, 5).map(localize);
  const sources = report.reportSummary?.sourceProvenance || [];
  const businessFindings = report.reportSummary?.businessIntelligence?.findings || [];

  return (
    <article className="mt-8 rounded-[32px] border border-white/10 bg-black/55 p-6 shadow-[0_0_60px_rgba(120,0,20,0.16)] sm:p-8">
      <header className="border-b border-white/10 pb-8">
        <div className="text-xs font-black uppercase tracking-[0.4em] text-red-300">{t.report.brief}</div>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">{narrative?.businessName || report.target || report.entity}</h1>
        <div className="mt-6 rounded-3xl border border-red-400/35 bg-red-600/15 p-6">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">{t.report.recommendation}</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{localize(recommendation(report))}</div>
        </div>
      </header>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <h2 className="text-xs font-black uppercase tracking-[0.28em] text-red-200">{t.report.decisionBasis}</h2>
        <div className="mt-4 space-y-3 text-base leading-7 text-zinc-200">
          {decisionBasis.length ? decisionBasis.map((item) => <p key={item}>{item}</p>) : <p>{t.report.content.decisionBasisFallback}</p>}
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ListCard title={t.report.verifiedFacts} items={verified} emptyMessage={t.report.content.noVerifiedFacts} />
        <ListCard title={t.report.materialConcerns} items={concerns} tone="concern" emptyMessage={t.report.content.noMaterialConcerns} />
        <ListCard title={t.report.evidenceGaps} items={gaps} tone="gap" emptyMessage={t.report.content.noEvidenceGaps} />
        <ListCard title={t.report.businessImpact} items={impact} emptyMessage={t.report.content.noBusinessImpact} />
      </div>
      <div className="mt-5"><ListCard title={t.report.actions} items={actions} numbered emptyMessage={t.report.content.standardChecks} /></div>

      <section className="mt-5 rounded-3xl border border-white/10 bg-black/35 p-6" aria-label="Business findings">
        <h2 className="text-xs font-black uppercase tracking-[0.28em] text-red-200">{t.report.findings}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{t.report.content.findingsMethod}</p>
        <div className="mt-5 space-y-4">
          {businessFindings.length ? businessFindings.map((finding) => (
            <article key={`${finding.id}-${finding.title}`} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-zinc-100">{localize(finding.title)}</h3><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">{localize(finding.direction.replaceAll("_", " "))}</span></div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{localize(finding.statement)}</p>
              <ul className="mt-3 space-y-1 text-xs leading-5 text-zinc-500">{finding.evidence.map((item) => <li key={`${item.providerId}-${item.id}`}>{item.providerId}: {localize(item.label)}{item.value ? `, ${item.value}` : ""} ({item.source})</li>)}</ul>
            </article>
          )) : <p className="text-sm text-zinc-400">{t.report.content.noBusinessFindings}</p>}
        </div>
      </section>

      {report.reportSummary?.scorecard && <section className="mt-5 rounded-3xl border border-white/10 bg-black/35 p-6" aria-label="Assessment summary">
        <h2 className="text-xs font-black uppercase tracking-[0.28em] text-red-200">{t.report.assessment}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{report.reportSummary.scorecard.scores.map((item) => <article key={item.dimension} className="rounded-2xl border border-white/10 bg-black/30 p-4"><h3 className="font-bold text-zinc-100">{t.scorecard[item.dimension]}</h3><p className="mt-2 text-sm capitalize text-zinc-300">{t.scorecard[item.level]}</p><p className="mt-1 text-xs capitalize text-zinc-500">{t.report.evidenceConfidence}: {item.confidence}</p>{item.evidenceGaps.length > 0 && <p className="mt-3 text-xs leading-5 text-amber-200">{t.report.content.evidenceGapsLabel}: {item.evidenceGaps.map(localize).join(", ")}</p>}</article>)}</div>
      </section>}

      {report.reportSummary?.investigationTimeline && <InvestigationTimeline className="mt-5" title={t.report.status} items={report.reportSummary.investigationTimeline.map((item) => ({ title: localize(item.label), description: localize(item.status === "unavailable" ? "Evidence was unavailable for this stage." : `Stage ${item.status}.`), evidenceSource: item.source, status: item.status, timestamp: item.observedAt, risk: item.status === "failed" }))} />}

      {report.reportSummary?.canonicalWebsiteReport && <section className="mt-5 rounded-3xl border border-white/10 bg-black/35 p-6" aria-label="Website Intelligence"><WebsiteIntelligenceDashboard report={report.reportSummary.canonicalWebsiteReport} /><div className="my-10 border-t border-white/10" /><WebsiteIntelligenceReportView report={report.reportSummary.canonicalWebsiteReport} /></section>}

      <section className="mt-8 border-t border-white/10 pt-6" aria-label="Source provenance">
        <h2 className="text-xs font-black uppercase tracking-[0.28em] text-red-200">{t.report.provenance}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sources.length ? sources.map((source) => (
            <div key={`${source.label}-${source.completedAt}`} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="font-bold text-zinc-100">{source.label}</div>
              <div className="mt-2 text-xs text-zinc-400">{t.report.reviewed} <TechnicalValue>{formatDateTime(source.completedAt, locale)}</TechnicalValue></div>
            </div>
          )) : <p className="text-sm text-zinc-400">{t.report.content.sourceTimingMissing}</p>}
        </div>
        <p className="mt-5 text-xs leading-5 text-zinc-500">{t.report.prepared} <TechnicalValue>{formatDateTime(narrative?.generatedAt || report.readyAt, locale)}</TechnicalValue>. {t.report.content.preparedEvidenceLimit}</p>
      </section>
    </article>
  );
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
