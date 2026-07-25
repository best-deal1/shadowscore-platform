import type { WebsiteChange } from "../../lib/websiteIntelligence/history";

const classificationStyle = {
  New: "text-sky-200 bg-sky-400/10",
  Improved: "text-emerald-200 bg-emerald-400/10",
  Regressed: "text-red-200 bg-red-400/10",
  Removed: "text-amber-100 bg-amber-400/10",
};

export function WebsiteChangeTimeline({ changes }: { changes: WebsiteChange[] }) {
  return <section aria-labelledby="website-change-timeline-heading" className="mt-10 border-t border-white/10 pt-8">
    <h2 id="website-change-timeline-heading" className="text-xl font-bold">Website change timeline</h2>
    <p className="mt-2 text-sm text-slate-400">Changes are compared with the previous saved scan.</p>
    {changes.length ? <ol className="mt-5 space-y-4">{changes.map((change) => <li key={change.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><span className="text-xs font-bold uppercase tracking-wider text-slate-400">{change.category}</span><h3 className="mt-1 font-bold">{change.label}</h3></div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${classificationStyle[change.classification]}`}>{change.classification}</span>
      </div>
      <p className="mt-3 text-sm text-slate-300">{change.previousValue ?? "No previous value"} → {change.currentValue ?? "No current value"}</p>
      <time className="mt-2 block text-xs text-slate-500" dateTime={change.detectedAt}>{new Date(change.detectedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC</time>
    </li>)}</ol> : <p className="mt-5 rounded-2xl border border-white/10 p-4 text-sm text-slate-400">No changes have been detected yet.</p>}
  </section>;
}
