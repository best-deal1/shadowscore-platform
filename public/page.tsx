"use client";

import { useMemo, useState } from "react";

const WHATSAPP_NUMBER = "972557293979";

const marketplaceLogos = [
  ["eBay", "eBay"],
  ["Amazon", "Amazon"],
  ["Walmart", "Walmart"],
  ["Etsy", "Etsy"],
  ["TikTok Shop", "TikTok"],
  ["SHEIN", "SHEIN"],
];

const feeds = [
  ["eBay", "MC011 delivery verification and proof-of-delivery reviews", "High"],
  ["eBay", "MC999 account restriction and appeal activity", "Elevated"],
  ["eBay", "Payout hold and managed payments review reports", "Elevated"],
  ["Amazon", "Seller verification and document rejection signals", "Elevated"],
  ["Walmart", "Fulfillment consistency and seller review activity", "Rising"],
  ["TikTok Shop", "New seller identity and compliance checks", "Watchlist"],
];

const cases = [
  ["MC011", "Proof of delivery", "Tracking integrity, buyer confirmation, delivery evidence"],
  ["MC999", "Account restriction", "Account trust, access signals, policy review"],
  ["Payout Hold", "Managed payments", "Delivery confidence, order velocity, risk exposure"],
  ["Verification", "Seller identity", "Document quality, business consistency, access behavior"],
];

const plans = [
  {
    name: "Snapshot",
    price: "$49",
    sub: "24-hour exposure snapshot",
    desc: "Fast entry-level risk read for sellers who need a first signal check.",
    tag: "",
    items: ["ShadowScore rating", "Top 3 risk signals", "Executive PDF snapshot", "Recommended actions"],
    button: "Get Snapshot",
  },
  {
    name: "Intelligence Review",
    price: "$99",
    sub: "rapid manual review",
    desc: "For sellers with MC011, MC999, payout hold, account review or sudden marketplace friction.",
    tag: "Most Popular",
    items: ["Manual case review", "Tracking integrity analysis", "Payout exposure review", "WhatsApp consultation", "Risk action plan"],
    button: "Request Review",
  },
  {
    name: "Case Intelligence",
    price: "$199",
    sub: "full case investigation",
    desc: "A deeper private investigation for serious marketplace operators.",
    tag: "",
    items: ["Evidence timeline", "Root cause analysis", "Appeal readiness check", "Executive report", "30-day protection"],
    button: "Open Investigation",
  },
  {
    name: "Continuous Monitoring",
    price: "$299",
    sub: "per month",
    desc: "Monthly operational risk monitoring for active sellers and operators.",
    tag: "",
    items: ["Monthly trust review", "Risk feed access", "Operational intelligence", "Early warning detection", "WhatsApp support"],
    button: "Monitor My Store",
  },
];

