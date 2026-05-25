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
      "eBay · Tracking validation drift detected",
      "Amazon · Payout reserve exposure elevated",
      "Walmart · Fulfillment verification inconsistencies observed",
      "TikTok Shop · Behavioral velocity anomaly detected",
      "Etsy · Marketplace trust posture weakening",
    ],
    []
  );

  const signalStates = useMemo(
    () => [
      "monitoring",
      "active",
      "recently updated",
      "refreshed 4m ago",
      "live telemetry",
    ],
    []
  );

  useEffect(() => {
    const signalTimer = window.setInterval(() => {
      setActiveSignal((current) => (current + 1) % liveSignals.length);
    }, 18000);

    const metricsTimer = window.setInterval(() => {
      setMetricsTick((current) => current + 1);
    }, 26000);

    return () => {
      window.clearInterval(signalTimer);
      window.clearInterval(metricsTimer);
    };
  }, [liveSignals.length]);

  const networkMetrics = [
    {
      label: "Stores Reviewed",
      value: 496 + (metricsTick % 3),
      daily: `+${11 + (metricsTick % 2)} today`,
      monthly: `+${76 + (metricsTick % 4)} this month`,
    },
    {
      label: "Risk Events",
      value: 72 + (metricsTick % 2),
      daily: `+${7 + (metricsTick % 2)} today`,
      monthly: `+${32 + (metricsTick % 3)} this month`,
    },
    {
      label: "Alerts Sent",
      value: 50 + (metricsTick % 2),
      daily: `+${6 + (metricsTick % 2)} today`,
      monthly: `+${27 + (metricsTick % 3)} this month`,
    },
    {
      label: "Sellers Stabilized",
      value: 29 + (metricsTick % 2),
      daily: `+${5 + (metricsTick % 1)} today`,
      monthly: `+${22 + (metricsTick % 3)} this month`,
    },
    {
      label: "Exposure Monitored",
      value: `$${184 + (metricsTick % 2)}K`,
      daily: `+$${9 + (metricsTick % 2)}K today`,
      monthly: `+$${41 + (metricsTick % 3)}K this month`,
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
      q: "What is ShadowScore?",
      a: "ShadowScore is a private marketplace exposure intelligence service for sellers, agencies and multi-store operators. It helps identify elevated account risk before visible enforcement actions begin.",
    },
    {
      q: "Is ShadowScore a reinstatement service?",
      a: "No. ShadowScore is designed for pre-enforcement visibility. If an account is already restricted, the review can still help organize the situation, but the primary value is early detection and prevention.",
    },
    {
      q: "Do you need my marketplace password?",
      a: "No. Initial reviews do not require marketplace credentials. A first audit can begin with a store URL, screenshots, exports and operational context.",
    },
    {
      q: "What marketplaces are supported?",
      a: "Early access coverage includes eBay, Amazon, Walmart, SHEIN, TikTok Shop and Etsy.",
    },
    {
      q: "What does the first audit include?",
      a: "The first audit includes a private exposure review, risk posture summary, tracking integrity review, 30-day outlook and recommended stabilization actions.",
    },
    {
      q: "Does ShadowScore reveal marketplace enforcement logic?",
      a: "No. ShadowScore does not claim access to marketplace internal systems and does not expose proprietary analysis logic. The review is based on external account posture, operational context and risk indicators.",
    },
    {
      q: "Can ShadowScore guarantee that my account will not be restricted?",
      a: "No platform can guarantee that. ShadowScore helps sellers identify elevated exposure early and take stronger operational action before risk becomes visible enforcement.",
    },
    {
      q: "How does the 30-day protection work?",
      a: "If a first-time paid audit fails to identify elevated exposure and a new restriction or payout review occurs within 30 days, ShadowScore refunds the audit fee, subject to the stated audit terms.",
    },
    {
      q: "Who should use ShadowScore?",
      a: "Sellers with meaningful marketplace revenue, dropshippers, agencies, high-volume operators and anyone who cannot afford sudden payout holds or account reviews.",
    },
    {
      q: "How long does an audit take?",
      a: "Most first audits are reviewed within 24 to 72 hours, depending on the quality of the submitted context and exports.",
    },
    {
      q: "Is ShadowScore affiliated with the marketplaces shown?",
      a: "No. Marketplace names are shown for coverage reference only. ShadowScore is independent and is not affiliated with eBay, Amazon, Walmart, SHEIN, TikTok Shop or Etsy.",
    },
    {
      q: "Can agencies use ShadowScore for multiple clients?",
      a: "Yes. The Agency Intelligence plan is built for multi-account review, operational monitoring and private reporting workflows.",
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

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.16),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_28%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/8 px-4 py-2 text-sm text-red-200">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Marketplace Behavioral Intelligence
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
              The Marketplace Already Decided You're Risky.
              <span className="mt-3 block text-red-400">
                ShadowScore Lets You See It First.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-400">
              Marketplace platforms evaluate seller behavior long before reviews, payout holds or restrictions become visible.
              ShadowScore helps operators identify hidden exposure signals before enforcement begins.
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
                  className="rounded-2xl bg-red-600 px-8 py-4 font-semibold transition hover:bg-red-500"
                >
                  Request Intelligence Review
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
                <span>No marketplace password required</span>
                <span>Private review process</span>
                <span>30-day Risk Protection</span>
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
                View Plans
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

          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-red-500/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-black/45 shadow-2xl shadow-red-950/10 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <div className="text-sm font-medium text-white">ShadowScore Exposure Terminal</div>
                  <div className="mt-1 text-xs text-zinc-500">Live marketplace behavioral telemetry</div>
                </div>

                <div className="flex items-center gap-2 text-xs text-red-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                  Monitoring Active
                </div>
              </div>

              <div className="space-y-5 p-5">
                {[
                  ["Marketplace Trust", 72, "Elevated"],
                  ["Tracking Integrity", 61, "Degrading"],
                  ["Operational Stability", 58, "Watchlist"],
                  ["Enforcement Exposure", 81, "High"],
                ].map(([label, score, status]) => (
                  <div key={label as string}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-zinc-300">{label}</span>
                      <span className="text-sm text-red-300">{status}</span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-700 via-red-500 to-red-400 transition-all duration-1000"
                        style={{ width: `${score as number}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 bg-white/[0.02] px-5 py-4 text-xs leading-6 text-zinc-500">
                ShadowScore does not guarantee suspension prevention and is not affiliated with any marketplace platform.
                The service provides operational exposure interpretation based on behavioral risk indicators.
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-black/70">
              <img
                src="/shadowscore-shield-v8.png?v=hero-terminal-v12"
                alt="ShadowScore shield"
                className="mx-auto h-auto w-[210px] object-contain p-8 opacity-95 drop-shadow-[0_0_30px_rgba(220,38,38,0.18)]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
          <div>
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">
              ShadowScore Network Intelligence
            </div>
            <p className="mt-3 text-zinc-500">
              Early Access Network Metrics. Demonstration values refresh slowly to simulate a live monitoring environment.
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
            Questions Marketplace Operators Ask Before Enforcement Begins
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
