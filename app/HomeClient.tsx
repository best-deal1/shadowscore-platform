"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShadowScoreLayout from "./components/ShadowScoreLayout";
import InvestigationTimeline from "./components/InvestigationTimeline";
import AuditMetadata from "./components/AuditMetadata";
import { useLocale } from "../components/LocaleProvider";

const evidenceEvents = [
  {
    time: "00:01",
    source: "Intake",
    text: "Supplier claims Example Signal Logistics and supplier-pay.test are the same operator",
    tone: "neutral",
    phase: "Evidence enters",
  },
  {
    time: "00:02",
    source: "Registry",
    text: "Operating name matches, beneficial owner is not disclosed",
    tone: "amber",
    phase: "Provider responds",
  },
  {
    time: "00:03",
    source: "Domain",
    text: "Reserved demo domain resolves to an older seller identity",
    tone: "green",
    phase: "Identity linked",
  },
  {
    time: "00:04",
    source: "Reputation",
    text: "Complaint cluster shares the payment alias used by the storefront",
    tone: "red",
    phase: "Relationship emerges",
  },
  {
    time: "00:06",
    source: "Document",
    text: "Invoice address conflicts with public filing address",
    tone: "red",
    phase: "Contradiction detected",
  },
];

const providerResponses = [
  { name: "Registry", finding: "Name match · owner unknown", tone: "amber" },
  { name: "Domain", finding: "Historical seller link", tone: "green" },
  { name: "Reputation", finding: "Alias overlap", tone: "red" },
  { name: "Document", finding: "Address conflict", tone: "red" },
];

const entityNodes = [
  {
    label: "Example Signal Logistics",
    className: "left-[31%] top-[8%]",
    kind: "Claimed subject",
    stage: "entity-node-0",
  },
  {
    label: "supplier-pay.test",
    className: "left-[5%] top-[39%]",
    kind: "Reserved domain",
    stage: "entity-node-1",
  },
  {
    label: "Example Holdings LLC",
    className: "right-[4%] top-[33%]",
    kind: "Fictional public entity",
    stage: "entity-node-2",
  },
  {
    label: "Payment alias",
    className: "left-[29%] bottom-[7%]",
    kind: "Identity",
    stage: "entity-node-3",
  },
  {
    label: "Filing address",
    className: "right-[13%] bottom-[10%]",
    kind: "Document fact",
    stage: "entity-node-4",
  },
];

const entityDetails: Record<string, { relationship: string; evidence: string; effect: string }> = {
  "Example Signal Logistics": { relationship: "Claimed subject in the submitted supplier record.", evidence: "Operating name supplied during intake.", effect: "Starts the identity-resolution review." },
  "supplier-pay.test": { relationship: "Payment domain connected to the claimed subject.", evidence: "Historical domain observation links it to an earlier seller identity.", effect: "Adds a corroborated identity link." },
  "Example Holdings LLC": { relationship: "Fictional registry record used in this example.", evidence: "Operating name matches. Beneficial owner is unavailable.", effect: "Leaves ownership unresolved." },
  "Payment alias": { relationship: "Alias shared by the storefront and complaint cluster.", evidence: "Reputation provider returned an overlapping payment alias.", effect: "Raises the relationship risk." },
  "Filing address": { relationship: "Address stated in a submitted invoice.", evidence: "The invoice address conflicts with the public filing address.", effect: "Creates a material contradiction." },
};

