"use client";

import Link from "next/link";
import type { ShadowScoreReport } from "../../lib/workspace";
import { executiveBusinessImpacts, executiveDecisionReasons, executiveFindingStories, executiveRecommendation, groupExecutiveEvidence, materialEvidenceGaps, recommendedActions } from "../../lib/executiveReport";

function dateTime(value?: string) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

const riskSections = [
  { title: "Payment Risk", matcher: /payment|bank|invoice|payout|card|financial/i },
  { title: "Operational Risk", matcher: /operation|infrastructure|security|website|dns|domain|marketplace/i },
  { title: "Reputation Risk", matcher: /reputation|social|review|credibility|abuse|fraud|scam/i },
  { title: "Compliance Review", matcher: /compliance|regulat|sanction|legal|license|registration/i },
] as const;

function levelLabel(level?: string) {
  if (!level) return "Not assessed";
  return level.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ExecutiveIntelligenceReport({ report }: { report: ShadowScoreReport }) {
  const recommendation = executiveRecommendation(report);
  const findingStories = executiveFindingStories(report);
  const evidenceGroups = groupExecutiveEvidence(report);
  const evidence = evidenceGroups.flatMap((group) => group.items);
  const scorecard = report.reportSummary?.scorecard?.scores || [];
  const sources = report.reportSummary?.sourceProvenance || [];
  const timeline = report.reportSummary?.investigationTimeline || [];
  const narrative = report.reportSummary?.businessNarrative;
  const actions = recommendedActions(report);
  const decisionReasons = executiveDecisionReasons(report);
  const businessImpacts = executiveBusinessImpacts(report);
  const materialGaps = materialEvidenceGaps(report);
  const execution = report.reportSummary?.execution;
  const intelligence = report.reportSummary?.investigationIntelligence;
  const graphSummary = report.reportSummary?.knowledgeGraph?.graphSummary;
  const riskScore = report.riskScore;
  const confidence = report.confidenceScore === undefined ? narrative?.confidence || "Not recorded" : `${report.confidenceScore}%`;
  const gaps = Array.from(new Set(scorecard.flatMap((item) => item.evidenceGaps))).slice(0, 8);
  const verdictTone = /do not|stop|high risk/i.test(recommendation.label) ? "red" : /verify|review|caution/i.test(recommendation.label) ? "amber" : "green";
  const tone = verdictTone === "red" ? "border-red-300 bg-red-50 text-red-950" : verdictTone === "amber" ? "border-amber-300 bg-amber-50 text-amber-950" : "border-emerald-300 bg-emerald-50 text-emerald-950";
  const identityFindings = findingStories.filter((item) => /identity|business|registr|legal name/i.test(`${item.title} ${item.observation}`));
  const ownershipFindings = findingStories.filter((item) => /owner|domain|registrant/i.test(`${item.title} ${item.observation}`));

  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4 print:hidden">
      <p className="max-w-2xl text-sm leading-6 text-zinc-400">Private report. Recipients must sign in to the purchasing account.</p>
      <div className="flex flex-wrap gap-3"><button type="button" onClick={() => window.print()} className="rounded-lg border border-white/15 bg-white px-4 py-2.5 text-sm font-bold text-slate-950">Print report</button><Link href="/intake" className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950">Start Investigation</Link></div>
    </div>

    <article className="executive-report overflow-hidden rounded-[28px] border border-slate-300 bg-[#f4f3ef] text-slate-700 shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
      <header className="bg-[#10263d] px-6 py-9 text-white sm:px-10 lg:px-14 lg:py-12">
        <div className="flex items-center justify-between gap-6 border-b border-white/20 pb-6">
          <div><p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">ShadowScore Intelligence</p><p className="mt-2 text-sm text-slate-300">Independent business risk review</p></div>
          <p className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider">Confidential</p>
        </div>
        <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Executive Report</p><h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{narrative?.businessName || report.target || report.entity}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">Business intelligence prepared for executive review and decision support.</p></div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm lg:min-w-80"><div><dt className="text-slate-400">Report ID</dt><dd className="mt-1 font-mono font-semibold text-white">{report.reportId}</dd></div><div><dt className="text-slate-400">Issued</dt><dd className="mt-1 font-semibold text-white">{dateTime(report.readyAt || report.createdAt)}</dd></div><div><dt className="text-slate-400">Version</dt><dd className="mt-1 font-semibold text-white">1.0</dd></div><div><dt className="text-slate-400">Scope</dt><dd className="mt-1 font-semibold capitalize text-white">{report.scanMode || report.platform}</dd></div></dl>
        </div>
      </header>

      <div className="border-b border-slate-300 bg-white px-6 py-6 sm:px-10 lg:px-14">
        <nav aria-label="Report contents" className="flex flex-wrap gap-x-7 gap-y-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
          {["Summary", "Identity", "Risk analysis", "Evidence", "Actions", "Recommendation"].map((label) => <a key={label} href={`#${label.toLowerCase().replace(" ", "-")}`} className="underline decoration-slate-300 underline-offset-4 hover:text-slate-950">{label}</a>)}
        </nav>
      </div>

      <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
        <section id="summary" aria-labelledby="summary-title">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-800">01 / Decision brief</p><h2 id="summary-title" className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Executive Decision Brief</h2>
          <div className={`mt-6 rounded-2xl border p-6 sm:flex sm:items-end sm:justify-between sm:gap-6 ${tone}`}><div><p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">Decision</p><p className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{recommendation.label}</p></div><div className="mt-4 sm:mt-0 sm:text-right"><p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">Confidence</p><p className="mt-1 text-xl font-semibold">{confidence}</p></div></div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <BriefPanel title="Why"><ul className="space-y-4">{decisionReasons.length ? decisionReasons.map((reason) => <li key={reason.id} className="border-b border-slate-200 pb-3 last:border-0 last:pb-0"><p className="font-medium text-slate-950">{reason.statement}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wider text-cyan-800">Evidence: {reason.evidence}</p></li>) : <li>{recommendation.explanation}</li>}</ul></BriefPanel>
            <BriefPanel title="Business Impact"><ul className="list-disc space-y-3 pl-5 marker:text-cyan-800">{businessImpacts.length ? businessImpacts.map((impact) => <li key={impact}>{impact}</li>) : <li>{riskScore !== undefined && riskScore < 25 ? "Available evidence indicates low current business exposure." : "Resolve the decision conditions before making a commitment."}</li>}</ul></BriefPanel>
            <BriefPanel title="Immediate Actions"><ol className="space-y-3">{actions.map((action, index) => <li key={action} className="grid grid-cols-[2rem_1fr] gap-2"><span className="font-mono text-sm font-bold text-cyan-800">{index + 1}.</span><span className="font-medium text-slate-950">{action}</span></li>)}</ol></BriefPanel>
            <BriefPanel title="Missing Evidence"><div className="space-y-4">{materialGaps.length ? materialGaps.map((gap) => <div key={gap.id}><p className="font-medium text-slate-950">{gap.missingEvidence}</p><p className="mt-1 text-sm text-slate-600">Confidence impact: {gap.confidenceImpact}</p></div>) : <p>No material evidence gaps currently affect confidence.</p>}</div></BriefPanel>
          </div>

          <div className="mt-6 border border-slate-300 bg-slate-50 p-5"><h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Investigation Timeline</h3><dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">{[["Evidence collected", execution?.evidenceCollected ?? evidence.length], ["Providers executed", execution?.providersExecuted ?? sources.length], ["Contradictions found", intelligence?.contradictions.length ?? 0], ["Relationships discovered", intelligence?.relationships.length ?? graphSummary?.relationshipCount ?? 0], ["Confidence", confidence], ["Generation time", execution ? `${execution.completedInSeconds}s` : "Not recorded"]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-lg font-semibold text-slate-950">{value}</dd></div>)}</dl></div>
        </section>

        <section id="identity" aria-labelledby="identity-title" className="mt-12 border-t border-slate-300 pt-10"><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-800">02 / Entity profile</p><h2 id="identity-title" className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Business Identity</h2><dl className="mt-6 grid border-y border-slate-300 bg-white sm:grid-cols-2 lg:grid-cols-4">{[["Legal or trading name", narrative?.businessName || report.entity], ["Reviewed target", report.target || report.entity], ["Investigation type", report.scanMode || report.platform], ["Identity confidence", levelLabel(scorecard.find((item) => item.dimension === "Identity Confidence")?.level)]].map(([label, value]) => <div key={label} className="border-b border-slate-200 p-5 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0"><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-2 font-semibold capitalize text-slate-950">{value}</dd></div>)}</dl>
          <h3 className="sr-only">Key Findings</h3><div className="mt-7 grid gap-6 lg:grid-cols-2"><ReportFindingBlock title="Identity assessment" items={identityFindings} fallback="No separate identity finding was recorded." /><ReportFindingBlock title="Ownership" items={ownershipFindings} fallback="Ownership evidence was not sufficient for a separate conclusion." /></div>
        </section>

        <section id="risk-analysis" aria-labelledby="risk-title" className="mt-12 border-t border-slate-300 pt-10"><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-800">03 / Exposure review</p><h2 id="risk-title" className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Risk Analysis</h2><p className="mt-3 max-w-3xl leading-7">Each finding explains what the investigation observed, how it affects the commercial decision, which records support it, and what to do before committing funds.</p><div className="mt-7 grid gap-4 md:grid-cols-2">{riskSections.map((section) => { const items = findingStories.filter((item) => section.matcher.test(`${item.title} ${item.observation} ${item.commercialRisk}`)); return <ReportFindingBlock key={section.title} title={section.title} items={items} fallback="No material finding was recorded in this domain." />; })}</div>
        </section>

        <section id="evidence" aria-labelledby="evidence-title" className="mt-12 border-t border-slate-300 pt-10"><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-800">04 / Evidentiary record</p><h2 id="evidence-title" className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Supporting Evidence</h2><h3 className="sr-only">Evidence Summary</h3><div className="mt-7 space-y-4">{evidenceGroups.length ? evidenceGroups.map((group) => <details key={group.category} className="group border border-slate-300 bg-white p-5" open><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-950"><span>{group.category}</span><span className="text-sm font-normal text-slate-500">{group.items.length} items</span></summary><div className="mt-5 divide-y divide-slate-200 border-t border-slate-200">{group.items.map((item) => <div key={item.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_1.3fr_.8fr]"><p className="font-semibold text-slate-950">{item.label}</p><p className="text-sm">{item.value || "Observed"}</p><p className="text-sm text-slate-500 sm:text-right">{item.source}</p></div>)}</div></details>) : <p className="border border-slate-300 bg-white p-5">No supporting evidence items were recorded.</p>}</div>
          <div className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6"><h3 className="text-xl font-semibold text-slate-950">Evidence Gaps</h3><ul className="mt-4 grid gap-3 sm:grid-cols-2">{gaps.length ? gaps.map((gap) => <li key={gap} className="flex gap-3"><span aria-hidden="true" className="text-amber-700">○</span><span>{gap}</span></li>) : <li>No material evidence gaps were recorded.</li>}</ul></div>
        </section>

        <section aria-labelledby="timeline-title" className="mt-12 border-t border-slate-300 pt-10"><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-800">05 / Review record</p><h2 id="timeline-title" className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Investigation Timeline</h2><ol className="mt-7 grid gap-4 md:grid-cols-2">{timeline.length ? timeline.map((item, index) => <li key={item.id} className="flex gap-4 border border-slate-300 bg-white p-5"><span className="font-mono text-sm font-bold text-cyan-800">{String(index + 1).padStart(2, "0")}</span><div><p className="font-semibold text-slate-950">{item.label}</p><p className="mt-1 text-sm capitalize text-slate-500">{item.status.replaceAll("_", " ")} · {dateTime(item.observedAt)}</p></div></li>) : <li className="border border-slate-300 bg-white p-5">Timeline details were not recorded.</li>}</ol></section>

        <section id="actions" aria-labelledby="actions-title" className="mt-12 border-t border-slate-300 pt-10"><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-800">06 / Management response</p><h2 id="actions-title" className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Recommended Actions</h2><ol className="mt-7 divide-y divide-slate-200 border-y border-slate-300 bg-white">{actions.map((action, index) => <li key={action} className="grid gap-3 p-5 sm:grid-cols-[3rem_1fr]"><span className="font-mono text-sm font-bold text-cyan-800">{String(index + 1).padStart(2, "0")}</span><p className="font-semibold text-slate-950">{action}</p></li>)}</ol></section>

        <section id="recommendation" aria-labelledby="recommendation-title" className={`mt-12 border p-7 sm:p-9 ${tone}`}><p className="text-xs font-bold uppercase tracking-[0.22em] opacity-70">Final Recommendation</p><h2 id="recommendation-title" className="mt-3 text-3xl font-semibold">Executive Recommendation: {recommendation.label}</h2><p className="mt-4 max-w-3xl text-lg leading-8">{recommendation.explanation}</p><div className="mt-6 border-t border-current/20 pt-5"><p className="text-xs font-bold uppercase tracking-wider opacity-70">Immediate action</p><p className="mt-2 font-semibold">{actions[0] || recommendation.label}</p></div></section>

        <section aria-labelledby="sources-title" className="mt-12 border-t border-slate-300 pt-10"><h2 id="sources-title" className="text-2xl font-semibold text-slate-950">Source Appendix</h2><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[36rem] border-collapse bg-white text-left text-sm"><thead><tr className="border-y border-slate-300 text-xs uppercase tracking-wider text-slate-500"><th className="p-4">Source</th><th className="p-4">Reviewed</th><th className="p-4">Status</th></tr></thead><tbody>{sources.length ? sources.map((source) => <tr key={`${source.label}-${source.completedAt}`} className="border-b border-slate-200"><td className="p-4 font-semibold text-slate-950">{source.label}</td><td className="p-4">{dateTime(source.completedAt)}</td><td className="p-4">Included</td></tr>) : <tr><td colSpan={3} className="p-4">No source appendix was recorded.</td></tr>}</tbody></table></div></section>
      </div>

      <footer className="border-t border-slate-300 bg-white px-6 py-7 text-xs leading-5 text-slate-500 sm:px-10 lg:px-14"><div className="grid gap-5 sm:grid-cols-3"><p><strong className="block text-slate-700">Report ID</strong>{report.reportId}</p><p><strong className="block text-slate-700">Engine version</strong>{report.engineVersion || "Not recorded"}</p><p><strong className="block text-slate-700">Prepared</strong>{dateTime(report.readyAt || report.createdAt)}</p></div><p className="mt-6 max-w-4xl">This report provides decision support based on the evidence available at the time of review. Final business, legal, financial, and compliance decisions remain the responsibility of the reader.</p></footer>
    </article>
  </>;
}

function BriefPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="border border-slate-300 bg-white p-5 sm:p-6"><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">{title}</h3><div className="mt-4 text-sm leading-6 text-slate-700">{children}</div></article>;
}

function ReportFindingBlock({ title, items, fallback }: { title: string; items: ReturnType<typeof executiveFindingStories>; fallback: string }) {
  return <article className="border border-slate-300 bg-white p-6"><h3 className="text-xl font-semibold text-slate-950">{title}</h3><div className="mt-4 space-y-5">{items.length ? items.slice(0, 4).map((item) => <div key={item.id} className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{levelLabel(item.direction)}</p><h4 className="mt-1 font-semibold text-slate-950">{item.title}</h4><div className="mt-3 space-y-2 text-sm leading-6"><p><strong className="text-slate-950">Observed:</strong> {item.observation}</p><p><strong className="text-slate-950">Why it matters:</strong> {item.whyItMatters}</p><p><strong className="text-slate-950">Commercial risk:</strong> {item.commercialRisk}</p><p><strong className="text-slate-950">Evidence:</strong> {item.evidence}</p><p><strong className="text-slate-950">Next step:</strong> {item.nextStep}</p></div></div>) : <p className="text-sm leading-6 text-slate-600">{fallback}</p>}</div></article>;
}
