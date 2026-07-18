"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShadowScoreLayout from "./components/ShadowScoreLayout";

const liveSignals = [
  { time: "00:01", source: "Registry", text: "Operating name matches, ownership missing", tone: "amber" },
  { time: "00:02", source: "Domain", text: "New storefront points to older seller identity", tone: "green" },
  { time: "00:04", source: "Reputation", text: "Complaint cluster overlaps payment alias", tone: "red" },
  { time: "00:06", source: "Document", text: "Invoice address conflicts with public filing", tone: "red" },
];

const entityNodes = [
  { label: "Northwind Logistics", className: "left-[33%] top-[10%]", kind: "Subject" },
  { label: "northwind-pay.com", className: "left-[7%] top-[38%]", kind: "Domain" },
  { label: "N. W. Holdings", className: "right-[5%] top-[34%]", kind: "Entity" },
  { label: "Payment alias", className: "left-[30%] bottom-[7%]", kind: "Identity" },
];

const reasoningSteps = [
  { label: "Signals received", value: "4 evidence streams", status: "ingesting" },
  { label: "Identities linked", value: "Domain ↔ alias ↔ entity", status: "correlating" },
  { label: "Contradiction found", value: "Address claim conflicts", status: "detected" },
  { label: "Decision emerging", value: "Verify before commitment", status: "ready" },
];

const productJourney = [
  {
    title: "Homepage",
    label: "6–8 second live preview",
    copy: "A miniature investigation shows evidence entering the system, connections forming, contradictions surfacing, and a recommendation beginning to emerge.",
  },
  {
    title: "Start Investigation",
    label: "Complete reasoning journey",
    copy: "The intake expands the preview into structured evidence collection, entity resolution, confidence recalculation, and analyst-grade reasoning.",
  },
  {
    title: "Report",
    label: "Conclusion and evidence",
    copy: "The final report separates verified facts, conflicts, unknowns, and the decision your team can defend.",
  },
];

const trustSignals = [
  "Evidence structure separated from interpretation",
  "Identity verification trail summarized",
  "Contradictions highlighted for leadership",
  "Executive recommendation clearly stated",
];

const coveredScenarios = [
  "Vendor or seller onboarding",
  "Payment hold and payout disputes",
  "Suspicious websites or domains",
  "Executive escalation prep",
  "Marketplace trust reviews",
  "Identity and ownership claims",
];

