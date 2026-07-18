import { readFileSync } from "node:fs";
import { join } from "node:path";

type Metric = { value: number | null; label: "measured" | "derived" | "estimated"; unit?: "percent" | "count"; note?: string };
type Dashboard = { generatedAt: string; metrics: Record<string, Metric>; manualReviewQueue: Array<{ target: string; exactChange: string; suspectedCause: string; recommendedNextInvestigationStep: string }>; environmentAlerts: Array<{ target: string; type: string; exactChange: string }>; targets: Array<{ target: string; decision: string; currentResult: string; evidenceCoverage: number | null; providerStatus: string }> };

function readDashboard(): Dashboard | null {
  try {
    const payload = JSON.parse(readFileSync(join(process.cwd(), "quality/dashboard.json"), "utf8"));
    return payload.dashboard || null;
  } catch {
    return null;
  }
}

function formatMetric(metric: Metric) {
  if (metric.value === null || metric.value === undefined) return `Unavailable (${metric.label})`;
  return `${metric.value}${metric.unit === "percent" ? "%" : ""} (${metric.label})`;
}

export default function QualityPage() {
  const dashboard = readDashboard();
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300">Internal engineering dashboard</p>
        <h1 className="mt-4 text-4xl font-black">Investigation Quality Dashboard</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">Release-quality view of live validation health. Metrics are labelled as measured, derived, or estimated and are not customer-facing truth.</p>
        {!dashboard ? <div className="mt-8 rounded-3xl border border-yellow-400/30 bg-yellow-500/10 p-6 text-yellow-100">Run <code>npm run quality:generate && npm run quality:dashboard</code> to create the first quality dashboard artifact.</div> : (
          <>
            <p className="mt-6 text-sm text-zinc-400">Generated {dashboard.generatedAt}</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(dashboard.metrics).map(([name, metric]) => <div key={name} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{name}</div><div className="mt-3 text-2xl font-black">{formatMetric(metric)}</div>{metric.note ? <p className="mt-2 text-xs text-zinc-400">{metric.note}</p> : null}</div>)}
            </div>
            <h2 className="mt-10 text-2xl font-black">Manual review queue</h2>
            <div className="mt-4 space-y-3">{dashboard.manualReviewQueue.length ? dashboard.manualReviewQueue.map((item) => <div key={`${item.target}-${item.exactChange}`} className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4"><b>{item.target}</b>: {item.exactChange}<div className="text-sm text-zinc-300">Cause: {item.suspectedCause}. Next: {item.recommendedNextInvestigationStep}</div></div>) : <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-100">No meaningful product regressions detected.</div>}</div>
            <h2 className="mt-10 text-2xl font-black">Environment/public-source alerts</h2>
            <div className="mt-4 space-y-3">{dashboard.environmentAlerts.length ? dashboard.environmentAlerts.map((item) => <div key={`${item.target}-${item.type}`} className="rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4"><b>{item.target}</b>: {item.type}: {item.exactChange}</div>) : <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">None.</div>}</div>
            <h2 className="mt-10 text-2xl font-black">Current live targets</h2>
            <div className="mt-4 overflow-hidden rounded-3xl border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-white/[0.06] text-zinc-400"><tr><th className="p-3">Target</th><th>Decision</th><th>Identity</th><th>Evidence</th><th>Provider</th></tr></thead><tbody>{dashboard.targets.map((target) => <tr key={target.target} className="border-t border-white/10"><td className="p-3 font-bold">{target.target}</td><td>{target.decision}</td><td>{target.currentResult}</td><td>{target.evidenceCoverage ?? "unavailable"}</td><td>{target.providerStatus}</td></tr>)}</tbody></table></div>
          </>
        )}
      </section>
    </main>
  );
}
