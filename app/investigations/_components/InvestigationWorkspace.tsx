"use client";

import Link from "next/link";
import ShadowScoreLayout from "@/app/components/ShadowScoreLayout";
import type { Investigation, InvestigationStatus } from "@/lib/investigation";

const customerStatus: Record<InvestigationStatus, string> = {
  draft: "Draft", preview: "Draft", saved: "Draft", payment_pending: "Draft",
  generating: "In progress", ready: "Report ready", monitoring: "In review",
  failed: "Needs input", archived: "Archived",
};

function action(item: Investigation) {
  if (item.status === "ready" && item.reportId) return { label: "View Executive Report", href: `/reports/${item.reportId}` };
  if (item.status === "ready") return { label: "Open Investigation", href: `/investigations/${item.investigationId}` };
  if (["draft", "preview", "saved", "payment_pending"].includes(item.status)) return { label: "Continue Investigation", href: "/intake?resume=checkout" };
  return { label: "View status", href: `/investigations/${item.investigationId}` };
}

export function InvestigationWorkspace({ initialInvestigations }: { initialInvestigations: Investigation[] }) {
  const active = initialInvestigations.filter((item) => item.status !== "archived" && item.status !== "ready");
  return <ShadowScoreLayout><main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">Account</p><h1 className="mt-2 text-4xl font-black">Investigations</h1><p className="mt-3 max-w-2xl text-zinc-400">Resume active work and see the next action for each Business.</p></div>
      <Link href="/intake" className="rounded-xl bg-sky-400 px-5 py-3 font-black text-slate-950">Start Investigation</Link>
    </header>
    <nav className="mt-8 flex gap-3 border-b border-white/10 pb-4" aria-label="Account work"><Link className="font-bold text-white" href="/investigations" aria-current="page">Investigations</Link><Link className="text-zinc-400 hover:text-white" href="/archive">Archive</Link></nav>
    {active.length === 0 ? <section className="mt-8 rounded-3xl border border-white/10 bg-white/[.035] p-8"><h2 className="text-2xl font-black">No active Investigations</h2><p className="mt-3 text-zinc-400">Start free. Review the Business before the one-time $9.90 payment.</p><Link href="/intake" className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-black text-black">Start Investigation</Link></section> :
    <div className="mt-8 grid gap-4">{active.map((item) => { const next = action(item); return <article key={item.investigationId} className="rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:flex sm:items-center sm:justify-between"><div><h2 className="text-xl font-black">{item.target}</h2><dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm"><div><dt className="text-zinc-500">Investigation reference</dt><dd className="font-mono">{item.investigationId}</dd></div><div><dt className="text-zinc-500">Status</dt><dd>{customerStatus[item.status]}</dd></div><div><dt className="text-zinc-500">Updated</dt><dd>{new Date(item.updatedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</dd></div></dl></div><Link href={next.href} className="mt-5 inline-block rounded-xl bg-sky-400 px-4 py-3 font-bold text-slate-950 sm:mt-0">{next.label}</Link></article>; })}</div>}
  </main></ShadowScoreLayout>;
}
