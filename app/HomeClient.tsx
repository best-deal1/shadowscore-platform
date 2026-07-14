"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ShadowScoreLayout from "./components/ShadowScoreLayout";
import { buildTrustTimeline } from "../lib/trustTimeline";
import type { ShadowScoreReport } from "../lib/workspace";

type GraphNode = { id: string; label: string; type: string };
type GraphEdge = { id: string; from: string; to: string; type: string; context?: string };

function decisionTone(decision?: string) {
  if (decision === "PASS") return "border-emerald-400/35 bg-emerald-500/10 text-emerald-100";
  if (decision === "FAIL" || decision === "CONFIRMED RISK") return "border-red-400/35 bg-red-500/10 text-red-100";
  return "border-orange-400/35 bg-orange-500/10 text-orange-100";
}

function statusTone(status: string) {
  if (status === "completed" || status === "executed") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  if (status === "failed" || status === "unavailable") return "border-red-400/30 bg-red-500/10 text-red-100";
  return "border-yellow-400/30 bg-yellow-500/10 text-yellow-100";
}

function graphFromReport(report: ShadowScoreReport) {
  const snapshot = report.reportSummary?.knowledgeGraph;
  const nodes: GraphNode[] = (snapshot?.entities || []).map((entity) => ({ id: entity.id, label: entity.label, type: entity.type }));
  const edges: GraphEdge[] = (snapshot?.relationships || []).map((relationship) => ({ id: relationship.id, from: relationship.from, to: relationship.to, type: relationship.type, context: relationship.context }));

  if (nodes.length) return { nodes, edges };

  const fallbackNodes = new Map<string, GraphNode>();
  const target = report.target || report.entity;
  fallbackNodes.set("target", { id: "target", label: target, type: report.scanMode || "Target" });
  for (const result of report.providerResults || []) {
    for (const evidence of result.evidence) {
      const id = evidence.id || `${result.providerId}-${evidence.label}`;
      fallbackNodes.set(id, { id, label: evidence.value || evidence.label, type: evidence.type });
    }
  }
  return { nodes: Array.from(fallbackNodes.values()).slice(0, 8), edges: [] };
}

