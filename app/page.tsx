"use client";

import { useEffect, useMemo, useState } from "react";

const WHATSAPP_NUMBER = "9720557293979";

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState("Exposure Intelligence");
  const [scanText, setScanText] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [activeSignal, setActiveSignal] = useState(0);
  const [metricsTick, setMetricsTick] = useState(0);
  const [showMoreFaq, setShowMoreFaq] = useState(false);

  const liveSignals = useMemo(
    () => [
      "eBay · Tracking integrity drift detected",
      "Amazon · Payout exposure watchlist",
      "Walmart · Fulfillment proof instability",
      "TikTok Shop · Buyer signal volatility rising",
      "Etsy · Seller safety exposure detected",
    ],
    []
  );

  useEffect(() => {
    const signalTimer = window.setInterval(() => {
      setActiveSignal((current) => (current + 1) % liveSignals.length);
    }, 2600);

    const metricsTimer = window.setInterval(() => {
      setMetricsTick((current) => current + 1);
    }, 2200);

    return () => {
      window.clearInterval(signalTimer);
      window.clearInterval(metricsTimer);
    };
  }, [liveSignals.length]);

  const networkMetrics = [
    {
      label: "Stores Reviewed",
      value: 496 + (metricsTick % 11),
      daily: `+${11 + (metricsTick % 4)} today`,
      monthly: `+${76 + (metricsTick % 12)} this month`,
    },
    {
      label: "Risk Events",
      value: 72 + (metricsTick % 6),
      daily: `+${7 + (metricsTick % 3)} today`,
      monthly: `+${32 + (metricsTick % 8)} this month`,
    },
    {
      label: "Alerts Sent",
      value: 50 + (metricsTick % 7),
      daily: `+${6 + (metricsTick % 3)} today`,
      monthly: `+${27 + (metricsTick % 9)} this month`,
    },
    {
      label: "Sellers Stabilized",
      value: 29 + (metricsTick % 5),
      daily: `+${5 + (metricsTick % 2)} today`,
      monthly: `+${22 + (metricsTick % 7)} this month`,
    },
    {
      label: "Exposure Monitored",
      value: `$${184 + (metricsTick % 4)}K`,
      daily: `+$${9 + (metricsTick % 4)}K today`,
      monthly: `+$${41 + (metricsTick % 10)}K this month`,
    },
    {
      label: "Markets Covered",
      value: 6,
      daily: "active",
      monthly: "monitoring",
    },
  ];

  const faqItems = [
    {
      q: "Is ShadowScore a reinstatement service?",
      a: "No. ShadowScore is built to identify elevated marketplace exposure before visible enforcement actions happen.",
    },
    {
      q: "Do you need my marketplace password?",
      a: "No. Initial reviews can begin with store URLs, exports, screenshots and operational context.",
    },
    {
      q: "Is the 30-day protection available forever?",
      a: "No. Protection applies only to the first paid audit.",
    },
    {
      q: "Which sellers is this for?",
      a: "Marketplace operators, agencies, dropshippers and sellers who depend heavily on account continuity.",
    },
    {
      q: "Does ShadowScore connect directly to marketplaces?",
      a: "No direct marketplace integration is required during early access.",
    },
    {
      q: "Can ShadowScore guarantee no restriction will happen?",
      a: "No platform can guarantee that. ShadowScore helps identify elevated exposure before visible action occurs.",
    },
    {
      q: "What marketplaces are supported?",
      a: "eBay, Amazon, Walmart, SHEIN, TikTok Shop and Etsy during early access.",
    },
    {
      q: "What makes ShadowScore different?",
      a: "A landing page can be copied. Marketplace intelligence, outcome memory and operating playbooks cannot.",
    },
    {
      q: "How long does an audit take?",
      a: "Most first audits are reviewed within 24 to 72 hours.",
    },
    {
      q: "What does ShadowScore actually analyze?",
      a: "ShadowScore analyzes hidden marketplace trust and enforcement signals linked to elevated account exposure.",
    },
    {
      q: "Can agencies use ShadowScore?",
      a: "Yes. Agency plans support multi-account operational monitoring.",
    },
    {
      q: "Do you store marketplace credentials?",
      a: "No marketplace credentials are requested during initial reviews.",
    },
  ];

  const visibleFaq = showMoreFaq ? faqItems : faqItems.slice(0, 4);

  const buildWhatsappUrl = (planName = selectedPlan, store = scanText) => {
    const message = `ShadowScore Audit Request

Store:
${store || "Not provided yet"}

Selected Plan:
${planName}

I would like a private marketplace exposure audit.`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const openWhatsApp = (planName = selectedPlan) => {
    window.open(buildWhatsappUrl(planName), "_blank", "noopener,noreferrer");
  };

  const handleScan = () => {
    setShowScanner(true);
    window.setTimeout(() => {
      openWhatsApp(selectedPlan);
    }, 1800);
  };

  const plans = [
    {
      name: "Exposure Intelligence",
      price: "$199",
      tag: "Most Popular",
      sub: "one time",
      desc: "Private exposure review for one marketplace account.",
      items: [
        "Hidden exposure review",
        "Marketplace risk summary",
        "Tracking integrity review",
        "30-day risk outlook",
        "Seller protection recommendations",
        "30-day protection",
      ],
      button: "Request Audit",
    },
    {
      name: "Continuous Monitoring",
      price: "$299",
      tag: "",
      sub: "per month",
      desc: "Continuous monitoring for active marketplace operators.",
      items: [
        "Weekly monitoring",
        "Behavioral drift tracking",
        "Tracking integrity analysis",
        "Priority alerts",
        "Monthly recommendations",
      ],
      button: "Start Monitoring",
    },
    {
      name: "Agency Intelligence",
      price: "$1,499",
      tag: "",
      sub: "per month",
      desc: "For agencies and multi-store operators.",
      items: [
        "Multi-account monitoring",
        "Cross-marketplace exposure tracking",
        "Founder access",
        "Private intelligence playbooks",
        "Custom reporting",
      ],
      button: "Talk To Us",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(180,15,30,0.16),transparent_45%),radial-gradient(circle_at_20%_25%,rgba(160,12,24,0.09),transparent_38%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/shadowscore-shield-v8.png?v=v8"
              alt="ShadowScore shield"
              className="h-11 w-11 rounded-xl object-contain bg-black p-1"
            />

            <div className="leading-none">
              <div className="text-2xl font-extrabold tracking-tight">
                Shadow<span className="text-red-400">Score</span>
              </div>
              <div className="mt-1.5 text-[10px] uppercase tracking-[0.34em] text-zinc-500">
                Risk Intelligence
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-9 text-sm text-zinc-400 md:flex">
            <a href="#signals" className="transition hover:text-white">Signals</a>
            <a href="#agent" className="transition hover:text-white">Agent</a>
            <a href="#guarantee" className="transition hover:text-white">Guarantee</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#contact" className="transition hover:text-white">Contact</a>
          </nav>

          <button
            type="button"
            onClick={() => openWhatsApp(selectedPlan)}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold shadow-[0_0_22px_rgba(220,38,38,0.28)] transition hover:bg-red-500 md:px-6"
          >
            Get Audit
          </button>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-14 pt-12 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/8 px-4 py-2 text-sm text-red-200">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Enterprise Marketplace Exposure Intelligence
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
              The Marketplace Already Formed An Opinion About Your Account.
              <span className="mt-3 block text-red-400">
                ShadowScore Lets You See It Before Enforcement Begins.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400">
              ShadowScore detects silent marketplace exposure before payout holds, seller reviews and account restrictions begin.
            </p>

            <div className="mt-9 rounded-3xl border border-white/10 bg-black/55 p-5 backdrop-blur-xl">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={scanText}
                  onChange={(event) => setScanText(event.target.value)}
                  placeholder="Paste store URL or seller username"
                  className="flex-1 rounded-2xl border border-white/10 bg-black px-5 py-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-red-400"
                />

                <button
                  type="button"
                  onClick={handleScan}
                  className="rounded-2xl bg-red-600 px-8 py-4 font-bold transition hover:bg-red-500"
                >
                  Scan My Store
                </button>
              </div>

              <div className="mt-4 text-sm text-zinc-500">
                No password required • First paid audit includes 30-day Risk Protection
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => openWhatsApp("Exposure Intelligence")}
                className="rounded-xl border border-red-400/25 bg-red-500/8 px-7 py-3.5 font-semibold text-white transition hover:bg-red-500/15"
              >
                Request Private Audit
              </button>

              <a
                href="#pricing"
                className="rounded-xl border border-white/10 px-7 py-3.5 font-semibold text-zinc-300 transition hover:border-white/25 hover:text-white"
              >
                View Pricing
              </a>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["30 Days", "Risk Protection"],
                ["$199", "First Audit"],
                ["No Login", "Password Needed"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xl font-bold text-white md:text-2xl">{value}</div>
                  <div className="mt-1 text-xs text-zinc-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-4">
            <div className="absolute inset-0 rounded-full bg-red-500/10 blur-3xl" />

            <div className="relative min-h-[520px] overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-red-950/20 via-black to-black p-10 shadow-[0_0_60px_rgba(180,20,35,0.12)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,40,60,0.14),transparent_55%)]" />

              <div className="relative flex h-full min-h-[440px] flex-col items-center justify-center text-center">
                <img
                  src="/shadowscore-shield-v8.png?v=hero-v8"
                  alt="ShadowScore cyber shield"
                  className="h-auto w-[260px] max-w-full object-contain drop-shadow-[0_0_34px_rgba(220,38,38,0.22)] md:w-[300px]"
                />

                <div className="mt-8 text-4xl font-extrabold tracking-tight md:text-5xl">
                  SHADOW<span className="text-red-400">SCORE</span>
                </div>

                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.42em] text-zinc-500">
                  Marketplace Risk Intelligence
                </div>

                <div className="mt-8 h-px w-full max-w-md bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

                <div className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-zinc-400">
                  Exposure visibility before enforcement
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-red-300">Live Risk Terminal</div>
                <h2 className="mt-2 text-3xl font-bold">ShadowScore Monitor</h2>
              </div>
              <div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                Elevated
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                ["Marketplace Trust", "72", "Elevated"],
                ["Tracking Integrity", "61", "Degrading"],
                ["Payout Stability", "54", "Watchlist"],
                ["Enforcement Risk", "HIGH", "30 Day Window"],
              ].map(([title, value, label]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/55 p-5">
                  <div className="text-xs text-zinc-500">{title}</div>
                  <div className="mt-4 text-3xl font-bold">{value}</div>
                  <div className="mt-2 text-xs text-red-300">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Live Signal Feed</h3>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Active
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {liveSignals.map((signal, index) => (
                <div
                  key={signal}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                    index === activeSignal
                      ? "border-red-400/25 bg-red-500/10 text-white"
                      : "border-white/10 bg-black/40 text-zinc-500"
                  }`}
                >
                  <span>{signal}</span>
                  <span className="text-xs text-zinc-600">
                    {index === activeSignal ? "now" : `${(index + 1) * 17}s`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
          <div>
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">
              ShadowScore Network Intelligence
            </div>
            <p className="mt-3 text-zinc-500">
              Early Access Network Metrics. Metrics shown for demonstration during early access.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {networkMetrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/50 p-5 transition duration-500">
                <div className="text-3xl font-bold">{metric.value}</div>
                <div className="mt-2 text-sm text-zinc-400">{metric.label}</div>
                <div className="mt-5 text-sm text-emerald-400">{metric.daily}</div>
                <div className="mt-1 text-sm text-red-300">{metric.monthly}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="agent" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">The Agent</div>
            <h2 className="mt-4 text-4xl font-bold">A Seller Defense Agent, Not Another Dashboard</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["01", "Observe", "Detects marketplace exposure across operational behavior, trust signals and fulfillment consistency."],
              ["02", "Score", "Translates invisible marketplace signals into a private risk view."],
              ["03", "Warn", "Warns before exposure becomes a payout hold, account review or restriction."],
              ["04", "Prepare", "Shows what to stabilize before the marketplace acts."],
            ].map(([num, title, text]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="text-sm font-bold text-red-300">{num}</div>
                <div className="mt-3 text-xl font-semibold">{title}</div>
                <p className="mt-3 leading-7 text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="signals" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Signal Engine</div>
          <h2 className="mt-4 text-4xl font-bold">Marketplace Enforcement Starts Before The Warning</h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["Tracking Integrity", "Late uploads, TBA exposure, invalid scans, carrier mismatch and weak proof of delivery."],
            ["Velocity Risk", "Sudden sales growth, category spikes, new account pressure and fulfillment instability."],
            ["Trust Decay", "Buyer sentiment, INR activity, refund drift, payout friction and support routing changes."],
            ["Operational Exposure", "SKU churn, source dependency, fulfillment gaps and account stability signals."],
            ["Review Exposure", "Identifies elevated similarity to accounts that later entered review or restriction."],
            ["Action Layer", "Direct actions before damage reaches account health or payout systems."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-xl font-semibold">{title}</div>
              <p className="mt-3 leading-7 text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="guarantee" className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[32px] border border-red-400/20 bg-red-500/8 p-8">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">30-Day Risk Protection</div>
          <h2 className="mt-4 text-4xl font-bold">First Paid Audit Protected For 30 Days</h2>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-zinc-300">
            If a first-time paid audit fails to identify elevated marketplace exposure signals and a new restriction or payout review occurs within 30 days, ShadowScore refunds the audit fee.
          </p>
          <p className="mt-4 text-zinc-500">
            Applies to first-time audits only. Existing warnings must be disclosed. Recommended actions must be followed. Future scans do not include first-audit protection.
          </p>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Pricing</div>
          <h2 className="mt-4 text-4xl font-bold">Built For Sellers Who Cannot Afford To Lose The Account</h2>
          <p className="mx-auto mt-4 max-w-3xl text-zinc-500">
            Choose a plan. The selected plan gets a red security frame and is included automatically in the WhatsApp audit request.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan.name)}
              className={`flex min-h-[660px] cursor-pointer flex-col justify-between rounded-[30px] border p-7 transition-all duration-300 ${
                selectedPlan === plan.name
                  ? "border-red-400/65 bg-red-500/8 shadow-[0_0_38px_rgba(220,38,38,0.13)]"
                  : "border-white/10 bg-white/[0.025] hover:border-white/20"
              }`}
            >
              <div>
                <div className="flex h-8 items-center justify-between">
                  {plan.tag ? (
                    <div className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
                      {plan.tag}
                    </div>
                  ) : (
                    <div />
                  )}
                  {selectedPlan === plan.name && (
                    <div className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
                      Selected
                    </div>
                  )}
                </div>

                <div className="mt-6 text-2xl font-bold">{plan.name}</div>

                <div className="mt-7 flex items-end gap-3">
                  <div className="text-5xl font-bold tracking-tight text-white">{plan.price}</div>
                  <div className="pb-2 text-sm text-zinc-500">{plan.sub}</div>
                </div>

                <p className="mt-6 min-h-[56px] leading-7 text-zinc-400">{plan.desc}</p>

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
                onClick={(event) => {
                  event.stopPropagation();
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
      </section>

      <section className="relative overflow-hidden border-t border-white/10 py-20">
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">
              Active Marketplace Intelligence Network
            </div>
            <h2 className="mt-4 text-4xl font-bold text-white">Platforms Under Behavioral Monitoring</h2>
            <p className="mx-auto mt-4 max-w-3xl leading-7 text-zinc-400">
              ShadowScore monitors marketplace exposure across multiple seller ecosystems before visible enforcement actions happen.
            </p>
          </div>

          <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-black/80 shadow-[0_0_42px_rgba(220,38,38,0.10)]">
            <img
              src="/marketplaces-monitor-v8.png?v=market-v8"
              alt="Marketplaces monitored by ShadowScore including eBay, Amazon, Walmart, SHEIN, TikTok Shop and Etsy"
              className="h-auto w-full grayscale transition duration-700 hover:grayscale-0 hover:saturate-125"
            />
          </div>

          <div className="mt-8 text-center text-sm text-zinc-500">
            Marketplace names are displayed for monitoring coverage only. ShadowScore is independent and not affiliated with these platforms.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">FAQ</div>
          <h2 className="mt-4 text-4xl font-bold">
            Questions Sellers Ask Before They Realize The Risk Is Already Building
          </h2>
        </div>

        <div className="mt-12 space-y-4">
          {visibleFaq.map((faq) => (
            <details key={faq.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <summary className="cursor-pointer text-lg font-semibold">{faq.q}</summary>
              <p className="mt-4 leading-7 text-zinc-400">{faq.a}</p>
            </details>
          ))}
        </div>

        {!showMoreFaq && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowMoreFaq(true)}
              className="rounded-xl border border-white/10 px-7 py-3.5 text-zinc-300 transition hover:border-red-400/30 hover:text-white"
            >
              Show More Questions
            </button>
          </div>
        )}
      </section>

      <section id="contact" className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="rounded-[34px] border border-white/10 bg-white/[0.03] p-10">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Contact ShadowScore</div>
          <h2 className="mt-4 text-4xl font-bold">Speak With The Risk Agent</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            Private early-access reviews for marketplace sellers, agencies and multi-store operators.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 md:flex-row">
            <button
              type="button"
              onClick={() => openWhatsApp(selectedPlan)}
              className="rounded-xl bg-red-600 px-8 py-4 font-bold transition hover:bg-red-500"
            >
              Open WhatsApp Chat
            </button>

            <a
              href="mailto:help@shadowscore.io"
              className="rounded-xl border border-white/10 px-8 py-4 text-zinc-300 transition hover:border-red-400/30 hover:text-white"
            >
              help@shadowscore.io
            </a>
          </div>
        </div>

        <div className="mt-10 text-sm text-zinc-600">
          ShadowScore © 2026 · Marketplace Risk Intelligence
        </div>
      </section>

      {showScanner && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 px-6 backdrop-blur-xl">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-red-400/20 bg-black p-8">
            <div className="text-sm uppercase tracking-[0.25em] text-red-300">Elevated Exposure Detected</div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-5">
              <div className="text-sm text-zinc-500">Store URL</div>
              <div className="mt-3 break-all text-xl">{scanText || "Not provided yet"}</div>
            </div>

            <div className="mt-8 space-y-3 text-zinc-400">
              <div>● Reading marketplace signals</div>
              <div>● Checking tracking exposure</div>
              <div>● Analyzing review exposure</div>
              <div>● Preparing private audit request</div>
            </div>

            <div className="mt-8 rounded-3xl border border-red-400/20 bg-red-500/8 p-7">
              <div className="text-6xl font-bold text-red-400">72</div>
              <div className="mt-4 text-2xl font-bold">Elevated Exposure Preview</div>
              <p className="mt-4 leading-7 text-zinc-400">
                This public scan is intentionally limited. A full private audit requires store context, screenshots and operational exports.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowScanner(false)}
              className="mt-7 w-full rounded-xl border border-white/10 px-7 py-3.5 text-zinc-300 transition hover:border-red-400/30 hover:text-white"
            >
              Back To Site
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
