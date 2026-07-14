"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShadowScoreLayout from "./components/ShadowScoreLayout";

const investigationTargets = [
  "Digital businesses and websites",
  "Marketplace sellers and storefronts",
  "Payment, payout and account disputes",
  "Emails, phones, domains and identity claims",
];

const journeySteps = [
  {
    step: "01",
    title: "Tell us what needs to be trusted",
    copy: "Submit a website, company, seller profile, email, phone number or dispute context in a guided intake built for non-technical teams.",
  },
  {
    step: "02",
    title: "ShadowScore investigates the public footprint",
    copy: "We examine identity consistency, ownership signals, web presence, reputation indicators and evidence that helps explain risk in business terms.",
  },
  {
    step: "03",
    title: "Receive a decision-ready report",
    copy: "Your report summarizes what was verified, what looks inconsistent, why it matters and which next action is safest.",
  },
];

const evidencePillars = [
  "Source-backed findings",
  "Structured audit trail",
  "Risk narrative for operators",
  "Clear confidence language",
];

export default function HomeClient() {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [isInvestigating, setIsInvestigating] = useState(false);

  function startInvestigation(nextTarget = target) {
    if (isInvestigating) return;
    const normalizedTarget = nextTarget.trim();
    setTarget(normalizedTarget);
    setIsInvestigating(true);
    const query = normalizedTarget ? `?target=${encodeURIComponent(normalizedTarget)}&mode=website` : "";
    window.setTimeout(() => router.push(`/intake${query}`), 550);
  }

  return (
    <ShadowScoreLayout>
      <section className="relative overflow-hidden px-5 py-16 sm:px-6 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.28),transparent_32%),radial-gradient(circle_at_12%_35%,rgba(251,146,60,0.13),transparent_24%),linear-gradient(180deg,rgba(24,24,27,0),#050505_88%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-100">Digital Trust Intelligence</div>
            <h1 className="max-w-5xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Know who you are dealing with before trust becomes exposure.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300 sm:text-xl">ShadowScore investigates digital business identities, seller footprints and online trust signals so teams can make faster, evidence-backed decisions before onboarding, paying, escalating or engaging.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => startInvestigation()} className="rounded-full bg-red-600 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_0_34px_rgba(220,38,38,0.4)] transition hover:bg-red-500">Start an investigation</button>
              <a href="#how-it-works" className="rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08]">See how it works</a>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                ["Use case", "Pre-transaction trust review"],
                ["Output", "Decision-ready intelligence report"],
                ["Audience", "Operators, founders and risk teams"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{label}</div>
                  <div className="mt-3 text-sm font-black leading-6 text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-white/10 bg-zinc-950/85 p-4 shadow-[0_0_90px_rgba(220,38,38,0.2)] backdrop-blur-xl sm:p-6">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6">
              <div className="text-xs font-black uppercase tracking-[0.26em] text-red-200">Start with a target</div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">Enter anything you need to validate. The technical investigation workspace opens after intake begins.</p>
              <div className="mt-6 space-y-3">
                <input value={target} onChange={(event) => setTarget(event.target.value)} onKeyDown={(event) => event.key === "Enter" && startInvestigation()} className="min-h-16 w-full rounded-2xl border border-white/10 bg-white px-5 text-lg font-black text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-red-300 focus:ring-4 focus:ring-red-500/25" placeholder="Website, company, email, phone or seller..." aria-label="Investigation target" />
                <button onClick={() => startInvestigation()} className="min-h-14 w-full rounded-2xl bg-red-600 px-8 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-red-500">Investigate</button>
              </div>
              {isInvestigating ? <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">Opening secure investigation intake…</div> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6" aria-label="What ShadowScore investigates">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">What it investigates</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">A trust layer for the moments when a digital identity asks you to take action.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {investigationTargets.map((item) => <div key={item} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-lg font-black leading-7 text-white">{item}</div>)}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-5 py-16 sm:px-6" aria-label="How investigations work">
        <div className="mx-auto max-w-7xl rounded-[40px] border border-white/10 bg-white/[0.035] p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">How it works</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">From question to evidence-backed decision.</h2>
              <p className="mt-5 text-base leading-7 text-zinc-300">The landing experience stays focused on outcomes. Once an investigation starts, ShadowScore opens the technical workspace, evidence trail and report generation flow.</p>
            </div>
            <div className="space-y-4">
              {journeySteps.map((item) => (
                <div key={item.step} className="rounded-[28px] border border-white/10 bg-black/35 p-6">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-red-200">{item.step}</div>
                  <h3 className="mt-3 text-xl font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6" aria-label="Trustworthy evidence">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[36px] border border-white/10 bg-gradient-to-br from-red-950/40 to-zinc-950 p-8 sm:p-10">
            <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Why it matters</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Trust decisions are now operational risk decisions.</h2>
            <p className="mt-5 text-base leading-7 text-zinc-300">A convincing digital presence can hide identity gaps, weak reputation signals, dispute risk or inconsistent claims. ShadowScore turns scattered public signals into a clear risk narrative before your team commits time, money or access.</p>
          </div>
          <div className="rounded-[36px] border border-white/10 bg-white/[0.035] p-8 sm:p-10">
            <div className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Evidence you can defend</div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {evidencePillars.map((pillar) => <div key={pillar} className="rounded-2xl border border-white/10 bg-black/35 p-5 text-sm font-black text-white">{pillar}</div>)}
            </div>
            <p className="mt-6 text-sm leading-6 text-zinc-400">Reports separate observations, risk interpretation and recommended action, making the result useful for founders, support teams, investigators and risk stakeholders.</p>
          </div>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
