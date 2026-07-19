"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShadowScoreLayout from "./components/ShadowScoreLayout";
import InvestigationTimeline from "./components/InvestigationTimeline";
import AuditMetadata from "./components/AuditMetadata";

const evidenceEvents = [
  { time: "00:01", source: "Intake", text: "Supplier claims Example Signal Logistics and supplier-pay.test are the same operator", tone: "neutral", phase: "Evidence enters" },
  { time: "00:02", source: "Registry", text: "Operating name matches, beneficial owner is not disclosed", tone: "amber", phase: "Provider responds" },
  { time: "00:03", source: "Domain", text: "Reserved demo domain resolves to an older seller identity", tone: "green", phase: "Identity linked" },
  { time: "00:04", source: "Reputation", text: "Complaint cluster shares the payment alias used by the storefront", tone: "red", phase: "Relationship emerges" },
  { time: "00:06", source: "Document", text: "Invoice address conflicts with public filing address", tone: "red", phase: "Contradiction detected" },
];

const providerResponses = [
  { name: "Registry", finding: "Name match · owner unknown", tone: "amber" },
  { name: "Domain", finding: "Historical seller link", tone: "green" },
  { name: "Reputation", finding: "Alias overlap", tone: "red" },
  { name: "Document", finding: "Address conflict", tone: "red" },
];

const entityNodes = [
  { label: "Example Signal Logistics", className: "left-[31%] top-[8%]", kind: "Claimed subject", stage: "entity-node-0" },
  { label: "supplier-pay.test", className: "left-[5%] top-[39%]", kind: "Reserved domain", stage: "entity-node-1" },
  { label: "Example Holdings LLC", className: "right-[4%] top-[33%]", kind: "Fictional public entity", stage: "entity-node-2" },
  { label: "Payment alias", className: "left-[29%] bottom-[7%]", kind: "Identity", stage: "entity-node-3" },
  { label: "Filing address", className: "right-[13%] bottom-[10%]", kind: "Document fact", stage: "entity-node-4" },
];

const reasoningSteps = [
  { label: "Evidence received", value: "Claim, domain, filing, payment alias", status: "ingesting" },
  { label: "Providers checked", value: "Independent responses disagree", status: "verifying" },
  { label: "Entities connected", value: "Domain ↔ alias ↔ complaint cluster", status: "correlating" },
  { label: "Contradiction found", value: "Invoice address conflicts with filing", status: "explaining" },
  { label: "Recommendation changed", value: "Verify ownership before commitment", status: "recommending" },
];

const productJourney = [
  {
    title: "Identify the organization",
    label: "Who are you dealing with?",
    copy: "Identify the trading name, legal entity, parent, brands, operating country and related identities.",
  },
  {
    title: "Corroborate the evidence",
    label: "Can it be verified?",
    copy: "Compare independent sources. Surface contradictions instead of treating a domain check as a conclusion.",
  },
  {
    title: "Protect the decision",
    label: "What should we actually do?",
    copy: "Get a recommendation and the evidence to request before money, access or reputation is at risk.",
  },
];

const executiveQuestions = [
  ["01", "Who am I actually dealing with?", "Legal entity, trading name, ownership, country, industry and related brands."],
  ["02", "Can this organization be verified?", "Independent sources corroborate the identity or identify a gap."],
  ["03", "Should I trust them?", "Trust depends on corroborating evidence, not a credible-looking website."],
  ["04", "What could go wrong?", "Prioritize material contradictions, negative events and unverified payment identities."],
  ["05", "What should we actually do?", "A recommendation that reduces the cost of a wrong decision."],
];

