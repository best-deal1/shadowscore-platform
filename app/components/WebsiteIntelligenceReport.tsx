import type { CanonicalWebsiteReport } from "../../lib/websiteIntelligence/canonicalReport";

const severityStyle = {
  info: "border-slate-400/20 text-slate-300",
  low: "border-sky-400/25 text-sky-200",
  medium: "border-amber-400/25 text-amber-200",
  high: "border-red-400/25 text-red-200",
};

export function WebsiteIntelligenceReportView({ report }: { report: CanonicalWebsiteReport }) {
  const evidenceById = new Map(report.evidence.map((item) => [item.id, item]));
  return <div className="space-y-8">
    <header>
      <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[.2em] text-sky-300">
        <span>Website Intelligence</span>
        <span className="rounded-full border border-white/15 px-3 py-1 text-slate-300">{report.status}</span>
      </div>
      <h1 className="mt-5 break-words text-4xl font-black">{report.subject.domain}</h1>
      <p className="mt-4 leading-7 text-slate-300">{report.summary}</p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-5"><dt className="text-sm text-slate-400">Module coverage</dt><dd className="mt-2 text-xl font-bold">{report.coverage.completedModules} of {report.coverage.totalModules} ({report.coverage.percent}%)</dd></div>
        <div className="rounded-2xl border border-white/10 p-5"><dt className="text-sm text-slate-400">Report contract</dt><dd className="mt-2 text-sm font-bold">{report.schemaVersion}</dd></div>
      </dl>
    </header>

    <section aria-labelledby="website-assessment-heading">
      <h2 id="website-assessment-heading" className="text-2xl font-bold">Assessment</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{report.assessments.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 p-5"><h3 className="font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p></article>)}</div>
    </section>

    <section aria-labelledby="website-findings-heading">
      <h2 id="website-findings-heading" className="text-2xl font-bold">Findings and evidence</h2>
      <div className="mt-4 space-y-4">{report.findings.length ? report.findings.map((finding) => <article key={finding.id} className={`rounded-2xl border p-5 ${severityStyle[finding.severity]}`}>
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-100">{finding.title}</h3><span className="text-xs font-bold uppercase">{finding.severity}</span></div>
        <p className="mt-3 text-sm leading-6 text-slate-300">{finding.statement}</p>
        <p className="mt-3 text-sm leading-6 text-slate-400"><strong className="text-slate-200">Business impact:</strong> {finding.businessImpact}</p>
        <ul className="mt-4 space-y-2">{finding.evidenceIds.map((id) => { const evidence = evidenceById.get(id); return evidence ? <li key={id} className="rounded-xl bg-black/20 p-3 text-xs leading-5 text-slate-400"><strong className="text-slate-200">{evidence.label}:</strong> {evidence.value}<br />Source: {evidence.source}</li> : null; })}</ul>
      </article>) : <p className="rounded-2xl border border-white/10 p-5 text-slate-400">No findings were recorded from the available checks.</p>}</div>
    </section>

    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="website-actions-heading"><h2 id="website-actions-heading" className="text-2xl font-bold">Recommended actions</h2><ol className="mt-4 space-y-3">{report.recommendedActions.length ? report.recommendedActions.map((action, index) => <li key={action} className="rounded-2xl border border-white/10 p-4 text-sm text-slate-300"><strong className="mr-2 text-sky-300">{index + 1}.</strong>{action}</li>) : <li className="rounded-2xl border border-white/10 p-4 text-sm text-slate-400">No actions were generated.</li>}</ol></section>
      <section aria-labelledby="website-limitations-heading"><h2 id="website-limitations-heading" className="text-2xl font-bold">Evidence limitations</h2><ul className="mt-4 space-y-3">{report.limitations.length ? report.limitations.map((item) => <li key={item} className="rounded-2xl border border-amber-400/20 p-4 text-sm text-slate-300">{item}</li>) : <li className="rounded-2xl border border-white/10 p-4 text-sm text-slate-400">All configured modules completed.</li>}</ul></section>
    </div>

    <section aria-labelledby="website-sources-heading"><h2 id="website-sources-heading" className="text-2xl font-bold">Source appendix</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="text-slate-400"><tr><th className="border-b border-white/10 p-3">Check</th><th className="border-b border-white/10 p-3">Status</th><th className="border-b border-white/10 p-3">Source</th><th className="border-b border-white/10 p-3">Summary</th></tr></thead><tbody>{report.modules.map((module) => <tr key={module.id}><td className="border-b border-white/10 p-3 font-bold">{module.name}</td><td className="border-b border-white/10 p-3 capitalize text-slate-300">{module.status}</td><td className="border-b border-white/10 p-3 text-slate-400">{module.source}</td><td className="border-b border-white/10 p-3 text-slate-400">{module.summary}</td></tr>)}</tbody></table></div></section>
  </div>;
}