export default function HomeClient() {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);

  function startInvestigation() {
    if (isOpening) return;
    setIsOpening(true);
    window.setTimeout(() => router.push("/intake"), 450);
  }

  return (
    <ShadowScoreLayout>
      <section className="relative overflow-hidden px-5 py-10 sm:px-6 lg:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(220,38,38,0.24),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(251,191,36,0.12),transparent_28%),linear-gradient(180deg,rgba(10,10,10,0.05),#050505_82%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:min-h-[760px] lg:grid-cols-[0.86fr_1.14fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-red-300/20 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-red-100">Live intelligence system</div>
            <h1 className="max-w-5xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Watch evidence become a decision.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300 sm:text-xl">ShadowScore does not just give a score. It investigates, correlates, explains, and decides—turning scattered identity, entity, reputation, and document signals into a defensible risk position.</p>
            <div className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">Product language</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {productJourney.map((item) => (
                  <div key={item.title} className="rounded-3xl border border-white/10 bg-black/30 p-4">
                    <div className="text-sm font-black text-white">{item.title}</div>
                    <div className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-red-100">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={startInvestigation} className="rounded-full bg-red-600 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_0_34px_rgba(220,38,38,0.4)] transition hover:bg-red-500">Start investigation</button>
              <a href="/example-report" className="rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08]">View report</a>
            </div>
            {isOpening ? <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">Opening full investigation intake…</div> : null}
          </div>

          <div className="rounded-[36px] border border-white/10 bg-zinc-950/90 p-4 shadow-[0_0_110px_rgba(220,38,38,0.18)] backdrop-blur-xl sm:p-5">
            <div className="investigation-console relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-5 sm:p-6">
              <div className="scanline" />
              <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-100"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />Investigation running</div>
                  <h2 className="mt-3 text-2xl font-black text-white">Northwind Logistics</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">Live preview · supplier commitment review</p>
                </div>
                <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">Emerging decision</div>
                  <div className="mt-1 text-lg font-black text-white">Verify first</div>
                </div>
              </div>

              <div className="relative mt-5 grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
                <div className="space-y-3">
                  {liveSignals.map((signal, index) => (
                    <div key={signal.text} className={`signal-card signal-card-${index} rounded-2xl border border-white/10 bg-white/[0.045] p-4`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{signal.time} · {signal.source}</div>
                        <div className={`h-2 w-2 rounded-full ${signal.tone === "red" ? "bg-red-400" : signal.tone === "amber" ? "bg-amber-300" : "bg-emerald-300"}`} />
                      </div>
                      <p className="mt-2 text-sm font-bold leading-6 text-zinc-100">{signal.text}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/35 p-4">
                  <div className="relative h-[360px] overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.14),transparent_45%)]">
                    <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 520 360" aria-hidden="true">
                      <path className="link-line link-line-a" d="M192 72 C120 126 98 158 86 178" />
                      <path className="link-line link-line-b" d="M240 78 C326 126 398 136 445 160" />
                      <path className="link-line link-line-c" d="M100 205 C184 255 216 292 238 306" />
                      <path className="link-line link-line-d contradiction-line" d="M430 190 C352 246 312 280 266 306" />
                    </svg>
                    {entityNodes.map((node) => (
                      <div key={node.label} className={`entity-node absolute ${node.className} max-w-[190px] rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-[0_0_28px_rgba(255,255,255,0.06)]`}>
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">{node.kind}</div>
                        <div className="mt-1 text-xs font-black leading-5 text-white">{node.label}</div>
                      </div>
                    ))}
                    <div className="confidence-ring absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-300/25 bg-red-500/10 text-center">
                      <div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-red-100">Confidence</div><div className="mt-1 text-sm font-black text-white">recalculating</div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mt-4 grid gap-3 sm:grid-cols-4">
                {reasoningSteps.map((step, index) => (
                  <div key={step.label} className={`reasoning-step reasoning-step-${index} rounded-2xl border border-white/10 bg-black/35 p-4`}>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{step.status}</div>
                    <div className="mt-2 text-sm font-black text-white">{step.label}</div>
                    <div className="mt-1 text-xs leading-5 text-zinc-400">{step.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6" aria-label="Product journey">
        <div className="mx-auto max-w-7xl rounded-[40px] border border-white/10 bg-white/[0.035] p-6 sm:p-10">
          <div className="max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">One intelligence journey</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">The homepage preview, investigation flow, and report now feel like the same system.</h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {productJourney.map((item) => (
              <div key={item.title} className="rounded-[32px] border border-white/10 bg-black/35 p-7">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-red-100">{item.label}</div>
                <h3 className="mt-4 text-xl font-black text-white">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6" aria-label="Trust signals">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[40px] border border-white/10 bg-gradient-to-br from-red-950/35 to-zinc-950 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Why teams can act faster</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Not a score pasted onto a dashboard. A reasoning trail that reaches a decision.</h2>
            <p className="mt-5 text-base leading-7 text-zinc-300">ShadowScore is designed for moments when a digital identity, business, seller, or counterparty is asking for trust before your organization has enough confidence.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustSignals.map((signal) => <div key={signal} className="rounded-3xl border border-white/10 bg-black/35 p-5 text-sm font-black leading-6 text-white">{signal}</div>)}
            {coveredScenarios.map((scenario) => <div key={scenario} className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm font-black text-white">{scenario}</div>)}
          </div>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
