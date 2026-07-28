import type { ShadowScoreReport } from "../../lib/workspace";
import { EVIDENCE_CATEGORIES, executiveRecommendation, groupExecutiveEvidence, recommendedActions, reportFindings } from "../../lib/executiveReport";

const levelLabels: Record<string, string> = { strong: "Strong", adequate: "Adequate", limited: "Limited", needs_review: "Needs review", unavailable: "Unavailable" };

function dateTime(value?: string) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value));
}

function Section({ number, title, children, className = "" }: { number: string; title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 ${className}`}><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{number}</span><h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2></div><div className="mt-6">{children}</div></section>;
}

function FindingList({ title, items, tone }: { title: string; items: Array<{ id: string; title: string; statement: string }>; tone: "positive" | "negative" | "warning" }) {
  const styles = { positive: "border-emerald-200 bg-emerald-50 text-emerald-950", negative: "border-red-200 bg-red-50 text-red-950", warning: "border-amber-200 bg-amber-50 text-amber-950" }[tone];
  return <div><h3 className="text-sm font-bold text-slate-900">{title}</h3><div className="mt-3 space-y-3">{items.length ? items.map((item) => <article key={item.id} className={`rounded-2xl border p-4 ${styles}`}><h4 className="font-bold">{item.title}</h4><p className="mt-1 text-sm leading-6 opacity-80">{item.statement}</p></article>) : <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No findings in this category.</p>}</div></div>;
}

export default function ExecutiveIntelligenceReport({ report }: { report: ShadowScoreReport }) {
  const recommendation = executiveRecommendation(report);
  const findings = reportFindings(report);
  const evidenceGroups = groupExecutiveEvidence(report);
  const scorecard = report.reportSummary?.scorecard?.scores || [];
  const score = (dimension: string) => levelLabels[scorecard.find((item) => item.dimension === dimension)?.level || "unavailable"];
  const trustScore = report.riskScore === undefined ? score("Overall ShadowScore") : `${Math.max(0, 100 - report.riskScore)}/100`;
  const confidence = report.confidenceScore === undefined ? (scorecard[0]?.confidence || "Not recorded") : `${report.confidenceScore}%`;
  const sources = Array.from(new Map((report.reportSummary?.sourceProvenance || []).map((source) => [`${source.label.toLowerCase()}|${source.completedAt || ""}`, source])).values());
  const timeline = [...(report.reportSummary?.investigationTimeline || [])].sort((a, b) => (a.observedAt || "").localeCompare(b.observedAt || ""));
  const generatedAt = report.reportSummary?.businessNarrative?.generatedAt || report.readyAt || report.createdAt;
  const riskCards = [
    ["Trust Score", trustScore], ["Identity Confidence", score("Identity Confidence")], ["Operational Risk", score("Infrastructure Maturity")],
    ["Compliance Risk", findings.negative.some((item) => /regulat|compliance|sanction/i.test(`${item.category} ${item.title}`)) ? "Elevated" : "No material issue found"],
    ["Payment Risk", findings.negative.some((item) => /payment|bank|invoice/i.test(`${item.category} ${item.title}`)) ? "Elevated" : "No material issue found"],
    ["Marketplace Risk", report.scanMode === "marketplace" ? score("Business Trust") : "Not assessed"],
  ];

  return <article className="mt-8 overflow-hidden rounded-[32px] bg-slate-100 text-slate-700 shadow-2xl shadow-black/30">
    <header className="bg-slate-950 px-6 py-10 text-white sm:px-10">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">Executive Intelligence Report</p>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{report.reportSummary?.businessNarrative?.businessName || report.target || report.entity}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Decision-ready business due diligence based on the evidence available at the time of review.</p></div><div className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4"><p className="text-xs uppercase tracking-wider text-slate-400">Final decision</p><p className="mt-1 text-xl font-bold">{recommendation.label}</p></div></div>
    </header>
    <div className="space-y-6 p-4 sm:p-8">
      <Section number="1" title="Executive Summary"><dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{[["Company", report.entity], ["Investigation type", report.scanMode || report.platform], ["Overall Trust Score", trustScore], ["Final Decision", recommendation.label], ["Confidence", confidence], ["Generated date", dateTime(generatedAt)]].map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-950">{value}</dd></div>)}</dl></Section>
      <Section number="2" title="Executive Recommendation" className="border-l-4 border-l-cyan-600"><p className="text-2xl font-bold text-slate-950">{recommendation.label}</p><p className="mt-3 max-w-4xl text-base leading-7">{recommendation.explanation}</p></Section>
      <Section number="3" title="Risk Score Card"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{riskCards.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-lg font-bold text-slate-950">{value}</p></div>)}</div></Section>
      <Section number="4" title="Key Findings"><div className="grid gap-6 lg:grid-cols-3"><FindingList title="Positive Findings" items={findings.positive} tone="positive" /><FindingList title="Negative Findings" items={findings.negative} tone="negative" /><FindingList title="Warnings" items={findings.warnings} tone="warning" /></div></Section>
      <Section number="5" title="Evidence Summary">{evidenceGroups.length ? <div className="space-y-6">{evidenceGroups.map((group) => <div key={group.category}><h3 className="border-b border-slate-200 pb-2 font-bold text-slate-950">{group.category}</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{group.items.map((item) => <article key={item.id} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold text-slate-950">{item.label}</p>{item.value && <p className="mt-1 text-sm">{item.value}</p>}<p className="mt-2 text-xs text-slate-500">Source: {item.source}</p></article>)}</div></div>)}</div> : <p className="text-sm text-slate-500">No categorized evidence was available for this report.</p>}<p className="sr-only">Evidence categories: {EVIDENCE_CATEGORIES.join(", ")}</p></Section>
      <Section number="6" title="Investigation Timeline">{timeline.length ? <ol className="space-y-4">{timeline.map((item, index) => <li key={item.id} className="grid gap-2 border-l-2 border-slate-200 pl-5 sm:grid-cols-[1fr_auto]"><div><p className="font-bold text-slate-950">{index + 1}. {item.label}</p><p className="mt-1 text-sm capitalize text-slate-500">{item.status.replaceAll("_", " ")}</p></div><time className="text-xs text-slate-500">{dateTime(item.observedAt)}</time></li>)}</ol> : <p className="text-sm text-slate-500">Timeline details were unavailable. The completed report remains valid for the evidence recorded.</p>}</Section>
      <Section number="7" title="Recommended Actions"><ol className="space-y-3">{recommendedActions(report).map((action, index) => <li key={action} className="flex gap-4 rounded-2xl bg-slate-50 p-4"><span className="font-bold text-cyan-700">{index + 1}</span><span className="font-medium text-slate-900">{action}</span></li>)}</ol></Section>
      <Section number="8" title="Source Appendix">{sources.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><th className="pb-3">Source</th><th className="pb-3">Status</th><th className="pb-3">Last checked</th><th className="pb-3">Confidence</th></tr></thead><tbody>{sources.map((source) => <tr key={`${source.label}-${source.completedAt}`} className="border-b border-slate-100"><td className="py-4 font-semibold text-slate-950">{source.label}</td><td className="py-4">Checked</td><td className="py-4">{dateTime(source.completedAt)}</td><td className="py-4 capitalize">{scorecard[0]?.confidence || "Not recorded"}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">Source details were unavailable for this report.</p>}</Section>
    </div>
    <footer className="border-t border-slate-200 bg-white px-6 py-7 text-xs leading-5 text-slate-500 sm:px-10"><div className="grid gap-2 sm:grid-cols-3"><p><strong className="text-slate-700">Report ID:</strong> {report.reportId}</p><p><strong className="text-slate-700">Engine version:</strong> {report.engineVersion || "Not recorded"}</p><p><strong className="text-slate-700">Generated:</strong> {dateTime(generatedAt)}</p></div><p className="mt-4 max-w-4xl">This report is an analytical assessment based on sources available at the generation time. Verify material facts before making legal, financial, or commercial decisions.</p></footer>
  </article>;
}