const trustSignals = [
  "Evidence separated from interpretation",
  "Identity verification trail",
  "Contradictions for leadership",
  "Clear executive recommendation",
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(251,191,36,0.12),transparent_28%),linear-gradient(180deg,rgba(10,10,10,0.05),#050505_82%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:min-h-[760px] lg:grid-cols-[0.86fr_1.14fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-sky-300/20 bg-sky-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-sky-100">Business due diligence</div>
            <h1 className="max-w-5xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Business trust starts with evidence.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300 sm:text-xl">ShadowScore investigates the organization behind a claim. It compares independent evidence, identifies conflicts and recommends the next action.</p>
            <div className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">What your analyst answers</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {productJourney.map((item) => (
                  <div key={item.title} className="rounded-3xl border border-white/10 bg-black/30 p-4">
                    <div className="text-sm font-black text-white">{item.title}</div>
                    <div className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-sky-100">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={startInvestigation} className="rounded-full bg-sky-600 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_0_34px_rgba(14,165,233,0.32)] transition hover:bg-sky-500">Investigate</button>
              <a href="/example-report" className="rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08]">View example</a>
            </div>
            {isOpening ? <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-sm font-bold text-sky-100">Opening investigation intake…</div> : null}
          </div>

          <div className="rounded-[36px] border border-white/10 bg-zinc-950/90 p-4 shadow-[0_0_110px_rgba(14,165,233,0.14)] backdrop-blur-xl sm:p-5">
            <div className="investigation-console relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-5 sm:p-6">
              <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-100"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />Investigation running</div>
                  <h2 className="mt-3 text-2xl font-black text-white">Example Signal Logistics</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">Fictional demo · supplier commitment review</p>
                </div>
                <div className="decision-card rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">Recommendation</div>
                  <div className="decision-text mt-1 text-lg font-black text-white">Recommendation updated → Verify ownership before commitment</div>
                </div>
              </div>

              <div className="relative mt-5 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
                <div className="space-y-3">
                  {evidenceEvents.map((signal, index) => (
                    <div key={signal.text} className={`signal-card signal-card-${index} rounded-2xl border border-white/10 bg-white/[0.045] p-4`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{signal.time} · {signal.source}</div>
                        <div className={`h-2 w-2 rounded-full ${signal.tone === "red" ? "bg-red-400" : signal.tone === "amber" ? "bg-amber-300" : signal.tone === "green" ? "bg-emerald-300" : "bg-zinc-300"}`} />
                      </div>
                      <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-100">{signal.phase}</div>
                      <p className="mt-1 text-sm font-bold leading-6 text-zinc-100">{signal.text}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/35 p-4">
                  <div className="mb-3 grid gap-2 sm:grid-cols-4">
                    {providerResponses.map((provider, index) => (
                      <div key={provider.name} className={`provider-chip provider-chip-${index} rounded-2xl border border-white/10 bg-zinc-950/80 p-3`}>
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">{provider.name}</div>
                        <div className={`mt-1 text-[11px] font-black leading-4 ${provider.tone === "red" ? "text-red-100" : provider.tone === "amber" ? "text-amber-100" : "text-emerald-100"}`}>{provider.finding}</div>
                      </div>
                    ))}
                  </div>
                  <div className="relative h-[386px] overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.14),transparent_45%)]">
                    <div className="reasoning-question absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-black/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200">What is ShadowScore discovering?</div>
                    <svg className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 520 386" aria-hidden="true">
                      <path className="link-line link-line-a" d="M190 72 C118 130 98 165 84 190" />
                      <path className="link-line link-line-b" d="M238 78 C325 126 398 140 448 166" />
                      <path className="link-line link-line-c" d="M98 216 C180 266 216 315 238 330" />
                      <path className="link-line link-line-d" d="M430 190 C370 245 326 288 280 326" />
                      <path className="link-line link-line-e contradiction-line" d="M428 210 C426 276 400 318 360 336" />
                    </svg>
                    {entityNodes.map((node) => (
                      <div key={node.label} className={`entity-node ${node.stage} absolute ${node.className} max-w-[190px] rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-[0_0_28px_rgba(255,255,255,0.06)]`}>
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">{node.kind}</div>
                        <div className="mt-1 text-xs font-black leading-5 text-white">{node.label}</div>
                      </div>
                    ))}
                    <div className="confidence-ring absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-300/25 bg-red-500/10 text-center">
                      <div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-red-100">Confidence</div><div className="confidence-state mt-1 text-sm font-black text-white">lowered by contradiction</div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mt-4 grid gap-3 sm:grid-cols-5">
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

      <section className="px-5 pb-4 sm:px-6" aria-label="Example audit record">
        <div className="mx-auto max-w-7xl">
          <AuditMetadata compact createdAt="2026-07-19T09:01:00Z" completedAt="2026-07-19T09:06:00Z" engineVersion="Insight Engine v1.0" policyVersion="Trust Policy v1.0" sources={["Registry record", "Domain observation", "Submitted document"]} />
          <div className="mt-5"><InvestigationTimeline title="Example investigation timeline" items={evidenceEvents.map((event) => ({ title: event.phase, description: event.text, evidenceSource: event.source, status: event.tone === "red" ? "Risk identified" : "Recorded", timestamp: `2026-07-19T09:${event.time.slice(-2)}:00Z`, risk: event.tone === "red" }))} /></div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6" aria-label="Executive due diligence questions">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.28em] text-sky-200">Executive due diligence</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Five questions. One defensible business decision.</h2>
            <p className="mt-5 text-base leading-7 text-zinc-300">Technical observations support the evidence. The investigation answers the questions a buyer, risk leader or investment committee needs answered.</p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-5">
            {executiveQuestions.map(([number, question, detail]) => (
              <article key={number} className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
                <div className="text-xs font-black tracking-[0.22em] text-sky-200">{number}</div>
                <h3 className="mt-5 text-lg font-black leading-6 text-white">{question}</h3>
                <p className="mt-4 text-sm leading-6 text-zinc-400">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6" aria-label="Product journey">
        <div className="mx-auto max-w-7xl rounded-[40px] border border-white/10 bg-white/[0.035] p-6 sm:p-10">
          <div className="max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.28em] text-sky-200">One intelligence journey</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Each investigation creates evidence for the next decision.</h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {productJourney.map((item) => (
              <div key={item.title} className="rounded-[32px] border border-white/10 bg-black/35 p-7">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-sky-100">{item.label}</div>
                <h3 className="mt-4 text-xl font-black text-white">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6" aria-label="Trust signals">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[40px] border border-white/10 bg-gradient-to-br from-slate-900 to-zinc-950 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-sky-200">Evidence for action</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">A reasoning trail for each business decision.</h2>
            <p className="mt-5 text-base leading-7 text-zinc-300">Use ShadowScore when a digital identity, business, seller or counterparty requires a trust decision before the evidence is complete.</p>
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
