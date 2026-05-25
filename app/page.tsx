"use client";

import { useState } from "react";

const WHATSAPP_NUMBER = "9720557293979";

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState("Exposure Intelligence");
  const [scanText, setScanText] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showMoreFaq, setShowMoreFaq] = useState(false);

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
      desc: "Designed for sellers who cannot afford invisible marketplace exposure.",
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
      desc: "Ongoing exposure monitoring for active marketplace operators.",
      items: [
        "Ongoing exposure monitoring",
        "Behavioral drift tracking",
        "Tracking integrity analysis",
        "Priority exposure alerts",
        "Monthly operational review",
      ],
      button: "Start Monitoring",
    },
    {
      name: "Agency Intelligence",
      price: "$1,499",
      tag: "",
      sub: "per month",
      desc: "Private marketplace exposure intelligence for agencies and multi-store operators.",
      items: [
        "Multi-account monitoring",
        "Cross-marketplace exposure mapping",
        "Private analyst access",
        "Marketplace escalation review",
        "Behavioral exposure monitoring",
        "Custom intelligence reporting",
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
              Marketplace Exposure Intelligence
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
              The Marketplace Already Decided You're Risky.
              <span className="mt-3 block text-red-400">
                ShadowScore Lets You See It First.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400">
              ShadowScore reveals silent behavioral signals and hidden exposure weeks before payout holds,
              account reviews or restrictions begin.
            </p>

            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-500">
              Most sellers only see the warning after the decision has already been made.
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
                  Request Private Intelligence Review
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

        <section className="mt-12">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm text-red-300">Exposure Terminal</div>
                <h2 className="mt-2 text-3xl font-bold">ShadowScore Risk View</h2>
                <p className="mt-3 max-w-2xl leading-7 text-zinc-500">
                  Private exposure visibility before marketplace enforcement becomes visible.
                </p>
              </div>

              <div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                Elevated Visibility
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                ["Marketplace Trust", "Elevated", "w-4/5"],
                ["Tracking Integrity", "Degrading", "w-3/5"],
                ["Payout Stability", "Watchlist", "w-2/5"],
                ["Enforcement Exposure", "High Visibility", "w-full"],
              ].map(([title, status, width]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/55 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {title}
                    </div>

                    <div className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]" />
                  </div>

                  <div className="mt-5 text-2xl font-semibold text-white">
                    {status}
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div className={`h-full ${width} rounded-full bg-gradient-to-r from-red-700 via-red-500 to-red-400`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section id="agent" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">The Agent</div>
            <h2 className="mt-4 text-4xl font-bold">A Seller Defense Agent, Not Another Dashboard</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["01", "Exposure Detection", "Identifies hidden marketplace instability signals before they become visible account events."],
              ["02", "Behavioral Correlation", "Maps operational patterns linked to elevated enforcement exposure."],
              ["03", "Risk Interpretation", "Transforms weak operational signals into actionable exposure visibility."],
              ["04", "Stabilization Actions", "Highlights operational adjustments before marketplace escalation begins."],
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

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">
            What You Receive
          </div>

          <h2 className="mt-4 text-4xl font-bold">
            Private Marketplace Exposure Intelligence
          </h2>

          <p className="mx-auto mt-4 max-w-3xl leading-7 text-zinc-500">
            Every ShadowScore review is designed to surface hidden operational exposure before visible enforcement begins.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Exposure Summary",
              text: "Private operational risk overview and marketplace posture analysis.",
            },
            {
              title: "Tracking Integrity Review",
              text: "Behavioral delivery trust evaluation and scan consistency analysis.",
            },
            {
              title: "Enforcement Vulnerability",
              text: "Hidden exposure interpretation and operational weakness detection.",
            },
            {
              title: "Stabilization Actions",
              text: "Recommended operational adjustments before enforcement escalation.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-black/40 p-6"
            >
              <div className="text-xl font-semibold text-white">{item.title}</div>
              <p className="mt-4 leading-7 text-zinc-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">
              Report Preview
            </div>
            <h2 className="mt-4 text-4xl font-bold">
              What A Private Review Looks Like
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-zinc-400">
              Every review includes exposure findings, operational risk interpretation and stabilization recommendations.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/55 p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-sm font-semibold text-white">Sample Exposure Report</div>
                <div className="mt-1 text-xs text-zinc-500">Anonymized marketplace risk summary</div>
              </div>
              <div className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-xs text-red-200">
                Elevated
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {[
                ["Overall Exposure", "Elevated review visibility"],
                ["Primary Finding", "Tracking and operational drift"],
                ["Risk Window", "30-day monitoring window"],
                ["Recommended Action", "Stabilize fulfillment and velocity"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-600">{label}</div>
                  <div className="mt-2 text-sm text-zinc-300">{value}</div>
                </div>
              ))}
            </div>
          </div>
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
          <h2 className="mt-4 text-4xl font-bold">Request A Private Review</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            Private exposure reviews for serious marketplace operators.
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