export default function HomeClient({ report }: { report: ShadowScoreReport }) {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [isInvestigating, setIsInvestigating] = useState(false);
  const timeline = useMemo(() => buildTrustTimeline({ providerResults: report.providerResults, insights: report.reportSummary?.insights, insightEngineVersion: report.reportSummary?.insightEngineVersion, audience: "paid" }), [report]);
  const graph = useMemo(() => graphFromReport(report), [report]);
  const decision = report.reportSummary?.decision;
  const execution = report.reportSummary?.execution;
  const technical = report.reportSummary?.technicalDetails;
  const executionRecords = [...(technical?.executed || []), ...(technical?.failed || []), ...(technical?.skipped || []), ...(technical?.pending || [])].sort((a, b) => a.order - b.order);
  const displayDecision = decision?.decision === "FAIL" ? "CONFIRMED RISK" : decision?.decision || "REVIEW";

  function startInvestigation(nextTarget = target) {
    if (isInvestigating) return;
    const normalizedTarget = nextTarget.trim();
    setTarget(normalizedTarget);
    setIsInvestigating(true);
    const query = normalizedTarget ? `?target=${encodeURIComponent(normalizedTarget)}&mode=website` : "";
    window.setTimeout(() => router.push(`/intake${query}`), 700);
  }

  return (
    <ShadowScoreLayout>
      <section className="relative overflow-hidden px-5 py-14 sm:px-6 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(220,38,38,0.28),transparent_34%),radial-gradient(circle_at_15%_70%,rgba(251,146,60,0.12),transparent_28%),linear-gradient(180deg,rgba(127,29,29,0.1),transparent_55%)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-180px)] max-w-7xl flex-col items-center justify-center text-center">
          <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-100">Live engine window · {report.engineVersion}</div>
          <h1 className="max-w-5xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Investigate a digital business identity before you proceed.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300 sm:text-xl">This homepage is rendered from the same ready report contract produced by the ShadowScore investigation pipeline.</p>

          <div className="mt-10 w-full max-w-5xl rounded-[36px] border border-white/10 bg-zinc-950/85 p-4 shadow-[0_0_90px_rgba(220,38,38,0.24)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/[0.06] p-3 sm:flex-row">
              <input value={target} onChange={(event) => setTarget(event.target.value)} onKeyDown={(event) => event.key === "Enter" && startInvestigation()} className="min-h-16 flex-1 rounded-2xl border border-white/10 bg-white px-5 text-lg font-black text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-red-300 focus:ring-4 focus:ring-red-500/25 sm:min-h-20 sm:px-7 sm:text-2xl" placeholder="Website, company, email, phone or marketplace seller..." aria-label="Investigation target" />
              <button onClick={() => startInvestigation()} className="min-h-16 rounded-2xl bg-red-600 px-8 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_0_34px_rgba(220,38,38,0.4)] transition hover:bg-red-500 sm:min-h-20">Start Investigation</button>
            </div>
          </div>

          <section className="mt-10 grid w-full gap-5 text-left lg:grid-cols-[1fr_1fr]" aria-label="Live investigation state">
            <div className="rounded-[32px] border border-white/10 bg-black/55 p-6">
              <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Provider Timeline</div>
              <div className="mt-5 space-y-3">
                {timeline.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex items-center justify-between gap-4"><div className="font-black text-white">{item.title}</div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(item.status)}`}>{item.status}</span></div>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">{item.description}</p>
                    <p className="mt-2 text-xs text-zinc-500">{item.evidenceSource}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-[32px] border p-6 ${decisionTone(displayDecision)}`}>
              <div className="text-xs font-black uppercase tracking-[0.28em] opacity-80">Decision Engine</div>
              <div className="mt-5 text-5xl font-black">{displayDecision}</div>
              <p className="mt-4 text-base font-bold opacity-90">{decision?.recommendedAction || report.reportSummary?.businessNarrative?.decision}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-black/20 p-4"><div className="text-[10px] uppercase tracking-[0.2em] opacity-70">Confidence</div><div className="mt-2 font-black">{decision?.confidenceLevel || execution?.decisionConfidence || "From report"}</div></div>
                <div className="rounded-2xl border border-white/15 bg-black/20 p-4"><div className="text-[10px] uppercase tracking-[0.2em] opacity-70">Evidence</div><div className="mt-2 font-black">{execution?.evidenceCollected ?? report.providerResults?.reduce((sum, result) => sum + result.evidence.length, 0)}</div></div>
                <div className="rounded-2xl border border-white/15 bg-black/20 p-4"><div className="text-[10px] uppercase tracking-[0.2em] opacity-70">Providers</div><div className="mt-2 font-black">{execution?.providersExecuted ?? report.providerResults?.length}</div></div>
              </div>
              <ul className="mt-5 space-y-2 text-sm leading-6 opacity-90">{(decision?.topReasons || []).map((reason) => <li key={reason}>• {reason}</li>)}</ul>
            </div>
          </section>

          <section className="mt-5 grid w-full gap-5 text-left lg:grid-cols-[1fr_1fr]" aria-label="Engine graph and execution">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6">
              <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Relationship Graph</div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {graph.nodes.map((node) => <div key={node.id} className="rounded-2xl border border-white/10 bg-black/40 p-4"><div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{node.type}</div><div className="mt-2 break-words font-black text-white">{node.label}</div></div>)}
              </div>
              <div className="mt-5 space-y-2 text-sm text-zinc-400">{graph.edges.map((edge) => <div key={edge.id} className="rounded-xl border border-white/10 bg-black/30 p-3">{edge.from} <span className="text-red-200">{edge.type}</span> {edge.to}{edge.context ? ` · ${edge.context}` : ""}</div>)}</div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6">
              <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Investigation Pipeline</div>
              <div className="mt-5 space-y-3">
                {executionRecords.map((record) => <div key={`${record.engineId}-${record.order}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 p-4"><div><div className="font-black text-white">{record.label}</div><div className="mt-1 text-xs text-zinc-500">{record.providerId || record.engineId}{record.reason ? ` · ${record.reason}` : ""}</div></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(record.status)}`}>{record.status}</span></div>)}
              </div>
            </div>
          </section>

          {isInvestigating && <div className="mt-6 w-full max-w-3xl rounded-3xl border border-white/10 bg-black/70 p-5 text-left shadow-2xl shadow-red-950/20"><div className="text-xs font-black uppercase tracking-[0.24em] text-red-200">Opening investigation intake</div><div className="mt-3 text-sm font-bold text-zinc-300">The intake will generate a report using this same engine contract.</div></div>}
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