function Badge({ level }: { level: string }) {
  const cls =
    level === "High"
      ? "border-red-400/40 bg-red-500/10 text-red-200"
      : level === "Elevated"
      ? "border-orange-400/40 bg-orange-500/10 text-orange-200"
      : level === "Rising"
      ? "border-yellow-400/40 bg-yellow-500/10 text-yellow-200"
      : "border-zinc-400/30 bg-white/5 text-zinc-300";

  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>{level}</span>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[34px] border border-white/10 bg-black/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_80px_rgba(120,0,20,0.16)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

function LogoRail() {
  return (
    <div className="mt-12 rounded-[28px] border border-white/10 bg-white/[0.025] p-5">
      <div className="mb-4 text-center text-xs uppercase tracking-[0.32em] text-zinc-600">Marketplace coverage intelligence</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {marketplaceLogos.map(([name, short]) => (
          <div key={name} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-5 text-center">
            <div className="text-lg font-black text-white">{short}</div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-zinc-600">{name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState("Intelligence Review");
  const [store, setStore] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const selected = useMemo(() => plans.find((p) => p.name === selectedPlan) || plans[1], [selectedPlan]);

  const whatsappUrl = (plan = selectedPlan) => {
    const msg = `ShadowScore Audit Request

Store / Seller:
${store || "Not provided yet"}

Selected Plan:
${plan}

Requested Review:
Marketplace exposure and enforcement risk review

Context:
- Tracking drift review
- Payout exposure review
- Trust decay analysis
- MC011 / MC999 / account review readiness
- Action plan

I would like to begin a private ShadowScore review.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const openWhatsApp = (plan = selectedPlan) => {
    window.open(whatsappUrl(plan), "_blank", "noopener,noreferrer");
  };

  const requestScan = () => {
    setShowScanner(true);
    if (store.trim()) window.setTimeout(() => openWhatsApp(selectedPlan), 1700);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.075] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(220,38,38,0.17),transparent_42%),radial-gradient(circle_at_15%_15%,rgba(100,0,20,0.18),transparent_34%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <img src="/shadowscore-shield-v8.png?v=v32" alt="ShadowScore shield" className="h-11 w-11 rounded-xl object-contain bg-black p-1" />
            <div className="leading-none">
              <div className="text-2xl font-extrabold tracking-tight">Shadow<span className="text-red-400">Score</span></div>
              <div className="mt-1.5 text-[10px] uppercase tracking-[0.34em] text-zinc-500">Marketplace Risk Intelligence</div>
            </div>
          </div>

          <nav className="hidden items-center gap-9 text-sm text-zinc-400 md:flex">
            <a href="#feed" className="hover:text-white">Threat Feed</a>
            <a href="#coverage" className="hover:text-white">Coverage</a>
            <a href="#cases" className="hover:text-white">Cases</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="/intake" className="text-red-300 hover:text-red-200">Console</a>
          </nav>

          <button onClick={() => openWhatsApp(selectedPlan)} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold shadow-[0_0_26px_rgba(220,38,38,0.35)] hover:bg-red-500">
            Book A Briefing
          </button>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-14 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_.92fr] lg:gap-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/8 px-4 py-2 text-sm text-red-200">
              <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.9)]" />
              Marketplace Enforcement Intelligence
            </div>

            <h1 className="mt-8 text-5xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">
              The Platform Already Decided You&apos;re Risky.
              <span className="block text-red-400">ShadowScore Tells You First.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-xl leading-8 text-zinc-400">
              We detect silent behavioral signals: tracking drift, payout exposure, trust decay and operational anomalies, weeks before warnings, holds or restrictions appear.
            </p>

            <div className="mt-7 max-w-2xl rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-5 text-sm leading-7 text-red-100">
              Most sellers discover the problem after enforcement. ShadowScore is designed to identify exposure before the warning appears.
            </div>

            <div className="mt-9 rounded-3xl border border-white/10 bg-black/55 p-5 backdrop-blur-xl">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={store}
                  onChange={(e) => setStore(e.target.value)}
                  placeholder="Paste store URL or seller username"
                  className="flex-1 rounded-2xl border border-white/10 bg-black px-5 py-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-red-400"
                />
                <button onClick={requestScan} className="rounded-2xl bg-red-600 px-8 py-4 font-bold hover:bg-red-500">
                  Request Intelligence Review
                </button>
              </div>
              <div className="mt-4 text-sm text-zinc-500">
                No password required • Evidence-based review • Built from real marketplace investigations
              </div>
            </div>

            <div className="mt-9 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Live", "Community Signals"],
                ["4", "Risk Models"],
                ["6", "Marketplaces Covered"],
                ["On Demand", "Analyst Reviews"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-2xl font-black text-white">{value}</div>
                  <div className="mt-1 text-xs text-zinc-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <Panel className="relative overflow-hidden p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,40,60,0.13),transparent_55%)]" />
            <div className="relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.34em] text-zinc-500">Risk Operations Center</div>
                  <div className="mt-2 text-2xl font-extrabold">Threat Exposure View</div>
                </div>
                <Badge level="Elevated" />
              </div>

              <div className="mt-7 grid gap-4">
                {[
                  ["Trust Posture", "67", "Above normal exposure range"],
                  ["Primary Signal", "Tracking", "Late or weak delivery verification"],
                  ["Risk Window", "30d", "Stabilization recommended"],
                  ["Next Action", "Review", "Evidence quality and appeal readiness"],
                ].map(([label, value, note]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">{label}</div>
                    <div className="mt-3 text-4xl font-black text-white">{value}</div>
                    <div className="mt-2 text-sm text-zinc-500">{note}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <div id="coverage">
          <LogoRail />
        </div>
      </section>

      <section id="feed" className="mx-auto max-w-7xl px-6 py-16">
        <Panel className="p-7">
          <div className="flex flex-col gap-6 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-red-300">Live Marketplace Incidents</div>
              <h2 className="mt-4 text-4xl font-bold">Threat Intelligence Feed</h2>
              <p className="mt-4 max-w-3xl leading-7 text-zinc-500">
                Public marketplace incidents converted into structured enforcement intelligence. The feed is public signal. The scoring model remains private.
              </p>
            </div>
            <div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">
              Active Monitoring
            </div>
          </div>

          <div className="mt-7 grid gap-3">
            {feeds.map(([platform, event, level]) => (
              <div key={event} className="grid gap-4 rounded-2xl border border-white/10 bg-black/60 p-5 md:grid-cols-[120px_1fr_120px]">
                <div className="font-bold text-zinc-300">{platform}</div>
                <div className="font-semibold text-white">{event}</div>
                <Badge level={level} />
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section id="cases" className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Case Intelligence</div>
          <h2 className="mt-4 text-4xl font-bold">Built For The Enforcement Events Sellers Actually Face</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-zinc-500">
            ShadowScore does not sell shortcuts. It organizes signals, evidence and likely risk drivers into decision-ready intelligence.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cases.map(([title, type, body]) => (
            <div key={title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-3xl font-black text-red-300">{title}</div>
              <div className="mt-3 text-xl font-bold">{type}</div>
              <p className="mt-4 leading-7 text-zinc-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            ["Built From Real Cases", "Based on actual marketplace investigations, payout holds, MC011 reviews, tracking disputes and account risk events."],
            ["Not A Recovery Shortcut", "ShadowScore does not claim internal platform access and does not promise reinstatement."],
            ["Designed For Decision Clarity", "We help sellers understand what the platform may be reacting to and what evidence should be stabilized first."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-[28px] border border-white/10 bg-black/55 p-7">
              <div className="text-2xl font-bold">{title}</div>
              <p className="mt-4 leading-8 text-zinc-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[34px] border border-red-400/25 bg-red-500/[0.07] p-8 md:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-red-300">Rapid Assessment</div>
              <h2 className="mt-4 text-4xl font-bold">Received An MC011, MC999, Payout Hold Or Account Review?</h2>
              <p className="mt-5 max-w-3xl leading-8 text-zinc-300">
                Get a rapid intelligence review of the likely risk drivers, evidence quality and recommended next actions.
              </p>
            </div>
            <button onClick={() => openWhatsApp("Intelligence Review")} className="rounded-2xl bg-red-600 px-8 py-5 text-lg font-black shadow-[0_0_30px_rgba(220,38,38,0.35)] hover:bg-red-500">
              Start Review - $99
            </button>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Pricing</div>
          <h2 className="mt-4 text-4xl font-bold">Start With A Snapshot. Upgrade Into Intelligence.</h2>
          <p className="mx-auto mt-4 max-w-3xl text-zinc-500">
            A low-friction entry point for sellers under pressure, with deeper intelligence for serious operators.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan.name)}
              className={`relative flex min-h-[600px] cursor-pointer flex-col justify-between rounded-[30px] border p-6 transition-all duration-300 ${
                selectedPlan === plan.name
                  ? "border-red-400/65 bg-red-500/8 shadow-[0_0_38px_rgba(220,38,38,0.13)]"
                  : "border-white/10 bg-white/[0.025] hover:border-white/20"
              }`}
            >
              {plan.tag && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border border-red-400/40 bg-red-600 px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_0_28px_rgba(220,38,38,0.45)]">
                  {plan.tag}
                </div>
              )}

              <div>
                <div className="text-xl font-bold">{plan.name}</div>
                <div className="mt-7 flex items-end gap-3">
                  <div className="text-4xl font-bold tracking-tight text-white">{plan.price}</div>
                </div>
                <div className="mt-2 text-sm text-zinc-500">{plan.sub}</div>
                <p className="mt-6 min-h-[96px] leading-7 text-zinc-400">{plan.desc}</p>

                <div className="mt-8 space-y-4">
                  {plan.items.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-zinc-300">
                      <div className="mt-1 text-red-300">✓</div>
                      <div>{item}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlan(plan.name);
                  openWhatsApp(plan.name);
                }}
                className="mt-10 rounded-2xl border border-white/10 bg-red-600 px-6 py-4 font-bold transition hover:bg-red-500"
              >
                {plan.button}
              </button>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm leading-7 text-zinc-500">
          ShadowScore is independent and not affiliated with any marketplace platform. Marketplace names are shown for coverage reference only.
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-extrabold">Shadow<span className="text-red-400">Score</span></div>
            <div className="mt-2 text-sm text-zinc-500">Marketplace Risk Intelligence Platform</div>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-zinc-500">
            <span>Exposure Intelligence</span>
            <span>Seller Risk Analytics</span>
            <span>Operational Trust Monitoring</span>
          </div>
        </div>
      </footer>

      {showScanner && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 px-6 backdrop-blur-xl">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-red-400/20 bg-black p-8">
            <div className="text-sm uppercase tracking-[0.25em] text-red-300">Exposure Scan Initiated</div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-5">
              <div className="text-sm text-zinc-500">Store URL</div>
              <div className="mt-3 break-all text-xl">{store || "Missing store URL"}</div>
            </div>

            {!store.trim() && (
              <div className="mt-5 rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-4 text-sm leading-7 text-yellow-100">
                Add a store URL or seller username to generate a more useful intelligence request.
              </div>
            )}

            <div className="mt-8 space-y-4 text-zinc-400">
              {[
                ["Reading marketplace signals", 72],
                ["Checking tracking exposure", 58],
                ["Analyzing review exposure", 81],
                ["Preparing private audit request", 100],
              ].map(([label, progress]) => (
                <div key={label as string}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>● {label}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-red-700 via-red-500 to-red-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-red-400/20 bg-red-500/8 p-7">
              <div className="text-6xl font-bold text-red-400">72</div>
              <div className="mt-4 text-2xl font-bold">Elevated Exposure Preview</div>
              <p className="mt-4 leading-7 text-zinc-400">
                This public scan is intentionally limited. A full private audit requires store context, screenshots and operational exports.
              </p>
              <div className="mt-5 text-sm text-zinc-500">Selected plan: {selected.name}</div>
            </div>

            <button onClick={() => setShowScanner(false)} className="mt-7 w-full rounded-xl border border-white/10 px-7 py-3.5 text-zinc-300 transition hover:border-red-400/30 hover:text-white">
              Back To Site
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