export default function HomeClient() {
  const router = useRouter();
  const { t } = useLocale();
  const [isOpening, setIsOpening] = useState(false);
  const [activeView, setActiveView] = useState<
    "investigation" | "monitoring" | "trust"
  >("investigation");
  const [selectedEntity, setSelectedEntity] = useState(entityNodes[0].label);
  const [expandedEvidence, setExpandedEvidence] = useState<number | null>(null);
  const [activityTick, setActivityTick] = useState(0);
  const [expandedReport, setExpandedReport] = useState<string | null>("Executive decision");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActivityTick((value) => value + 1), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const evidenceCount = 12 + (activityTick % 3);
  const confidence = 58 + (activityTick % 4) * 2;
  const activeAlert =
    activityTick % 2 === 0
      ? "Address conflict reviewed"
      : "Alias overlap confirmed";

  function startInvestigation() {
    if (isOpening) return;
    setIsOpening(true);
    window.setTimeout(() => router.push("/intake"), 450);
  }

  function moveView(current: typeof activeView, key: string) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
    const views: typeof activeView[] = ['investigation', 'monitoring', 'trust'];
    const index = views.indexOf(current);
    const next = key === 'Home' ? 0 : key === 'End' ? views.length - 1 : (index + (key === 'ArrowRight' ? 1 : -1) + views.length) % views.length;
    setActiveView(views[next]);
    window.requestAnimationFrame(() => document.getElementById(`${views[next]}-tab`)?.focus());
  }

  return (
    <ShadowScoreLayout>
      <section className="relative overflow-hidden px-5 py-10 sm:px-6 lg:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(251,191,36,0.12),transparent_28%),linear-gradient(180deg,rgba(10,10,10,0.05),#050505_82%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:min-h-[760px] lg:grid-cols-[0.86fr_1.14fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-sky-300/20 bg-sky-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-sky-100">
              {t.positioning.eyebrow}
            </div>
            <h1 className="max-w-5xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t.positioning.headline}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300 sm:text-xl">
              {t.positioning.description}
            </p>
            <p className="mt-4 max-w-3xl rounded-2xl border border-sky-300/20 bg-sky-500/10 px-5 py-4 text-sm font-bold leading-6 text-sky-50">
              One Business Investigation produces one Executive Report for a one-time price of $9.90. Starting is free.
            </p>
            <div className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">
                {t.home.analystAnswers}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {t.home.productJourney.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="text-sm font-black text-white">
                      {item.title}
                    </div>
                    <div className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-sky-100">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={startInvestigation}
                className="min-h-12 rounded-full bg-sky-600 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_0_34px_rgba(14,165,233,0.32)] transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {t.nav.start}
              </button>
              <a
                href="#interactive-demo"
                className="min-h-12 rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                View interactive demo
              </a>
            </div>
            {isOpening ? (
              <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-sm font-bold text-sky-100">
                {t.home.opening}
              </div>
            ) : null}
          </div>

          <div id="interactive-demo" className="rounded-[36px] border border-white/10 bg-zinc-950/90 p-4 shadow-[0_0_110px_rgba(14,165,233,0.14)] backdrop-blur-xl sm:p-5">
            <div className="investigation-console relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-5 sm:p-6">
              <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-100">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                    {t.home.running}
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-white">
                    Example Signal Logistics
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Illustrative workspace. {t.home.demoSubtitle}
                  </p>
                  <p className="mt-2 text-xs font-bold text-sky-100">
                    {evidenceCount} evidence items active. Latest update: {activeAlert}.
                  </p>
                </div>
                <div className="decision-card rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">
                    {t.home.recommendation}
                  </div>
                  <div className="decision-text mt-1 text-lg font-black text-white">
                    {t.home.recommendationValue}
                  </div>
                </div>
              </div>

              <div className="relative mt-5 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
                <div className="space-y-3">
                  {evidenceEvents.map((signal, index) => (
                    <button
                      type="button"
                      key={signal.text}
                      onClick={() => setExpandedEvidence(expandedEvidence === index ? null : index)}
                      aria-expanded={expandedEvidence === index}
                      className={`signal-card signal-card-${index} min-h-24 w-full rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                          {signal.time} · {signal.source}
                        </div>
                        <div
                          className={`h-2 w-2 rounded-full ${signal.tone === "red" ? "bg-red-400" : signal.tone === "amber" ? "bg-amber-300" : signal.tone === "green" ? "bg-emerald-300" : "bg-zinc-300"}`}
                        />
                      </div>
                      <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-100">
                        {signal.phase}
                      </div>
                      <p className="mt-1 text-sm font-bold leading-6 text-zinc-100">
                        {signal.text}
                      </p>
                      {expandedEvidence === index ? (
                        <p className="mt-3 border-t border-white/10 pt-3 text-start text-xs leading-5 text-sky-100">
                          Evidence recorded at {signal.time}. Select a relationship node to inspect how this finding changes the review.
                        </p>
                      ) : null}
                    </button>
                  ))}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/35 p-4">
                  <div className="mb-3 grid gap-2 sm:grid-cols-4">
                    {providerResponses.map((provider, index) => (
                      <div
                        key={provider.name}
                        className={`provider-chip provider-chip-${index} rounded-2xl border border-white/10 bg-zinc-950/80 p-3`}
                      >
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
                          {provider.name}
                        </div>
                        <div
                          className={`mt-1 text-[11px] font-black leading-4 ${provider.tone === "red" ? "text-red-100" : provider.tone === "amber" ? "text-amber-100" : "text-emerald-100"}`}
                        >
                          {provider.finding}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mb-3 grid gap-2 sm:hidden" aria-label="Relationship graph summary">
                    {entityNodes.map((node) => (
                      <button key={node.label} type="button" onClick={() => setSelectedEntity(node.label)} aria-pressed={selectedEntity === node.label} className="min-h-12 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-start text-xs font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                        <span className="text-zinc-500">{node.kind}: </span>{node.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative hidden h-[386px] overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.14),transparent_45%)] sm:block">
                    <div className="reasoning-question absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-black/70 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-zinc-200">
                      {t.home.discoveryQuestion}
                    </div>
                    <svg
                      className="absolute inset-0 h-full w-full opacity-80"
                      viewBox="0 0 520 386"
                      aria-hidden="true"
                    >
                      <path
                        className="link-line link-line-a"
                        d="M190 72 C118 130 98 165 84 190"
                      />
                      <path
                        className="link-line link-line-b"
                        d="M238 78 C325 126 398 140 448 166"
                      />
                      <path
                        className="link-line link-line-c"
                        d="M98 216 C180 266 216 315 238 330"
                      />
                      <path
                        className="link-line link-line-d"
                        d="M430 190 C370 245 326 288 280 326"
                      />
                      <path
                        className="link-line link-line-e contradiction-line"
                        d="M428 210 C426 276 400 318 360 336"
                      />
                    </svg>
                    {entityNodes.map((node) => (
                      <button
                        type="button"
                        key={node.label}
                        onClick={() => setSelectedEntity(node.label)}
                        aria-pressed={selectedEntity === node.label}
                        className={`entity-node ${node.stage} absolute ${node.className} max-w-[190px] rounded-2xl border border-white/10 bg-zinc-950/95 p-3 text-start shadow-[0_0_28px_rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300`}
                      >
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
                          {node.kind}
                        </div>
                        <div className="mt-1 text-xs font-black leading-5 text-white">
                          {node.label}
                        </div>
                      </button>
                    ))}
                    <button type="button" aria-label={`Confidence: ${confidence}% supported. Confidence reflects corroborated links, unresolved ownership, and contradictory address evidence.`} className="confidence-ring absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-300/25 bg-red-500/10 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-red-100">
                          {t.home.confidence}
                        </div>
                        <div className="confidence-state mt-1 text-sm font-black text-white">
                          {confidence}% supported
                        </div>
                      </div>
                    </button>
                  </div>
                  <aside className="mt-3 rounded-2xl border border-sky-300/20 bg-sky-500/[0.07] p-4" aria-live="polite">
                    <div className="flex items-center justify-between gap-3">
                      <span className="ui-label text-sky-100">Relationship detail</span>
                      <span className="evidence-value text-xs text-sky-200">{evidenceCount} evidence items</span>
                    </div>
                    <h3 className="mt-2 text-sm font-black text-white">{selectedEntity}</h3>
                    <p className="mt-1 text-xs leading-5 text-zinc-300">{entityDetails[selectedEntity].relationship}</p>
                    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      <div><dt className="text-zinc-500">Evidence</dt><dd className="mt-1 text-zinc-200">{entityDetails[selectedEntity].evidence}</dd></div>
                      <div><dt className="text-zinc-500">Review effect</dt><dd className="mt-1 text-zinc-200">{entityDetails[selectedEntity].effect}</dd></div>
                    </dl>
                  </aside>
                </div>
              </div>

              <div className="relative mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {t.home.reasoningSteps.map((step, index) => (
                  <div
                    key={step.label}
                    className={`reasoning-step reasoning-step-${index} rounded-2xl border border-white/10 bg-black/35 p-4`}
                  >
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      {step.status}
                    </div>
                    <div className="mt-2 text-sm font-black text-white">
                      {step.label}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-zinc-400">
                      {step.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6" aria-labelledby="marketplace-risk-title">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <div className="ui-label text-sky-200">Marketplace risk intelligence</div>
              <h2 id="marketplace-risk-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Risk moves across the marketplace before it appears in one record.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300">Supplier identity, payment exposure, fulfillment behavior, and reputation signals often change independently. ShadowScore keeps their relationships visible during review.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Identity", "Supplier and ownership claims"],
                ["Payment", "Aliases and payout exposure"],
                ["Fulfillment", "Delivery and reputation signals"],
              ].map(([title, copy], index) => (
                <article key={title} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="evidence-value text-sm text-sky-300">0{index + 1}</div>
                  <h3 className="mt-6 text-lg font-black text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{copy}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["Identity fraud", "Supplier verification", "Payment exposure", "Delivery manipulation", "Reputation abuse", "Marketplace enforcement"].map((risk, index) => (
              <div key={risk} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <span className={`h-2 w-2 rounded-full ${index > 3 ? "bg-amber-300" : "bg-sky-300"}`} />
                <span className="text-sm font-bold text-zinc-200">{risk}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6" aria-labelledby="graph-title">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-white/10 bg-zinc-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-9">
          <div className="max-w-2xl">
            <div className="ui-label text-sky-200">Intelligence graph</div>
            <h2 id="graph-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">A decision is stronger when the relationships are visible.</h2>
            <p className="mt-4 text-base leading-7 text-zinc-400">The graph correlates evidence across the entities involved in a marketplace transaction. It makes shared identifiers, gaps, and contradictions reviewable.</p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-4 lg:grid-cols-8">
            {["Supplier", "Company", "Domain", "Marketplace", "Payment", "Tracking", "Evidence", "Decision"].map((node, index, nodes) => (
              <div key={node} className="relative">
                <div className={`rounded-2xl border p-4 text-center text-sm font-black ${index === nodes.length - 1 ? "border-amber-300/40 bg-amber-400/10 text-amber-100" : "border-sky-300/20 bg-sky-500/[0.08] text-white"}`}>{node}</div>
                {index < nodes.length - 1 ? <span className="mx-auto my-2 block h-5 w-px bg-sky-300/40 md:absolute md:-end-3 md:top-1/2 md:my-0 md:h-px md:w-6" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
            <p className="text-sm leading-6 text-zinc-400"><span className="font-black text-white">Connected:</span> Shared payment and domain identifiers can establish a relationship.</p>
            <p className="text-sm leading-6 text-zinc-400"><span className="font-black text-white">Unresolved:</span> Missing ownership data remains visible as an evidence gap.</p>
            <p className="text-sm leading-6 text-zinc-400"><span className="font-black text-white">Contradictory:</span> Conflicting addresses influence the review, not the source record.</p>
          </div>
        </div>
      </section>

      <section className="px-5 pb-4 sm:px-6" aria-label="Example audit record">
        <div className="mx-auto max-w-7xl">
          <AuditMetadata
            compact
            createdAt="2026-07-19T09:01:00Z"
            completedAt="2026-07-19T09:06:00Z"
            engineVersion="Insight Engine v1.0"
            policyVersion="Trust Policy v1.0"
            sources={[
              "Registry record",
              "Domain observation",
              "Submitted document",
            ]}
          />
          <div className="mt-5">
            <InvestigationTimeline
              title={t.audit.timeline}
              items={evidenceEvents.map((event) => ({
                title: t.home.phases[evidenceEvents.indexOf(event)],
                description: event.text,
                evidenceSource: event.source,
                status: event.tone === "red" ? t.audit.risk : t.audit.recorded,
                timestamp: `2026-07-19T09:${event.time.slice(-2)}:00Z`,
                risk: event.tone === "red",
              }))}
            />
          </div>
        </div>
      </section>

      <section
        className="px-5 py-14 sm:px-6"
        aria-label={t.home.executiveEyebrow}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="text-xs font-black uppercase tracking-[0.28em] text-sky-200">
                {t.home.executiveEyebrow}
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
                {t.home.executiveTitle}
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-300">
                {t.home.executiveCopy}
              </p>
            </div>
            <div
              className="grid grid-cols-3 rounded-2xl border border-white/10 bg-black/35 p-1 sm:flex"
              role="tablist"
              aria-label={t.home.analystAnswers}
            >
              {(["investigation", "monitoring", "trust"] as const).map(
                (view, index) => {
                  const labels = [
                    t.nav.investigations,
                    t.nav.monitoring,
                    t.home.trustEyebrow,
                  ];
                  return (
                    <button
                      key={view}
                      type="button"
                      role="tab"
                      id={`${view}-tab`}
                      aria-controls={`${view}-panel`}
                      aria-selected={activeView === view}
                      onClick={() => setActiveView(view)}
                      onKeyDown={(event) => moveView(view, event.key)}
                      className={`min-h-11 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-[0.08em] transition focus:outline-none focus:ring-2 focus:ring-sky-300 sm:px-3 sm:tracking-[0.14em] ${activeView === view ? "bg-sky-400 text-zinc-950" : "text-zinc-400 hover:text-white"}`}
                    >
                      {labels[index]}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-[36px] border border-white/10 bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.025] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300" />
                <span className="ui-label text-zinc-300">
                  {activeView === "monitoring"
                    ? t.nav.monitoring
                    : activeView === "trust"
                      ? t.home.trustTitle
                      : t.nav.investigations}
                </span>
              </div>
              <div className="evidence-value text-xs text-zinc-500">
                SS-2048 · {t.home.running}
              </div>
            </div>

            {activeView === "investigation" ? (
              <div id="investigation-panel" role="tabpanel" aria-labelledby="investigation-tab" className="grid lg:grid-cols-[0.72fr_1.28fr]">
                <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
                  <div className="ui-label">{t.home.analystAnswers}</div>
                  <div className="mt-4 space-y-3">
                    {t.home.executiveQuestions
                      .slice(0, 4)
                      .map((item, index) => (
                        <div
                          key={item.question}
                          className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-sky-300/30"
                        >
                          <div className="flex items-start gap-3">
                            <span className="evidence-value mt-0.5 text-xs text-sky-300">
                              0{index + 1}
                            </span>
                            <div>
                              <h3 className="text-sm font-black text-white">
                                {item.question}
                              </h3>
                              <p className="mt-1 text-xs leading-5 text-zinc-400">
                                {item.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="ui-label">{t.home.discoveryQuestion}</div>
                    <span className="risk-status">{t.audit.risk}</span>
                  </div>
                  <div className="investigation-radar relative mt-4 hidden h-[360px] overflow-hidden rounded-[26px] border border-white/10 bg-black sm:block">
                    <div className="radar-sweep absolute inset-0" />
                    <div className="absolute left-[16%] top-[17%] rounded-full border border-sky-300/50 bg-sky-400/10 px-4 py-3 text-xs font-black text-sky-100">
                      supplier-pay.test
                    </div>
                    <div className="absolute right-[12%] top-[25%] rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-3 text-xs font-black text-amber-100">
                      {t.home.productJourney[0].title}
                    </div>
                    <div className="absolute bottom-[18%] left-[23%] rounded-full border border-red-300/50 bg-red-500/10 px-4 py-3 text-xs font-black text-red-100">
                      {t.home.reasoningSteps[3].label}
                    </div>
                    <div className="absolute bottom-[14%] right-[14%] rounded-full border border-white/20 bg-white/[0.08] px-4 py-3 text-xs font-black text-white">
                      {t.home.productJourney[1].title}
                    </div>
                    <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-red-400/50 bg-red-500/10 text-center shadow-[0_0_50px_rgba(248,113,113,0.14)]">
                      <span className="ui-label text-red-100">
                        {t.home.confidence}
                      </span>
                      <strong className="mt-2 text-xl text-white">62%</strong>
                      <span className="mt-1 text-xs font-bold text-red-100">
                        {t.home.confidenceValue}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 rounded-[26px] border border-white/10 bg-black/50 p-4 sm:hidden">
                    <div className="ui-label">{t.home.discoveryQuestion}</div>
                    <div className="mt-4 grid gap-2">
                      {["supplier-pay.test", t.home.productJourney[0].title, t.home.reasoningSteps[3].label, t.home.productJourney[1].title].map((label) => <div key={label} className="rounded-xl border border-white/10 px-3 py-3 text-xs font-black text-zinc-100">{label}</div>)}
                    </div>
                    <div className="mt-4 rounded-2xl border border-red-400/50 bg-red-500/10 p-4 text-center"><span className="ui-label text-red-100">{t.home.confidence}</span><strong className="mt-2 block text-xl text-white">62%</strong><span className="mt-1 block text-xs font-bold text-red-100">{t.home.confidenceValue}</span></div>
                  </div>
                </div>
              </div>
            ) : activeView === "monitoring" ? (
              <div id="monitoring-panel" role="tabpanel" aria-labelledby="monitoring-tab" className="grid gap-5 p-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[26px] border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="ui-label">{t.nav.monitoring}</div>
                      <h3 className="mt-2 text-xl font-black text-white">
                        {t.home.productJourney[2].title}
                      </h3>
                    </div>
                    <span className="audit-status">{t.home.running}</span>
                  </div>
                  <div className="mt-7 grid grid-cols-7 items-end gap-2 h-36">
                    {[31, 48, 38, 64, 47, 82, 59].map((height, index) => (
                      <div key={height} className="group flex h-full items-end">
                        <div
                          style={{ height: `${height}%` }}
                          className={`w-full rounded-t-md ${index === 5 ? "bg-red-400" : "bg-sky-400/70"}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between evidence-value text-[10px] text-zinc-500">
                    <span>07.14</span>
                    <span>07.20</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {t.home.reasoningSteps.slice(2).map((step, index) => (
                    <div
                      key={step.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="text-sm font-black text-white">
                          {step.label}
                        </span>
                        <span
                          className={
                            index === 1 ? "risk-status" : "audit-status"
                          }
                        >
                          {step.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-zinc-400">
                        {step.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div id="trust-panel" role="tabpanel" aria-labelledby="trust-tab" className="grid gap-5 p-5 lg:grid-cols-3">
                {t.home.trustSignals.map((signal, index) => (
                  <article
                    key={signal}
                    className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.025] p-6"
                  >
                    <div className="absolute right-5 top-4 evidence-value text-4xl text-white/5">
                      0{index + 1}
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${index === 2 ? "bg-red-400" : "bg-emerald-300"}`}
                    />
                    <h3 className="mt-8 text-lg font-black text-white">
                      {signal}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {t.home.scenarios[index]}
                    </p>
                    <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full ${index === 2 ? "w-[46%] bg-red-400" : "w-[78%] bg-emerald-300"}`}
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-6" aria-label={t.home.journeyEyebrow}>
        <div className="mx-auto max-w-7xl border-s border-white/15 ps-5 sm:ps-8">
          <div className="ui-label text-sky-200">{t.home.journeyEyebrow}</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {t.home.productJourney.map((item, index) => (
              <article
                key={item.title}
                className="relative border-t border-white/15 pt-5"
              >
                <span className="absolute -start-[1.72rem] -top-1.5 h-3 w-3 rounded-full border-2 border-black bg-sky-300 sm:-start-[2.47rem]" />
                <div className="evidence-value text-xs text-sky-300">
                  0{index + 1} / 03
                </div>
                <h3 className="mt-3 text-lg font-black text-white">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="px-5 py-16 sm:px-6" aria-labelledby="report-title">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <div className="ui-label text-sky-200">Example report</div>
            <h2 id="report-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">A report records how the decision was reached.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300">This illustrative preview separates evidence, confidence, and recommended next steps so reviewers can audit the decision.</p>
            <Link href="/example-report" className="mt-7 inline-flex rounded-full border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08]">View example report</Link>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-3">
            {["Executive decision", "Evidence summary", "Confidence and gaps", "Recommended actions"].map((section, index) => {
              const open = expandedReport === section;
              const details = ["Hold payment release pending verified ownership and address evidence.", "Five findings connect the claimed supplier, historic domain, payment alias, and submitted invoice.", "Corroborated identity links are present. Beneficial ownership remains unresolved.", "Request the registration record, confirm the filing address, and monitor the payment alias."];
              return <div key={section} className="border-b border-white/10 last:border-0">
                <button type="button" onClick={() => setExpandedReport(open ? null : section)} aria-expanded={open} aria-controls={`report-section-${index}`} className="flex min-h-14 w-full items-center justify-between gap-4 p-5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300">
                  <span><span className="evidence-value me-3 text-xs text-sky-300">0{index + 1}</span><span className="text-sm font-black text-white">{section}</span></span>
                  <span className="text-lg text-zinc-500">{open ? "−" : "+"}</span>
                </button>
                {open ? <p id={`report-section-${index}`} className="px-5 pb-5 ps-12 text-sm leading-6 text-zinc-400">{details[index]}</p> : null}
              </div>;
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6" aria-labelledby="method-title">
        <div className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-gradient-to-br from-sky-500/[0.09] via-zinc-950 to-zinc-950 p-7 sm:p-10">
          <div className="max-w-2xl"><div className="ui-label text-sky-200">Investigation methodology</div><h2 id="method-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">A consistent path from intake to action.</h2></div>
          <ol className="mt-10 grid gap-3 md:grid-cols-3 lg:grid-cols-6">{["Intake", "Evidence collection", "Correlation", "Confidence", "Risk assessment", "Recommendations"].map((step, index) => <li key={step} className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="evidence-value text-xs text-sky-300">0{index + 1}</div><div className="mt-7 text-sm font-black text-white">{step}</div></li>)}</ol>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6" aria-labelledby="platform-title">
        <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><div className="ui-label text-sky-200">Connected platform</div><h2 id="platform-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">One operating picture for marketplace risk.</h2></div>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Investigations", "Review evidence and document decisions."], ["Monitoring", "Track changes after the initial review."], ["Reports", "Share a reviewable decision record."], ["Alerts", "Surface new evidence and risk changes."], ["Workspace", "Keep investigations organized by team."], ["API", "Connect risk intelligence to existing systems."], ["Collaboration", "Give reviewers shared evidence context."], ["Trust controls", "Apply consistent methods to each review."]].map(([title, copy]) => <article key={title} className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5"><h3 className="text-base font-black text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{copy}</p></article>)}</div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6" aria-labelledby="trust-title"><div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3"><div className="rounded-[30px] border border-white/10 bg-zinc-950 p-7 lg:col-span-1"><div className="ui-label text-sky-200">Trust and security</div><h2 id="trust-title" className="mt-4 text-3xl font-black tracking-tight text-white">Built for reviewable risk work.</h2><p className="mt-4 text-sm leading-6 text-zinc-400">The platform is designed to preserve evidence context, clearly distinguish confidence from fact, and support responsible investigation workflows.</p><Link href="/security" className="mt-6 inline-block text-sm font-black text-sky-200 hover:text-white">Visit Trust Center →</Link></div><div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">{["Evidence-first methodology", "Privacy-aware handling", "Security controls", "Responsible AI", "Compliance roadmap", "Auditable records"].map((item, index) => <div key={item} className="rounded-[30px] border border-white/10 bg-white/[0.025] p-6"><div className="evidence-value text-xs text-sky-300">0{index + 1}</div><h3 className="mt-8 text-base font-black text-white">{item}</h3></div>)}</div></div></section>

      <section className="px-5 py-16 sm:px-6" aria-labelledby="industries-title"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="ui-label text-sky-200">Industries</div><h2 id="industries-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Marketplace risk has many operating contexts.</h2></div><p className="max-w-md text-sm leading-6 text-zinc-400">Use the same relationship-first approach across seller, marketplace, brand, and financial-services workflows.</p></div><div className="mt-8 flex flex-wrap gap-3">{["Amazon sellers", "TikTok Shop", "Walmart", "eBay", "Shopify", "Brands", "Financial services"].map((industry) => <span key={industry} className="rounded-full border border-white/10 bg-white/[0.025] px-5 py-3 text-sm font-bold text-zinc-200">{industry}</span>)}</div></div></section>

      <section className="px-5 py-16 sm:px-6" aria-labelledby="resources-title"><div className="mx-auto max-w-7xl border-y border-white/10 py-10"><div className="ui-label text-sky-200">Research and resources</div><h2 id="resources-title" className="mt-4 text-3xl font-black tracking-tight text-white">Practical context for marketplace risk teams.</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{[["Marketplace intelligence", "How relationship signals support supplier review."], ["Risk reports", "A decision record teams can revisit and share."], ["Research", "Patterns, enforcement changes, and operating guidance."]].map(([title, copy]) => <article key={title} className="border-t border-white/15 pt-5"><h3 className="text-base font-black text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{copy}</p><span className="mt-5 inline-block text-sm font-black text-sky-200">Coming soon</span></article>)}</div></div></section>

      <section className="px-5 pb-16 pt-8 sm:px-6"><div className="mx-auto max-w-7xl overflow-hidden rounded-[38px] border border-sky-300/20 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.22),transparent_28%),linear-gradient(135deg,#082f49,#09090b_62%)] p-6 sm:p-12"><div className="max-w-3xl"><div className="ui-label text-sky-100">Start with the evidence</div><h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Make the next marketplace decision with a clearer record.</h2><p className="mt-5 text-base leading-7 text-sky-50/75">Open an investigation, review an example report, or talk through your team&apos;s workflow.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={startInvestigation} className="min-h-12 rounded-full bg-sky-300 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Start investigation</button><Link href="/contact" className="min-h-12 rounded-full border border-white/20 px-6 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Book demo</Link><Link href="/example-report" className="min-h-12 rounded-full border border-white/20 px-6 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">View report</Link></div></div></div></section>

      <p className="mx-auto max-w-7xl px-5 pb-12 text-xs leading-6 text-zinc-500 sm:px-6">
        {t.positioning.disclaimer}
      </p>
    </ShadowScoreLayout>
  );
}
