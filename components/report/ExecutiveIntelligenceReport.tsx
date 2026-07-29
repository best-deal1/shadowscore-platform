"use client";

import { useState } from "react";
import type { ShadowScoreReport } from "../../lib/workspace";
import { executiveRecommendation, groupExecutiveEvidence, recommendedActions, reportFindings } from "../../lib/executiveReport";

const tabs = ["Summary", "Risks", "Identity", "Evidence", "Timeline", "Sources", "Technical"] as const;
type Tab = (typeof tabs)[number];

function dateTime(value?: string) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export default function ExecutiveIntelligenceReport({ report }: { report: ShadowScoreReport }) {
  const [activeTab, setActiveTab] = useState<Tab>("Summary");
  const recommendation = executiveRecommendation(report);
  const findings = reportFindings(report);
  const evidenceGroups = groupExecutiveEvidence(report);
  const scorecard = report.reportSummary?.scorecard?.scores || [];
  const trustScore = report.riskScore === undefined ? "Not recorded" : `${Math.max(0, 100 - report.riskScore)}`;
  const confidence = report.confidenceScore === undefined ? "Not recorded" : `${report.confidenceScore}%`;
  const sources = report.reportSummary?.sourceProvenance || [];
  const timeline = report.reportSummary?.investigationTimeline || [];
  const actions = recommendedActions(report);
  const verdictTone = /do not|stop|high risk/i.test(recommendation.label) ? "red" : /verify|review/i.test(recommendation.label) ? "amber" : "green";
  const tone = verdictTone === "red" ? "border-red-200 bg-red-50 text-red-900" : verdictTone === "amber" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-950";

  return <article className="mt-8 overflow-hidden rounded-[32px] bg-slate-100 text-slate-700 shadow-2xl shadow-black/30">
    <header className="bg-slate-950 px-6 py-10 text-white sm:px-10">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Executive report</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div><h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{report.reportSummary?.businessNarrative?.businessName || report.target || report.entity}</h1><p className="mt-3 text-sm text-slate-400">Generated {dateTime(report.readyAt || report.createdAt)}</p></div>
        <div className="text-left sm:text-right"><p className="text-xs uppercase tracking-wider text-slate-400">Confidence</p><p className="mt-1 text-3xl font-bold">{confidence}</p></div>
      </div>
    </header>

    <section className="border-b border-slate-200 bg-white p-5 sm:p-8">
      <div className={`rounded-3xl border p-6 sm:p-8 ${tone}`}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Trust verdict</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-5"><div><h2 className="text-3xl font-black sm:text-4xl">{recommendation.label}</h2><p className="mt-3 max-w-3xl leading-7 opacity-80">{recommendation.explanation}</p></div><div className="rounded-2xl bg-white/70 px-5 py-4 text-center"><p className="text-xs font-bold uppercase tracking-wider opacity-60">Trust score</p><p className="mt-1 text-3xl font-black">{trustScore}</p></div></div>
        <div className="mt-6 border-t border-current/15 pt-5"><p className="text-xs font-bold uppercase tracking-wider opacity-60">Recommended action</p><p className="mt-1 text-lg font-bold">{actions[0] || recommendation.label}</p></div>
      </div>
    </section>

    <nav className="overflow-x-auto border-b border-slate-200 bg-white px-4" aria-label="Report sections"><div className="flex min-w-max gap-1">{tabs.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? "page" : undefined} className={`border-b-2 px-4 py-4 text-sm font-bold ${activeTab === tab ? "border-cyan-600 text-slate-950" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{tab}</button>)}</div></nav>

    <div className="min-h-[420px] p-5 sm:p-8">
      {activeTab === "Summary" && <section><h2 className="text-2xl font-bold text-slate-950">Executive Summary</h2><div className="mt-6 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-bold text-slate-950">Key reasons</h3><ul className="mt-4 space-y-3">{[...findings.positive, ...findings.warnings, ...findings.negative].slice(0, 3).map((item) => <li key={item.id} className="flex gap-3"><span aria-hidden="true">{findings.positive.includes(item) ? "✓" : "!"}</span><span>{item.title}</span></li>)}</ul></div><div className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-bold text-slate-950">Next steps</h3><ol className="mt-4 space-y-3">{actions.slice(0, 3).map((action, index) => <li key={action} className="flex gap-3"><span className="font-bold text-cyan-700">{index + 1}</span><span>{action}</span></li>)}</ol></div></div></section>}
      {activeTab === "Risks" && <section><h2 className="text-2xl font-bold text-slate-950">Risks</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{[...findings.negative, ...findings.warnings].map((item) => <article key={item.id} className="rounded-2xl border border-amber-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-amber-700">{item.category}</p><h3 className="mt-2 font-bold text-slate-950">{item.title}</h3><p className="mt-2 text-sm leading-6">{item.statement}</p></article>)}</div></section>}
      {activeTab === "Identity" && <section><h2 className="text-2xl font-bold text-slate-950">Identity</h2><dl className="mt-6 grid gap-4 sm:grid-cols-2">{[["Business", report.entity], ["Target", report.target || report.entity], ["Investigation", report.scanMode || report.platform], ["Identity confidence", scorecard.find((item) => item.dimension === "Identity Confidence")?.level || "Not recorded"]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-2 font-bold capitalize text-slate-950">{value}</dd></div>)}</dl></section>}
      {activeTab === "Evidence" && <section><h2 className="text-2xl font-bold text-slate-950">Evidence</h2><div className="mt-6 space-y-4">{evidenceGroups.map((group) => <details key={group.category} className="rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-bold text-slate-950">{group.category} <span className="font-normal text-slate-500">({group.items.length})</span></summary><div className="mt-4 grid gap-3 sm:grid-cols-2">{group.items.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold text-slate-950">{item.label}</p><p className="mt-1 text-sm">{item.value}</p><p className="mt-2 text-xs text-slate-500">{item.source}</p></div>)}</div></details>)}</div></section>}
      {activeTab === "Timeline" && <section><h2 className="text-2xl font-bold text-slate-950">Timeline</h2><ol className="mt-6 space-y-4">{timeline.map((item) => <li key={item.id} className="border-l-2 border-cyan-600 bg-white p-4"><p className="font-bold text-slate-950">{item.label}</p><p className="mt-1 text-sm capitalize text-slate-500">{item.status.replaceAll("_", " ")} · {dateTime(item.observedAt)}</p></li>)}</ol></section>}
      {activeTab === "Sources" && <section><h2 className="text-2xl font-bold text-slate-950">Sources</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{sources.map((source) => <div key={`${source.label}-${source.completedAt}`} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-bold text-slate-950">{source.label}</p><p className="mt-2 text-sm text-slate-500">Checked {dateTime(source.completedAt)}</p></div>)}</div></section>}
      {activeTab === "Technical" && <section><h2 className="text-2xl font-bold text-slate-950">Technical details</h2><p className="mt-2 text-slate-500">Audit and engine details for technical review.</p><dl className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm"><div className="flex justify-between gap-4 border-b border-slate-100 py-3"><dt>Report ID</dt><dd className="font-mono text-slate-950">{report.reportId}</dd></div><div className="flex justify-between gap-4 py-3"><dt>Engine version</dt><dd className="font-mono text-slate-950">{report.engineVersion || "Not recorded"}</dd></div></dl></section>}
    </div>
  </article>;
}
