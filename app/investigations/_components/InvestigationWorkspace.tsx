"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ShadowScoreLayout from "@/app/components/ShadowScoreLayout";
import type { Investigation } from "@/lib/investigation";

const statusCopy: Record<Investigation["status"], string> = {
  draft: "Prepare the investigation", preview: "Review the target before saving", saved: "Save the case and prepare payment", payment_pending: "Confirm payment to begin collection", generating: "Collect evidence and prepare a review", ready: "Review the evidence and decision", monitoring: "Monitor this investigation", failed: "Resolve the provider issue", archived: "This investigation is archived",
};

function nextAction(status: Investigation["status"]) {
  return ({ preview: "Save investigation", saved: "Prepare payment", payment_pending: "Begin collection", generating: "Complete collection" } as Partial<Record<Investigation["status"], string>>)[status];
}

export function InvestigationWorkspace({ initialInvestigations }: { initialInvestigations: Investigation[] }) {
  const [investigations, setInvestigations] = useState(initialInvestigations);
  const [selectedId, setSelectedId] = useState(initialInvestigations[0]?.investigationId);
  const [target, setTarget] = useState("");
  const selected = investigations.find((item) => item.investigationId === selectedId);
  const activeCount = useMemo(() => investigations.filter((item) => !["archived", "failed"].includes(item.status)).length, [investigations]);

  function startInvestigation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTarget = target.trim();
    if (!trimmedTarget) return;
    const id = `inv-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const investigation: Investigation = { investigationId: id, target: trimmedTarget, normalizedTarget: trimmedTarget.toLowerCase(), targetType: "Unknown", status: "preview", createdAt: now, updatedAt: now, ontologyGraph: { entities: [], relationships: [] }, evidenceRefs: [], decision: null, technicalStatus: { executed: [], skipped: [], pending: [], failed: [] }, outcome: "unresolved", userId: "maya-chen" };
    setInvestigations((items) => [investigation, ...items]); setSelectedId(id); setTarget("");
  }
  function advance() {
    if (!selected) return;
    const statuses: Investigation["status"][] = ["preview", "saved", "payment_pending", "generating", "ready"];
    const next = statuses[statuses.indexOf(selected.status) + 1];
    if (!next) return;
    setInvestigations((items) => items.map((item) => item.investigationId !== selected.investigationId ? item : { ...item, status: next, updatedAt: new Date().toISOString(), verificationScore: next === "ready" ? 78 : item.verificationScore, evidenceRefs: next === "ready" ? ["identity-record", "domain-record"] : item.evidenceRefs, narrativeSummary: next === "ready" ? "Evidence collection is complete and ready for analyst review." : item.narrativeSummary }));
  }
  return <ShadowScoreLayout><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">Investigation workspace</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Run each case from intake to decision.</h1><p className="mt-3 text-sm leading-6 text-zinc-400">Create a case, collect supporting evidence, then prepare it for an analyst decision.</p></div><section className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.5fr]"><aside className="rounded-3xl border border-white/10 bg-white/[.035] p-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-500">Case intake</p><h2 className="mt-1 text-2xl font-black">Start an investigation</h2><form onSubmit={startInvestigation} className="mt-5 space-y-3"><label className="block text-sm font-bold text-zinc-200">Target<input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Business name or domain" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-300" /></label><button className="min-h-11 w-full rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300">Create preview</button></form><div className="mt-8 border-t border-white/10 pt-5"><p className="text-3xl font-black">{activeCount}</p><p className="mt-1 text-sm text-zinc-400">Active investigations</p></div><div className="mt-5 space-y-2">{investigations.map((item) => <button key={item.investigationId} onClick={() => setSelectedId(item.investigationId)} className={`w-full rounded-xl border p-3 text-left focus:outline-none focus:ring-2 focus:ring-sky-300 ${selectedId === item.investigationId ? "border-sky-400/50 bg-sky-500/10" : "border-white/10 bg-black/20 hover:bg-white/5"}`}><p className="truncate text-sm font-bold text-white">{item.target}</p><p className="mt-1 text-xs text-zinc-500">{item.status.replaceAll("_", " ")}</p></button>)}</div></aside>{selected && <section className="rounded-3xl border border-white/10 bg-white/[.035] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-500">{selected.investigationId}</p><h2 className="mt-1 text-2xl font-black">{selected.target}</h2><p className="mt-2 text-sm text-zinc-400">{statusCopy[selected.status]}</p></div><div className="flex items-center gap-3"><span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-bold capitalize text-sky-100">{selected.status.replaceAll("_", " ")}</span>{selected.status === "ready" && <Link href={`/investigations/${selected.investigationId}`} className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-sky-400">Open details</Link>}</div></div><ol className="mt-8 grid gap-3 sm:grid-cols-5">{["preview", "saved", "payment_pending", "generating", "ready"].map((stage, index) => <li key={stage} className={`rounded-xl border p-3 text-xs ${["preview", "saved", "payment_pending", "generating", "ready"].indexOf(selected.status) >= index ? "border-sky-400/40 bg-sky-500/10 text-sky-100" : "border-white/10 text-zinc-500"}`}><span className="font-bold">{index + 1}</span><p className="mt-1 capitalize">{stage.replaceAll("_", " ")}</p></li>)}</ol><div className="mt-8 rounded-2xl bg-black/30 p-4"><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-500">Evidence</p><p className="mt-2 text-sm text-zinc-300">{selected.evidenceRefs.length ? `${selected.evidenceRefs.length} sources attached` : "Evidence sources will appear when collection begins."}</p>{selected.narrativeSummary && <p className="mt-3 text-sm leading-6 text-zinc-400">{selected.narrativeSummary}</p>}</div>{selected.status === "ready" && <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4"><p className="text-sm font-bold text-emerald-100">Ready for analyst decision</p><p className="mt-1 text-sm text-emerald-100/80">Verification confidence: {selected.verificationScore}%.</p></div>}{nextAction(selected.status) && <button onClick={advance} className="mt-6 min-h-11 rounded-xl bg-sky-500 px-4 text-sm font-bold text-slate-950 hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300">{nextAction(selected.status)}</button>}</section>}</section></main></ShadowScoreLayout>;
}
