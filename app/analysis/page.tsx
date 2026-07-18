"use client";

import Link from "next/link";

const evidenceSources = [
  { label: "Tracking events", state: "Collected", x: "8%", y: "16%" },
  { label: "Payout notes", state: "Matched", x: "17%", y: "72%" },
  { label: "Order cadence", state: "Normalized", x: "35%", y: "34%" },
  { label: "Refund traces", state: "Correlated", x: "58%", y: "78%" },
  { label: "Policy language", state: "Compared", x: "72%", y: "25%" },
  { label: "Identity signals", state: "Resolved", x: "88%", y: "58%" },
];

const investigationSteps = [
  "Collecting marketplace artifacts",
  "Resolving seller identity graph",
  "Correlating cross-source contradictions",
  "Reconstructing evidence timeline",
  "Testing enforcement similarity",
  "Explaining confidence path",
];

const timeline = [
  ["T-18d", "First fulfillment drift appears"],
  ["T-11d", "Tracking proof weakens against order volume"],
  ["T-6d", "Refund + payout language begins to overlap"],
  ["Now", "Signals converge into elevated exposure"],
];

const graphNodes = [
  ["Seller account", "top-[15%] left-[38%] border-red-300/50 bg-red-500/15"],
  ["Storefront", "top-[42%] left-[8%] border-white/15 bg-white/[0.05]"],
  ["Carrier trail", "top-[66%] left-[30%] border-white/15 bg-white/[0.05]"],
  ["Payout rail", "top-[48%] right-[8%] border-white/15 bg-white/[0.05]"],
  ["Buyer events", "top-[72%] right-[24%] border-white/15 bg-white/[0.05]"],
];

export default function AnalysisPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030305] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.22),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(248,113,113,0.12),transparent_28%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:64px_64px]" />

      <header className="relative z-10 border-b border-white/10 bg-black/70 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl justify-between">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back to ShadowScore</Link>
          <Link href="/report" className="text-sm font-bold text-red-300 hover:text-red-200">Generate Report</Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <div className="text-xs uppercase tracking-[0.48em] text-red-300">Trust Intelligence Live</div>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] md:text-7xl">
            Watch the AI investigator reason through the evidence.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            ShadowScore exposes the investigation path: what was collected, which sources corroborated each other, how identities connect, and why confidence rises before the conclusion is rendered.
          </p>
        </div>

        <div className="relative min-h-[360px] rounded-[36px] border border-red-300/20 bg-white/[0.035] p-6 shadow-2xl shadow-red-950/30 backdrop-blur-xl">
          <div className="absolute inset-0 rounded-[36px] bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.18),transparent_38%)]" />
          <div className="relative flex items-center justify-between text-xs uppercase tracking-[0.28em] text-zinc-500">
            <span>Investigation Flow</span><span className="text-red-200">Reasoning</span>
          </div>
          <div className="relative mt-5 h-[285px] overflow-hidden rounded-[28px] border border-white/10 bg-black/55">
            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-300/40 bg-red-500/15 shadow-[0_0_90px_rgba(248,113,113,0.45)]" />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-200" />
            {evidenceSources.map((source, index) => (
              <div key={source.label} className="absolute" style={{ left: source.x, top: source.y }}>
                <div className="h-px w-36 origin-left animate-pulse bg-gradient-to-r from-red-300/70 to-transparent" />
                <div className="-mt-3 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 shadow-xl backdrop-blur">
                  <div className="text-sm font-bold">{source.label}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-red-200">{source.state}</div>
                </div>
                <span className="absolute -right-2 -top-2 h-3 w-3 animate-ping rounded-full bg-red-300" style={{ animationDelay: `${index * 240}ms` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-6 px-6 pb-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
          <div className="text-xs uppercase tracking-[0.34em] text-red-300">Confidence Reasoning</div>
          <div className="mt-7 space-y-5">
            {investigationSteps.map((step, index) => (
              <div key={step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-red-300/30 bg-red-500/10 text-sm font-bold text-red-100">{index + 1}</div>
                  {index < investigationSteps.length - 1 && <div className="h-10 w-px bg-gradient-to-b from-red-300/60 to-white/10" />}
                </div>
                <div>
                  <div className="font-semibold">{step}</div>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">Evidence is not accepted alone; it must survive source overlap, timing consistency, and identity-resolution checks.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="relative min-h-[310px] overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <div className="text-xs uppercase tracking-[0.34em] text-red-300">Identity Graph + Relationship Mapping</div>
            <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 600 310" aria-hidden="true">
              <path d="M300 80 L110 155 L230 230 L485 170 L405 235 L300 80" fill="none" stroke="rgba(248,113,113,.38)" strokeWidth="1.5" strokeDasharray="7 7" />
              <path d="M110 155 L485 170 M230 230 L405 235" stroke="rgba(255,255,255,.16)" strokeWidth="1" />
            </svg>
            {graphNodes.map(([node, classes]) => <div key={node} className={`absolute rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl ${classes}`}>{node}</div>)}
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
            <div className="text-xs uppercase tracking-[0.34em] text-red-300">Evidence Timeline</div>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {timeline.map(([time, event]) => (
                <div key={time} className="relative border-t border-red-300/40 pt-4">
                  <span className="absolute -top-1.5 left-0 h-3 w-3 rounded-full bg-red-300 shadow-[0_0_24px_rgba(248,113,113,0.8)]" />
                  <div className="font-black text-red-100">{time}</div>
                  <div className="mt-2 text-sm leading-6 text-zinc-400">{event}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
