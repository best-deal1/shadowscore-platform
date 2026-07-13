"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ShadowScoreLayout from "./components/ShadowScoreLayout";

const investigationSteps = [
  "Identifying target",
  "Checking infrastructure",
  "Resolving business identity",
  "Collecting evidence",
  "Correlating independent sources",
  "Preparing recommendation",
];

const outcomes = [
  {
    label: "PASS",
    short: "Proceed",
    copy: "Independent evidence aligns and no confirmed negative indicators were found.",
    accent: "#22c55e",
    glow: "rgba(34,197,94,0.34)",
    surface: "rgba(34,197,94,0.10)",
  },
  {
    label: "REVIEW",
    short: "Verify",
    copy: "Useful evidence exists, but material identity or coverage gaps remain.",
    accent: "#f59e0b",
    glow: "rgba(245,158,11,0.34)",
    surface: "rgba(245,158,11,0.10)",
  },
  {
    label: "CONFIRMED RISK",
    short: "Stop",
    copy: "Verified negative evidence should materially change how you proceed.",
    accent: "#ef4444",
    glow: "rgba(239,68,68,0.38)",
    surface: "rgba(239,68,68,0.10)",
  },
];

const proofPoints = [
  ["Evidence first", "Every conclusion is tied to observable provider evidence."],
  ["Missing is not risk", "Unavailable data lowers confidence without becoming a negative signal."],
  ["Explainable decisions", "The report shows what was found, what is missing and what to do next."],
];

const useCases = [
  ["Business investigation", "Check a company, website or supplier before paying, partnering or proceeding."],
  ["Marketplace identity", "Review seller, store, payout and platform identity signals in one evidence trail."],
  ["Evidence review", "Validate notices, screenshots, invoices, tracking and account documents."],
  ["Continuous monitoring", "Track material changes after the first investigation and preserve decision history."],
];

