import type { CanonicalWebsiteReport } from "../../lib/websiteIntelligence/canonicalReport";
import { getWebsiteIntelligenceDashboardMetrics, WEBSITE_FINDING_SEVERITIES } from "../../lib/websiteIntelligence/dashboard";

const statusStyle = {
  complete: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  partial: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  unavailable: "border-slate-400/30 bg-slate-400/10 text-slate-200",
};

const severityStyle = {
  high: "text-red-200",
  medium: "text-amber-200",
  low: "text-sky-200",
  info: "text-slate-300",
};

function formatGeneratedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export function WebsiteIntelligenceDashboard({ report }: { report: CanonicalWebsiteReport }) {
  const metrics = getWebsiteIntelligenceDashboardMetrics(report);

  return <section aria-labelledby="website-dashboard-heading" className="space-y-6">
    <header className="border-b border-white/10 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Website Intelligence dashboard</p>
          <h1 id="website-dashboard-heading" className="mt-3 break-words text-3xl font-black sm:text-4xl">{report.subject.domain}</h1>
          <p className="mt-2 text-sm text-slate-400">Generated {formatGeneratedDate(report.generatedAt)}</p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 ${statusStyle[report.status]}`}>
          <p className="text-xs font-bold uppercase tracking-wider">Overall report status</p>
          <p className="mt-1 text-lg font-black">{metrics.statusLabel}</p>
        </div>
      </div>
    </header>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <p className="text-sm text-slate-400">Evidence coverage</p>
        <p className="mt-2 text-3xl font-black">{report.coverage.percent}%</p>
        <p className="mt-1 text-sm text-slate-400">{report.coverage.completedModules} of {report.coverage.totalModules} modules completed</p>
      </article>
      <article className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:col-span-1 lg:col-span-2">
        <h2 className="text-sm text-slate-400">Findings by severity</h2>
        <dl className="mt-3 grid grid-cols-4 gap-2">{WEBSITE_FINDING_SEVERITIES.map((severity) => <div key={severity}>
          <dt className={`text-xs font-bold capitalize ${severityStyle[severity]}`}>{severity}</dt>
          <dd className="mt-1 text-2xl font-black">{metrics.severityCounts[severity]}</dd>
        </div>)}</dl>
      </article>
    </div>

    <section aria-labelledby="dashboard-summary-heading" className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
      <h2 id="dashboard-summary-heading" className="text-lg font-bold">Assessment summary</h2>
      <p className="mt-3 leading-7 text-slate-300">{report.summary}</p>
    </section>

    <div className="grid gap-5 lg:grid-cols-2">
      <section aria-labelledby="dashboard-actions-heading" className="rounded-2xl border border-white/10 p-5">
        <h2 id="dashboard-actions-heading" className="text-lg font-bold">Top recommended actions</h2>
        <ol className="mt-4 space-y-3">{metrics.topRecommendedActions.length ? metrics.topRecommendedActions.map((action, index) => <li key={`${index}-${action}`} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="font-black text-sky-300">{index + 1}.</span><span>{action}</span></li>) : <li className="text-sm text-slate-400">No actions were generated from the available evidence.</li>}</ol>
      </section>
      <section aria-labelledby="dashboard-limitations-heading" className="rounded-2xl border border-white/10 p-5">
        <h2 id="dashboard-limitations-heading" className="text-lg font-bold">Evidence limitations</h2>
        {report.limitations.length ? <ul className="mt-4 space-y-3">{report.limitations.map((limitation) => <li key={limitation} className="text-sm leading-6 text-amber-100">{limitation}</li>)}</ul> : <p className="mt-4 text-sm text-slate-400">No evidence limitations were recorded.</p>}
        {metrics.hasLimitedEvidence && <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">Conclusions are limited to the evidence collected by completed modules.</p>}
      </section>
    </div>

    <section aria-labelledby="dashboard-modules-heading">
      <h2 id="dashboard-modules-heading" className="text-lg font-bold">Module status overview</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{report.modules.length ? report.modules.map((module) => <article key={module.id} className="rounded-2xl border border-white/10 p-4">
        <div className="flex items-start justify-between gap-3"><h3 className="font-bold">{module.name}</h3><span className="text-xs font-bold capitalize text-slate-300">{module.status}</span></div>
        <p className="mt-2 text-xs leading-5 text-slate-400">{module.summary}</p>
      </article>) : <p className="text-sm text-slate-400">No website assessment modules were available.</p>}</div>
    </section>
  </section>;
}
