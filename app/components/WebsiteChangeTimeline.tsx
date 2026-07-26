import type { WebsiteChangeReport } from "../../lib/websiteIntelligence/history";

type TimelineItem = { scanId: string; scannedAt: string; summary: string; changeCount: number };

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date);
}

export function WebsiteChangeTimeline({ changeReport, timeline }: { changeReport?: WebsiteChangeReport; timeline?: TimelineItem[] }) {
  if (!changeReport || !timeline?.length) return null;
  return <section className="mt-10 border-t border-white/10 pt-8" aria-labelledby="website-change-timeline-heading">
    <h2 id="website-change-timeline-heading" className="text-2xl font-bold">Website Change Timeline</h2>
    <p className="mt-3 text-sm leading-6 text-slate-300">Each entry is an immutable Website Intelligence scan. Changes are measured against the preceding scan.</p>
    <ol className="mt-5 space-y-4">{[...timeline].reverse().map((item, index) => <li key={item.scanId} className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><time className="font-bold text-slate-100" dateTime={item.scannedAt}>{formatTimestamp(item.scannedAt)}</time><span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">{item.changeCount} changes</span></div>
      <p className="mt-2 text-sm text-slate-300">{item.summary}</p>
      {index === 0 && changeReport.changes.length > 0 && <ul className="mt-4 space-y-2">{changeReport.changes.map((change) => <li key={`${change.category}-${change.field}`} className="text-xs leading-5 text-slate-400"><strong className="text-sky-200">{change.category}, {change.field}:</strong> {change.before ?? "Not recorded"} → {change.after ?? "Not recorded"}</li>)}</ul>}
    </li>)}</ol>
  </section>;
}
