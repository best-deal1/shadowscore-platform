"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ShadowScoreLayout from "@/app/components/ShadowScoreLayout";
import type { Investigation, InvestigationStatus } from "@/lib/investigation";

const stages = [
  { key: "preview", label: "Intake", detail: "Target captured and normalized" },
  { key: "saved", label: "Preview", detail: "Scope ready for confirmation" },
  { key: "payment_pending", label: "Evidence", detail: "Collection authorization" },
  { key: "generating", label: "Analysis", detail: "Evidence is being assessed" },
  { key: "ready", label: "Decision", detail: "Report is ready for review" },
] as const;

const statusIndex: Record<InvestigationStatus, number> = { draft: 0, preview: 0, saved: 1, payment_pending: 2, generating: 3, ready: 4, monitoring: 4, failed: 3, archived: 4 };
const statusLabel: Record<InvestigationStatus, string> = { draft: "Draft", preview: "Preview ready", saved: "Saved", payment_pending: "Awaiting authorization", generating: "Analysis in progress", ready: "Report ready", monitoring: "Monitoring", failed: "Needs attention", archived: "Archived" };

function nextAction(status: InvestigationStatus) {
  return ({ preview: "Save investigation", saved: "Continue to authorization", payment_pending: "Begin evidence collection", generating: "Complete analysis" } as Partial<Record<InvestigationStatus, string>>)[status];
}

