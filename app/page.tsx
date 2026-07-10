"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShadowScoreLayout from "./components/ShadowScoreLayout";

const investigationSteps = [
  "Identifying target",
  "Checking infrastructure",
  "Resolving business identity",
  "Collecting evidence",
  "Building investigation",
  "Preparing report",
];

const outcomes = [
  { label: "PASS", tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100", copy: "Evidence supports proceeding" },
  { label: "REVIEW", tone: "border-orange-400/30 bg-orange-500/10 text-orange-100", copy: "Additional verification recommended" },
  { label: "CONFIRMED RISK", tone: "border-red-400/30 bg-red-500/10 text-red-100", copy: "Verified negative indicators detected" },
];

export default function Home() {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [isInvestigating, setIsInvestigating] = useState(false);

  function startInvestigation(nextTarget = target) {
    if (isInvestigating) return;
    const normalizedTarget = nextTarget.trim();
    setTarget(normalizedTarget);
    setIsInvestigating(true);
    const query = normalizedTarget ? `?target=${encodeURIComponent(normalizedTarget)}&mode=website` : "";
    window.setTimeout(() => router.push(`/intake${query}`), 1700);
  }

  return (
    <ShadowScoreLayout>
      <section className="relative overflow-hidden px-5 py-14 sm:px-6 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(220,38,38,0.28),transparent_34%),radial-gradient(circle_at_15%_70%,rgba(251,146,60,0.12),transparent_28%),linear-gradient(180deg,rgba(127,29,29,0.1),transparent_55%)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-180px)] max-w-7xl flex-col items-center justify-center text-center">
          <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-100">
            Digital business identity intelligence
          </div>
          <h1 className="max-w-5xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            Investigate a digital business identity before you proceed.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300 sm:text-xl">
            ShadowScore separates verified signals from evidence gaps and confirmed risks, then produces an evidence-backed PASS, REVIEW or CONFIRMED RISK recommendation.
          </p>

          <div className="mt-10 w-full max-w-5xl rounded-[36px] border border-white/10 bg-zinc-950/85 p-4 shadow-[0_0_90px_rgba(220,38,38,0.24)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/[0.06] p-3 sm:flex-row">
              <input
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && startInvestigation()}
                className="min-h-16 flex-1 rounded-2xl border border-white/10 bg-white px-5 text-lg font-black text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-red-300 focus:ring-4 focus:ring-red-500/25 sm:min-h-20 sm:px-7 sm:text-2xl"
                placeholder="Website, company, email, phone or marketplace seller..."
                aria-label="Investigation target"
              />
              <button
                onClick={() => startInvestigation()}
                className="min-h-16 rounded-2xl bg-red-600 px-8 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_0_34px_rgba(220,38,38,0.4)] transition hover:bg-red-500 sm:min-h-20"
              >
                Start Investigation
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {outcomes.map((outcome) => (
                <div key={outcome.label} className={`rounded-2xl border p-4 text-left ${outcome.tone}`}>
                  <div className="text-2xl font-black">{outcome.label}</div>
                  <div className="mt-1 text-sm font-bold opacity-80">{outcome.copy}</div>
                </div>
              ))}
            </div>
          </div>


          <section className="mt-16 grid gap-5 text-left md:grid-cols-3" aria-label="Core value proposition">
            {[
              ["Verified signals", "Evidence that supports business identity, ownership, operational presence or transaction confidence."],
              ["Evidence gaps", "Important facts that were not verified, not checked or unavailable from current providers."],
              ["Confirmed risks", "Verified negative indicators that should change how you proceed."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                <h2 className="text-xl font-black text-white">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{body}</p>
              </div>
            ))}
          </section>

          <section className="mt-10 grid gap-5 text-left lg:grid-cols-3" aria-label="How ShadowScore works">
            {[
              ["How ShadowScore works", "Submit a website, business name, email, phone number or seller identity. ShadowScore organizes the evidence into a decision-ready investigation."],
              ["What ShadowScore verifies", "Business identity, public presence, available infrastructure signals, seller context and user-provided evidence are separated by verification state."],
              ["Why ShadowScore is different", "The product does not pretend missing data is trust. It distinguishes Verified, Not verified, Not checked and Provider unavailable states."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-3xl border border-red-400/20 bg-red-500/[0.055] p-6">
                <h2 className="text-xl font-black text-white">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{body}</p>
              </div>
            ))}
          </section>

          <section className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.035] p-8">
            <h2 className="text-3xl font-black">Ready to verify a digital business identity?</h2>
            <p className="mt-3 text-zinc-400">Start with an investigation preview, then unlock the complete evidence hierarchy when you need the full report.</p>
            <button onClick={() => startInvestigation()} className="mt-6 rounded-full bg-red-600 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-red-500">Start Investigation</button>
          </section>

          {isInvestigating && (
            <div className="mt-6 w-full max-w-3xl rounded-3xl border border-white/10 bg-black/70 p-5 text-left shadow-2xl shadow-red-950/20">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-red-200">Investigation in progress</div>
              <div className="mt-5 space-y-3">
                {investigationSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 text-sm font-bold text-zinc-200 sm:text-base">
                    <span className="grid h-7 w-7 place-items-center rounded-full border border-red-300/30 bg-red-500/15 text-red-100">{index + 1}</span>
                    <span className="animate-pulse" style={{ animationDelay: `${index * 120}ms` }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
