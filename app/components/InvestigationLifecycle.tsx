import InvestigationTimeline from "./InvestigationTimeline";
import AuditMetadata from "./AuditMetadata";

type Provider = {
  providerId: string;
  providerName: string;
  status: "completed" | "failed" | "skipped";
  lookupPerformed?: boolean;
  evidenceCount?: number;
  fields: Array<{ label: string; value: string }>;
};

type LifecycleStatus = "Running" | "Completed" | "Failed" | "Not applicable";

const stages = [
  "Target received",
  "Identity resolution",
  "Business discovery",
  "Evidence collection",
  "Evidence verification",
  "Contradiction analysis",
  "Risk assessment",
  "Executive recommendation",
  "Professional report",
];

function statusStyle(status: LifecycleStatus) {
  if (status === "Completed") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
  if (status === "Failed") return "border-red-400/30 bg-red-500/10 text-red-100";
  if (status === "Not applicable") return "border-zinc-600/60 bg-zinc-900/60 text-zinc-400";
  return "border-amber-300/30 bg-amber-400/10 text-amber-100";
}

export default function InvestigationLifecycle({
  running,
  failed,
  target,
  startedAt,
  completedAt,
  providers = [],
}: {
  running: boolean;
  failed: boolean;
  target: string;
  startedAt?: string;
  completedAt?: string;
  providers?: Provider[];
}) {
  const completedProviders = providers.filter((provider) => provider.status === "completed" && provider.lookupPerformed !== false);
  const failedProviders = providers.filter((provider) => provider.status === "failed");
  const hasEvidence = completedProviders.some((provider) => (provider.evidenceCount || provider.fields.length) > 0);
  const stageStatus = (index: number): LifecycleStatus => {
    if (running) return index === 0 ? "Completed" : "Running";
    if (failed) return index === 0 ? "Completed" : index === 3 ? "Failed" : "Not applicable";
    if (index === 2 && !hasEvidence) return "Not applicable";
    return "Completed";
  };

  // The client has only confirmed intake receipt until the provider response arrives.
  // Keep later stages hidden rather than simulating progress between network events.
  const visibleStages = running ? stages.slice(0, 2) : stages;
  const log = running
    ? [
        { text: "Target received", source: "Investigation intake", status: "Completed" as LifecycleStatus, at: startedAt },
        { text: "Evidence collection started", source: "Provider gateway", status: "Running" as LifecycleStatus, at: startedAt },
      ]
    : failed
      ? [{ text: "Target received", source: "Investigation intake", status: "Completed" as LifecycleStatus, at: startedAt }, { text: "Evidence collection could not complete", source: failedProviders[0]?.providerName || "Provider gateway", status: "Failed" as LifecycleStatus, at: completedAt }]
      : [
          { text: "Identity resolved", source: completedProviders[0]?.providerName || "Investigation intake", status: "Completed" as LifecycleStatus, at: completedAt },
          { text: "Independent evidence corroborated", source: completedProviders.slice(0, 2).map((provider) => provider.providerName).join(" · ") || "Provider gateway", status: "Completed" as LifecycleStatus, at: completedAt },
          { text: "Risk assessment completed", source: "Decision Engine", status: "Completed" as LifecycleStatus, at: completedAt },
          { text: "Recommendation updated", source: "Executive report", status: "Completed" as LifecycleStatus, at: completedAt },
        ];

  return (
    <section aria-live="polite" className="mt-6 rounded-[28px] border border-white/10 bg-[#0a0a0c]/95 p-5 shadow-[0_18px_60px_rgba(0,0,0,.3)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-300">Investigation workspace</p>
          <h2 className="mt-2 text-xl font-black text-white">{target || "Target"}</h2>
          <p className="mt-1 text-sm text-zinc-400">Work is recorded as each source returns evidence.</p>
        </div>
        <div className={`rounded-xl border px-4 py-2 text-sm font-black ${running ? "border-amber-300/30 bg-amber-400/10 text-amber-100" : failed ? "border-red-400/30 bg-red-500/10 text-red-100" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"}`}>{running ? "Active investigation" : failed ? "Investigation interrupted" : "Investigation complete"}</div>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Lifecycle</h3>
          <ol className="mt-4 space-y-2">
            {visibleStages.map((stage, index) => {
              const status = stageStatus(index);
              return <li key={stage} className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 text-base ${statusStyle(status)}`}><span className="font-semibold">{stage}</span><span className="shrink-0 rounded-lg border border-current/30 bg-black/15 px-2.5 py-1 text-sm font-black uppercase tracking-[0.08em]">{status}</span></li>;
            })}
          </ol>
        </div>
        <div className="space-y-5">
          <InvestigationTimeline title="Investigation timeline" items={log.map((entry) => ({ title: entry.text, description: `Status: ${entry.status}`, evidenceSource: entry.source, status: entry.status, timestamp: entry.at, risk: entry.status === "Failed" }))} />
          <AuditMetadata compact createdAt={startedAt} completedAt={completedAt} engineVersion="Insight Engine v1.0" policyVersion="Trust Policy v1.0" sources={completedProviders.map((provider) => provider.providerName)} />
          {!running && !failed && <div><h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Evidence received</h3><div className="mt-4 space-y-2">{completedProviders.length ? completedProviders.slice(0, 4).map((provider) => <div key={provider.providerId} className="rounded-xl border border-white/10 bg-black/35 p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-white">{provider.providerName}</span><span className="text-xs font-bold text-emerald-200">Verified source</span></div><div className="mt-2 text-xs text-zinc-400">{provider.evidenceCount || provider.fields.length} evidence item{(provider.evidenceCount || provider.fields.length) === 1 ? "" : "s"} attached</div></div>) : <p className="rounded-xl border border-white/10 bg-black/35 p-3 text-sm text-zinc-400">No evidence was returned by applicable sources.</p>}</div></div>}
          <div><h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Evidence quality</h3><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-2 text-blue-100">Known: reported by a source</div><div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-2 text-emerald-100">Verified: corroborated evidence</div><div className="rounded-lg border border-zinc-600/60 bg-zinc-900/60 p-2 text-zinc-300">Unknown: no conclusion</div><div className="rounded-lg border border-orange-400/20 bg-orange-500/10 p-2 text-orange-100">Unavailable: source did not return</div><div className="col-span-2 rounded-lg border border-red-400/20 bg-red-500/10 p-2 text-red-100">Contradictory: sources disagree</div></div></div>
        </div>
      </div>
    </section>
  );
}