export function InvestigationWorkspace({ initialInvestigations }: { initialInvestigations: Investigation[] }) {
  const [investigations, setInvestigations] = useState(initialInvestigations);
  const [selectedId, setSelectedId] = useState(initialInvestigations[0]?.investigationId);
  const [target, setTarget] = useState("");
  const [requestState, setRequestState] = useState<"idle" | "working" | "error">("idle");
  const selected = investigations.find((item) => item.investigationId === selectedId);
  const readyCount = useMemo(() => investigations.filter((item) => item.status === "ready").length, [investigations]);

  async function startInvestigation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTarget = target.trim();
    if (!trimmedTarget) return;
    setRequestState("working");
    const response = await fetch("/api/investigations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: trimmedTarget }) });
    if (!response.ok) { setRequestState("error"); return; }
    const investigation = await response.json() as Investigation;
    setInvestigations((items) => [investigation, ...items]);
    setSelectedId(investigation.investigationId);
    setTarget("");
    setRequestState("idle");
  }

  async function advance() {
    if (!selected) return;
    setRequestState("working");
    const response = await fetch(`/api/investigations/${selected.investigationId}`, { method: "POST" });
    if (!response.ok) { setRequestState("error"); return; }
    const updated = await response.json() as Investigation;
    setInvestigations((items) => items.map((item) => item.investigationId === updated.investigationId ? updated : item));
    setRequestState("idle");
  }

  return <ShadowScoreLayout><main className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <header className="flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-7"><div><p className="ui-label">Investigation workspace</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Investigations</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Start a review, follow evidence collection, and open completed reports from one workspace.</p></div><div className="flex gap-3"><Summary value={investigations.length} label="Total" /><Summary value={readyCount} label="Reports ready" /></div></header>

    <section className="mt-6 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-5"><section className="audit-surface p-5"><p className="ui-label">New investigation</p><h2 className="mt-1 text-xl font-black text-white">Enter a target</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Use a business name, domain, marketplace seller, email, or phone number.</p><form onSubmit={startInvestigation} className="mt-4"><label className="sr-only" htmlFor="investigation-target">Investigation target</label><input id="investigation-target" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="acme.example" className="min-h-12 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-300" /><button disabled={requestState === "working"} className="mt-3 min-h-11 w-full rounded-xl bg-sky-500 px-4 text-sm font-bold text-slate-950 hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60">{requestState === "working" ? "Preparing workspace…" : "Start investigation"}</button>{requestState === "error" && <p role="alert" className="mt-3 text-sm text-red-300">The request could not be completed. Try again.</p>}</form></section>
        <section className="audit-surface overflow-hidden"><div className="border-b border-white/10 px-5 py-4"><p className="ui-label">History</p><h2 className="mt-1 font-bold text-white">Recent investigations</h2></div><div className="max-h-[560px] space-y-1 overflow-y-auto p-2">{investigations.length ? investigations.map((item) => <button key={item.investigationId} onClick={() => setSelectedId(item.investigationId)} className={`w-full rounded-xl border p-3 text-left ${selectedId === item.investigationId ? "border-sky-400/50 bg-sky-500/10" : "border-transparent hover:bg-white/5"}`}><div className="flex items-start justify-between gap-3"><p className="truncate text-sm font-bold text-white">{item.target}</p><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.status === "ready" ? "bg-emerald-400" : item.status === "failed" ? "bg-red-400" : "bg-sky-400"}`} /></div><p className="mt-1 text-xs text-zinc-500">{statusLabel[item.status]} · {new Date(item.updatedAt).toLocaleDateString("en-GB", { timeZone: "UTC" })}</p></button>) : <p className="p-4 text-sm leading-6 text-zinc-400">No investigations yet. Enter a target to create the first case.</p>}</div></section>
      </aside>

      {selected ? <InvestigationPanel investigation={selected} busy={requestState === "working"} advance={advance} /> : <section className="audit-surface grid min-h-[480px] place-items-center p-8 text-center"><div><p className="text-lg font-bold text-white">Select or start an investigation</p><p className="mt-2 text-sm text-zinc-400">The workflow and report status will appear here.</p></div></section>}
    </section>
  </main></ShadowScoreLayout>;
}

function InvestigationPanel({ investigation, busy, advance }: { investigation: Investigation; busy: boolean; advance: () => void }) {
  const current = statusIndex[investigation.status];
  const progress = Math.round(((current + 1) / stages.length) * 100);
  return <section className="audit-surface overflow-hidden"><header className="border-b border-white/10 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="ui-label">{investigation.investigationId}</p><h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{investigation.target}</h2><dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"><div><dt className="text-xs text-zinc-500">Normalized target</dt><dd className="mt-1 font-medium text-zinc-200">{investigation.normalizedTarget}</dd></div><div><dt className="text-xs text-zinc-500">Detected type</dt><dd className="mt-1 capitalize text-zinc-200">{investigation.targetType.replaceAll("_", " ")}</dd></div><div><dt className="text-xs text-zinc-500">Updated</dt><dd className="mt-1 text-zinc-200">{new Date(investigation.updatedAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</dd></div></dl></div><span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-100">{statusLabel[investigation.status]}</span></div></header>
    <div className="p-5 sm:p-7"><div className="flex items-end justify-between gap-4"><div><p className="ui-label">Investigation progress</p><h3 className="mt-1 text-xl font-black text-white">{stages[current]?.label || "Intake"} is the current stage</h3></div><p className="text-sm font-bold text-sky-200">{progress}%</p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${progress}%` }} /></div>
      <ol className="mt-6 grid gap-3 md:grid-cols-5">{stages.map((stage, index) => { const state = index < current ? "Completed" : index === current ? (investigation.status === "failed" ? "Needs attention" : "Current") : "Remaining"; return <li key={stage.key} className={`rounded-xl border p-3 ${index < current ? "border-emerald-400/25 bg-emerald-500/[.07]" : index === current ? "border-sky-400/45 bg-sky-500/10" : "border-white/10 bg-black/20"}`}><div className="flex items-center justify-between"><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-black ${index < current ? "bg-emerald-400 text-slate-950" : index === current ? "bg-sky-400 text-slate-950" : "bg-white/10 text-zinc-500"}`}>{index < current ? "✓" : index + 1}</span><span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{state}</span></div><p className="mt-3 text-sm font-bold text-white">{stage.label}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{stage.detail}</p></li>; })}</ol>

      <div className="mt-7 grid gap-4 lg:grid-cols-2"><section className="rounded-2xl border border-white/10 bg-black/25 p-5"><div className="flex items-center justify-between"><div><p className="ui-label">Evidence collection</p><h3 className="mt-1 font-bold text-white">Source coverage</h3></div><span className="text-2xl font-black text-white">{investigation.evidenceRefs.length}</span></div><p className="mt-3 text-sm leading-6 text-zinc-400">{investigation.evidenceRefs.length ? `${investigation.evidenceRefs.length} source references are attached and ready to inspect.` : current < 2 ? "Collection begins after the investigation is authorized." : "No source references have been attached yet."}</p>{investigation.evidenceRefs.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{investigation.evidenceRefs.slice(0, 4).map((reference) => <span key={reference} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-300">{reference}</span>)}</div>}</section>
        <section className="rounded-2xl border border-white/10 bg-black/25 p-5"><p className="ui-label">Next step</p><h3 className="mt-1 font-bold text-white">{investigation.status === "ready" ? "Review the decision and report" : stages[Math.min(current + 1, 4)].label}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{investigation.narrativeSummary || (investigation.status === "ready" ? "The investigation is complete and ready for decision review." : "Complete the current stage to continue the investigation.")}</p>{investigation.status === "ready" && investigation.verificationScore !== undefined && <p className="mt-4 text-sm font-bold text-emerald-300">Confidence {investigation.verificationScore}%</p>}</section></div>

      <div className="mt-6 flex flex-wrap gap-3">{investigation.status === "ready" && <Link href={`/investigations/${investigation.investigationId}`} className="inline-flex min-h-11 items-center rounded-xl bg-sky-500 px-4 text-sm font-bold text-slate-950 hover:bg-sky-400">Open decision and report</Link>}{nextAction(investigation.status) && <button onClick={advance} disabled={busy} className="min-h-11 rounded-xl bg-sky-500 px-4 text-sm font-bold text-slate-950 hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60">{busy ? "Updating…" : nextAction(investigation.status)}</button>}{investigation.reportId && <Link href={`/reports/${investigation.reportId}`} className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-bold text-zinc-200 hover:border-sky-400/50">Open report</Link>}</div>
    </div></section>;
}

function Summary({ value, label }: { value: number; label: string }) { return <div className="min-w-24 rounded-xl border border-white/10 bg-white/[.035] px-4 py-3"><p className="text-2xl font-black text-white">{value}</p><p className="text-xs text-zinc-500">{label}</p></div>; }