export default function Home() {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeOutcome, setActiveOutcome] = useState(0);

  useEffect(() => {
    if (isInvestigating) return;
    const interval = window.setInterval(() => {
      setActiveOutcome((current) => (current + 1) % outcomes.length);
    }, 3200);
    return () => window.clearInterval(interval);
  }, [isInvestigating]);

  function startInvestigation(nextTarget = target) {
    if (isInvestigating) return;
    const normalizedTarget = nextTarget.trim();
    setTarget(normalizedTarget);
    setIsInvestigating(true);
    const query = normalizedTarget ? `?target=${encodeURIComponent(normalizedTarget)}&mode=website` : "";
    window.setTimeout(() => router.push(`/intake${query}`), 1700);
  }

  const active = outcomes[activeOutcome];

  return (
    <ShadowScoreLayout>
      <div className="relative overflow-hidden bg-[#050505]">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="shadow-grid absolute inset-0" />
          <div
            className="shadow-orb-a absolute -left-[18%] -top-[25%] h-[70vw] w-[70vw] rounded-full blur-[120px] transition-colors duration-1000"
            style={{ background: active.glow }}
          />
          <div
            className="shadow-orb-b absolute -bottom-[35%] -right-[22%] h-[68vw] w-[68vw] rounded-full blur-[140px] transition-colors duration-1000"
            style={{ background: `color-mix(in srgb, ${active.accent} 65%, #2563eb 35%)` }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.22)_46%,rgba(0,0,0,0.88)_100%)]" />
        </div>

        <section className="relative z-10 px-5 pb-20 pt-16 sm:px-6 lg:pb-28 lg:pt-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-5xl text-center">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-zinc-200 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full" style={{ background: active.accent, boxShadow: `0 0 18px ${active.accent}` }} />
                Trust intelligence for digital business identity
              </div>

              <h1 className="text-balance text-4xl font-black tracking-[-0.045em] text-white sm:text-6xl lg:text-[78px] lg:leading-[0.98]">
                Know who you are dealing with
                <span className="block bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">before you proceed.</span>
              </h1>

              <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-zinc-300 sm:text-xl">
                ShadowScore connects identity, infrastructure, public evidence and verified risk signals into one clear, explainable recommendation.
              </p>

              <div className="mx-auto mt-11 max-w-5xl rounded-[36px] border border-white/12 bg-black/60 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.72)] backdrop-blur-2xl sm:p-5">
                <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/[0.055] p-3 sm:flex-row">
                  <input
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && startInvestigation()}
                    className="min-h-16 flex-1 rounded-2xl border border-white/10 bg-white px-5 text-lg font-black text-zinc-950 outline-none placeholder:font-bold placeholder:text-zinc-500 focus:ring-4 sm:min-h-20 sm:px-7 sm:text-2xl"
                    style={{ boxShadow: `inset 0 0 0 1px ${active.glow}` }}
                    placeholder="Website, company, email, phone or seller..."
                    aria-label="Investigation target"
                  />
                  <button
                    onClick={() => startInvestigation()}
                    className="min-h-16 rounded-2xl px-8 text-sm font-black uppercase tracking-[0.14em] text-white transition duration-300 hover:-translate-y-0.5 sm:min-h-20"
                    style={{ background: active.accent, boxShadow: `0 0 42px ${active.glow}` }}
                  >
                    Start Investigation
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {outcomes.map((outcome, index) => {
                    const selected = index === activeOutcome;
                    return (
                      <button
                        key={outcome.label}
                        type="button"
                        onMouseEnter={() => setActiveOutcome(index)}
                        onFocus={() => setActiveOutcome(index)}
                        onClick={() => setActiveOutcome(index)}
                        className="rounded-2xl border p-4 text-left transition duration-500"
                        style={{
                          borderColor: selected ? outcome.accent : "rgba(255,255,255,0.10)",
                          background: selected ? outcome.surface : "rgba(255,255,255,0.025)",
                          boxShadow: selected ? `0 0 28px ${outcome.glow}` : "none",
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xl font-black text-white">{outcome.label}</span>
                          <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: outcome.accent, background: outcome.surface }}>{outcome.short}</span>
                        </div>
                        <div className="mt-2 text-sm font-medium leading-6 text-zinc-400">{outcome.copy}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-bold text-zinc-400">
                <span>No upload required for website checks</span>
                <span className="hidden h-1 w-1 rounded-full bg-zinc-600 sm:block" />
                <span>Private investigation workflow</span>
                <span className="hidden h-1 w-1 rounded-full bg-zinc-600 sm:block" />
                <span>Source-backed evidence trail</span>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 border-y border-white/10 bg-black/35 px-5 py-8 backdrop-blur-xl sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
            {proofPoints.map(([title, copy], index) => (
              <div key={title} className="flex gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-sm font-black" style={{ color: outcomes[index].accent }}>0{index + 1}</div>
                <div>
                  <h2 className="font-black text-white">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10 px-5 py-24 sm:px-6 lg:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.86fr_1.14fr]">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-red-300">How it works</div>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">From one target to a decision-ready investigation.</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">The product does not treat every missing field as danger. It separates what was verified, what could not be checked and what was actually confirmed as negative.</p>

              <div className="mt-9 space-y-4">
                {[
                  ["Enter a target", "Website, company, email, phone or marketplace identity."],
                  ["Collect and correlate evidence", "Providers resolve infrastructure, identity and public business context."],
                  ["Receive an explainable recommendation", "PASS, REVIEW or CONFIRMED RISK with reasons and next actions."],
                ].map(([title, copy], index) => (
                  <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-black">{index + 1}</div>
                    <div>
                      <h3 className="font-black text-white">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-white/12 bg-[#0a0a0b]/90 p-5 shadow-[0_35px_100px_rgba(0,0,0,0.66)] sm:p-7">
              <div className="shadow-scan-line pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent" />
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Investigation preview</div>
                  <div className="mt-2 text-2xl font-black text-white">business.example</div>
                </div>
                <div className="rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-200">Review</div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  ["8", "Verified signals"],
                  ["3", "Evidence gaps"],
                  ["0", "Confirmed risks"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="text-3xl font-black text-white">{value}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black text-white">Identity resolution</span>
                  <span className="text-xs font-black text-emerald-300">Strong</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[84%] rounded-full bg-emerald-400" /></div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">Domain, website identity and business email evidence align. Public ownership context should still be verified for a high-value commitment.</p>
              </div>

              <div className="mt-4 grid gap-3">
                {[
                  ["Domain infrastructure", "Verified", "text-emerald-300"],
                  ["Business identity", "Partially verified", "text-orange-300"],
                  ["Negative evidence", "None confirmed", "text-zinc-300"],
                ].map(([label, value, tone]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-black/40 px-4 py-3 text-sm">
                    <span className="font-bold text-zinc-400">{label}</span>
                    <span className={`font-black ${tone}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 pb-24 sm:px-6 lg:pb-32">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-red-300">Built for real decisions</div>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">One evidence engine, multiple investigation paths.</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {useCases.map(([title, copy], index) => (
                <div key={title} className="group rounded-[28px] border border-white/10 bg-white/[0.035] p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-black/50 text-sm font-black text-zinc-300">0{index + 1}</div>
                    <span className="text-xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white">→</span>
                  </div>
                  <h3 className="mt-8 text-2xl font-black text-white">{title}</h3>
                  <p className="mt-3 max-w-xl leading-7 text-zinc-400">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 pb-24 sm:px-6 lg:pb-32">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[38px] border border-white/12 bg-white/[0.055] p-8 backdrop-blur-xl sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-3xl">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Ready for a clearer decision?</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Investigate the identity, not just the domain.</h2>
              <p className="mt-4 text-lg leading-8 text-zinc-400">Start with a free direction check. Unlock the complete source trail and action plan when the decision matters.</p>
            </div>
            <button
              onClick={() => startInvestigation()}
              className="mt-8 min-h-14 shrink-0 rounded-full bg-white px-7 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 lg:mt-0"
            >
              Start Investigation
            </button>
          </div>
        </section>

        {isInvestigating && (
          <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 px-5 backdrop-blur-xl">
            <div className="w-full max-w-xl rounded-[32px] border border-white/12 bg-[#0a0a0b] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-red-300">Investigation in progress</div>
                  <div className="mt-2 max-w-md truncate text-xl font-black text-white">{target || "Preparing investigation"}</div>
                </div>
                <div className="h-3 w-3 animate-pulse rounded-full bg-red-500 shadow-[0_0_22px_rgba(239,68,68,0.8)]" />
              </div>
              <div className="mt-7 space-y-3">
                {investigationSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.035] px-4 py-3 text-sm font-bold text-zinc-200">
                    <span className="grid h-7 w-7 place-items-center rounded-full border border-red-300/30 bg-red-500/15 text-xs text-red-100">{index + 1}</span>
                    <span className="animate-pulse" style={{ animationDelay: `${index * 120}ms` }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ShadowScoreLayout>
  );
}
