"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShadowScoreLayout from "./components/ShadowScoreLayout";

const briefingFindings = [
  {
    label: "Identity confidence",
    value: "High friction",
    detail: "Ownership, marketplace, and domain claims do not resolve cleanly to one operator.",
  },
  {
    label: "Research time saved",
    value: "Hours",
    detail: "Public footprint review, reputation context, and contradiction mapping organized into one briefing.",
  },
  {
    label: "Recommended action",
    value: "Pause and verify",
    detail: "Request authoritative proof before payout, onboarding, shipment, access, or escalation.",
  },
];

const trustSignals = [
  "Decision memo, not raw telemetry",
  "Source trail separated from interpretation",
  "Plain-English risk language for leadership",
  "Next action clearly stated",
];

const briefingSections = [
  {
    title: "What changed since your team started looking",
    copy: "ShadowScore turns scattered public signals into a concise timeline of identity claims, reputation indicators, ownership clues, and dispute context.",
  },
  {
    title: "What leadership needs to know now",
    copy: "The report highlights the few facts that change the decision: what is verified, what conflicts, what remains unknown, and where exposure increases.",
  },
  {
    title: "What to do next",
    copy: "Every briefing ends with a defensible recommendation so teams can approve, pause, escalate, or request evidence without another internal research cycle.",
  },
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
      <section className="relative overflow-hidden px-5 py-14 sm:px-6 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(220,38,38,0.22),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(251,191,36,0.12),transparent_25%),linear-gradient(180deg,rgba(10,10,10,0.05),#050505_82%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-amber-200/20 bg-amber-200/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-amber-100">Executive intelligence briefing</div>
            <h1 className="max-w-5xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Know the risk before your team commits time, funds, or trust.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300 sm:text-xl">ShadowScore compresses digital identity investigation into a decision-ready briefing: what is verified, what conflicts, what remains unknown, and what to do next.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Built for", "Operators, risk leads, finance teams"],
                ["Delivered as", "Executive decision memo"],
                ["Focus", "Trust, exposure, next action"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{label}</div>
                  <div className="mt-3 text-sm font-black leading-6 text-white">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button onClick={startInvestigation} className="rounded-full bg-red-600 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_0_34px_rgba(220,38,38,0.4)] transition hover:bg-red-500">Start a briefing</button>
              <a href="/example-report" className="rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08]">View sample report</a>
            </div>
            {isOpening ? <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">Opening secure briefing intake…</div> : null}
          </div>

          <div className="rounded-[36px] border border-white/10 bg-zinc-950/90 p-4 shadow-[0_0_90px_rgba(220,38,38,0.18)] backdrop-blur-xl sm:p-6">
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.025] p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Briefing snapshot</div>
                  <h2 className="mt-3 text-2xl font-black text-white">Acme Seller Review</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">Prepared for payout approval meeting</p>
                </div>
                <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">Decision</div>
                  <div className="mt-1 text-lg font-black text-white">Pause</div>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {briefingFindings.map((finding) => (
                  <div key={finding.label} className="rounded-3xl border border-white/10 bg-black/35 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{finding.label}</div>
                      <div className="text-sm font-black text-red-100">{finding.value}</div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">{finding.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-5">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100">Executive answer</div>
                <p className="mt-3 text-sm leading-6 text-emerald-50">You can enter the meeting with a documented risk position instead of asking the team to keep searching.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6" aria-label="Trust signals">
        <div className="mx-auto max-w-7xl rounded-[40px] border border-white/10 bg-white/[0.035] p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Why customers trust it quickly</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">No raw dashboard maze. No scattered research notes. Just a briefing your team can act on.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {trustSignals.map((signal) => <div key={signal} className="rounded-3xl border border-white/10 bg-black/35 p-5 text-sm font-black leading-6 text-white">{signal}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6" aria-label="Briefing structure">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Inside every briefing</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">The investigation is already organized around the decision.</h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {briefingSections.map((section) => (
              <div key={section.title} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-7">
                <h3 className="text-xl font-black text-white">{section.title}</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{section.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6" aria-label="Covered scenarios">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[40px] border border-white/10 bg-gradient-to-br from-red-950/35 to-zinc-950 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Use it before the costly decision</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">When uncertainty reaches leadership, bring the briefing.</h2>
            <p className="mt-5 text-base leading-7 text-zinc-300">ShadowScore is designed for moments when a digital identity, business, seller, or counterparty is asking for trust before your organization has enough confidence.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {coveredScenarios.map((scenario) => <div key={scenario} className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm font-black text-white">{scenario}</div>)}
          </div>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
