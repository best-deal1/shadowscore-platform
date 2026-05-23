"use client";

import { useEffect, useMemo, useState } from "react";

const WHATSAPP_NUMBER = "9720557293979";

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState("Exposure Intelligence");
  const [scanText, setScanText] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [activeSignal, setActiveSignal] = useState(0);
  const [showMoreFaq, setShowMoreFaq] = useState(false);

  const signals = useMemo(
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
    const timer = window.setInterval(() => {
      setActiveSignal((current) => (current + 1) % signals.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, [signals.length]);

  const faqItems = [
    {
      q: "Is ShadowScore a reinstatement service?",
      a: "No. ShadowScore focuses on identifying elevated marketplace exposure before visible enforcement actions happen.",
    },
    {
      q: "Do you need my marketplace password?",
      a: "No. Initial reviews can begin using store URLs, exports, screenshots and operational context.",
    },
    {
      q: "Is the 30-day protection available forever?",
      a: "No. The protection applies only to the first paid audit.",
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
      a: "A landing page can be copied. Marketplace intelligence cannot.",
    },
    {
      q: "How long does an audit take?",
      a: "Most first audits are reviewed within 24-72 hours.",
    },
    {
      q: "What does ShadowScore actually analyze?",
      a: "ShadowScore analyzes hidden marketplace trust and enforcement signals linked to elevated account exposure.",
    },
    {
      q: "Can agencies use ShadowScore?",
      a: "Yes. Agency Intelligence plans support multi-account operational monitoring.",
    },
    {
      q: "Do you store marketplace credentials?",
      a: "No marketplace credentials are requested during initial reviews.",
    },
  ];

  const visibleFaq = showMoreFaq ? faqItems : faqItems.slice(0, 4);

  const openWhatsApp = () => {
    const message = `ShadowScore Audit Request

Store:
${scanText || "Not provided yet"}

Selected Plan:
${selectedPlan}

I would like a private marketplace exposure audit.`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const handleScan = () => {
    if (!scanText.trim()) return;

    setShowScanner(true);

    window.setTimeout(() => {
      openWhatsApp();
    }, 2400);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.08] bg-[linear-gradient(to_right,#ff000015_1px,transparent_1px),linear-gradient(to_bottom,#ff000015_1px,transparent_1px)] bg-[size:70px_70px]" />

      <header className="sticky top-0 z-50 border-b border-red-950/30 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <img
              src="/shadowscore-shield-enterprise-v5.png?v=logo-v5"
              alt="ShadowScore shield"
              className="h-11 w-11 rounded-xl object-contain bg-black p-1"
            />

            <div className="leading-none">
              <div className="text-2xl font-extrabold tracking-tight">
                Shadow<span className="text-red-400">Score</span>
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.38em] text-zinc-500">
                Risk Intelligence
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-10 text-zinc-400 md:flex">
            <a href="#signals" className="transition hover:text-white">Signals</a>
            <a href="#agent" className="transition hover:text-white">Agent</a>
            <a href="#guarantee" className="transition hover:text-white">Guarantee</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#contact" className="transition hover:text-white">Contact</a>
          </nav>

          <a
            href="#pricing"
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold shadow-[0_0_22px_rgba(220,38,38,0.28)] transition hover:bg-red-500 md:px-6"
          >
            Get Audit
          </a>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-12 md:pt-16">
        <div className="absolute right-0 top-0 h-[700px] w-[700px] rounded-full bg-red-700/10 blur-3xl" />

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-5 py-2 text-sm text-red-300">
              ● Marketplace Behavioral Intelligence Active
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
              The Marketplace Already Formed An Opinion About Your Account.
              <span className="mt-3 block text-red-400">ShadowScore Lets You See It Before Enforcement Begins.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-xl leading-relaxed text-zinc-400">
              ShadowScore detects silent marketplace exposure before payout holds, seller reviews and account restrictions begin.
            </p>

            <p className="mt-4 max-w-2xl text-lg text-zinc-500">
              
            </p>

            <div className="mt-9 rounded-[28px] border border-white/10 bg-white/[0.025] hover:border-white/20 p-6 shadow-[0_0_40px_rgba(255,0,0,0.12)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 md:flex-row">
                <input
                  value={scanText}
                  onChange={(event) => setScanText(event.target.value)}
                  placeholder="Paste store URL or seller username"
                  className="flex-1 rounded-2xl border border-white/10 bg-black px-6 py-5 text-lg outline-none focus:border-red-400"
                />

                <button
                  onClick={handleScan}
                  className="rounded-2xl bg-red-600 px-10 py-5 text-lg font-bold transition hover:bg-red-500"
                >
                  Scan My Store
                </button>
              </div>

              <div className="mt-5 text-sm text-zinc-500">
                No password required • First paid audit includes 30-Day Risk Protection
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#pricing"
                className="rounded-2xl border border-red-400/30 bg-red-500/10 px-8 py-4 font-bold transition hover:bg-red-500/20"
              >
                Request Private Audit
              </a>

              <a
                href="#pricing"
                className="rounded-2xl border border-white/10 px-8 py-4 font-bold text-zinc-300 transition hover:border-white/20"
              >
                View Pricing
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
              {[
                ["30 Days", "Risk Protection"],
                ["$199", "First Audit"],
                ["No Login", "Password Needed"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.025] hover:border-white/20 p-4">
                  <div className="text-2xl font-bold text-white md:text-3xl">{value}</div>
                  <div className="mt-2 text-sm text-zinc-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-red-600/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-red-400/20 bg-gradient-to-br from-red-950/20 via-black to-black p-10 shadow-[0_0_60px_rgba(180,20,35,0.12)] backdrop-blur-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.14),transparent_60%)]" />

              <div className="relative flex flex-col items-center justify-center text-center">
                <img
                  src="/shadowscore-shield-enterprise-v5.png?v=hero-v5"
                  alt="ShadowScore cyber shield"
                  className="h-auto w-[260px] max-w-full object-contain drop-shadow-[0_0_34px_rgba(220,38,38,0.22)] md:w-[300px]"
                />

                <div className="mt-8 text-4xl font-extrabold tracking-tight md:text-5xl">
                  SHADOW<span className="text-red-400">SCORE</span>
                </div>

                <div className="mt-4 text-sm font-semibold uppercase tracking-[0.42em] text-zinc-400">
                  Marketplace Risk Intelligence
                </div>

                <div className="mt-8 h-px w-full max-w-md bg-gradient-to-r from-transparent via-red-500 to-transparent" />

                <div className="mt-6 text-xs font-black uppercase tracking-[0.35em] text-zinc-300">
                  Saving seller accounts before enforcement
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-black/70 p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                    Live Risk Terminal
                  </div>
                  <div className="mt-2 text-3xl font-bold">ShadowScore Monitor</div>
                </div>
                <div className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-red-300">
                  Elevated
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-5">
                {[
                  ["Marketplace Trust", "72", "Elevated Risk"],
                  ["Tracking Integrity", "61", "Degrading"],
                  ["Payout Stability", "54", "Watchlist"],
                  ["Enforcement Risk", "HIGH", "30 Day Window"],
                ].map(([title, value, label]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-black/50 p-5">
                    <div className="text-sm text-zinc-500">{title}</div>
                    <div className="mt-3 text-3xl font-bold">{value}</div>
                    <div className="mt-2 text-sm text-red-400">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-red-300">
                    Live Signal Feed
                  </div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    Active
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {signals.slice(0, 5).map((signal, index) => (
                    <div
                      key={signal}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                        index === activeSignal
                          ? "border-red-400/30 bg-red-500/10 text-white"
                          : "border-white/5 bg-black/40 text-zinc-500"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          index === activeSignal ? "bg-red-500" : "bg-zinc-700"
                        }`}
                      />
                      {signal}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-[36px] border border-white/10 bg-white/[0.025] hover:border-white/20 p-10 backdrop-blur-xl">
          <div className="text-center">
            <div className="text-sm uppercase tracking-[0.35em] text-red-400">
              ShadowScore Network Intelligence
            </div>

            <p className="mt-4 text-zinc-500">
              Early Access Network Metrics. Metrics shown for demonstration during early access.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3 lg:grid-cols-6">
            {[
              ["496", "Stores Reviewed", "+11 today", "+76 this month"],
              ["72", "Risk Events", "+7 today", "+32 this month"],
              ["50", "Alerts Sent", "+6 today", "+27 this month"],
              ["29", "Sellers Stabilized", "+5 today", "+22 this month"],
              ["$184K", "Exposure Monitored", "+$9K today", "+$41K this month"],
              ["6", "Markets Covered", "active", "monitoring"],
            ].map(([value, label, daily, monthly]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-black/70 p-7 transition hover:border-red-400/30">
                <div className="text-4xl font-bold">{value}</div>
                <div className="mt-3 text-zinc-400">{label}</div>
                <div className="mt-6 text-emerald-400">{daily}</div>
                <div className="mt-2 text-red-400">{monthly}</div>
                <div className="mt-6 h-14 rounded-xl bg-gradient-to-r from-black via-red-900 to-black opacity-80" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="agent" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.35em] text-red-400">The Agent</div>
          <h2 className="mt-6 text-4xl font-bold">A Seller Defense Agent, Not Another Dashboard</h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["01", "Observe", "Detects marketplace exposure across operational behavior, trust signals and fulfillment consistency."],
            ["02", "Score", "Translates invisible marketplace signals into a private risk view."],
            ["03", "Warn", "Warns before exposure becomes a payout hold, account review or restriction."],
            ["04", "Prepare", "Shows what to stabilize before the marketplace acts."],
          ].map(([num, title, text]) => (
            <div key={title} className="rounded-[28px] border border-white/10 bg-white/[0.025] hover:border-white/20 p-8 backdrop-blur-xl">
              <div className="text-5xl font-bold text-white">{num}</div>
              <div className="mt-6 text-3xl font-bold">{title}</div>
              <p className="mt-5 leading-relaxed text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="signals" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.35em] text-red-400">Signal Engine</div>
          <h2 className="mt-6 text-4xl font-bold">Marketplace Enforcement Starts Before The Warning</h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["01", "Tracking Integrity", "Late uploads, TBA exposure, invalid scans, carrier mismatch and weak proof of delivery."],
            ["02", "Velocity Risk", "Sudden sales growth, category spikes, new account pressure and fulfillment instability."],
            ["03", "Trust Decay", "Buyer sentiment, INR activity, refund drift, payout friction and support routing changes."],
            ["04", "Operational Exposure", "SKU churn, source dependency, fulfillment gaps and account stability signals."],
            ["05", "Review Exposure", "Identifies elevated similarity to accounts that later entered review or restriction."],
            ["06", "Action Layer", "Direct actions before damage reaches account health or payout systems."],
          ].map(([num, title, text]) => (
            <div key={title} className="rounded-[28px] border border-white/10 bg-white/[0.025] hover:border-white/20 p-8 backdrop-blur-xl">
              <div className="text-sm font-bold text-white">{num}</div>
              <div className="mt-5 text-2xl font-black">{title}</div>
              <p className="mt-4 leading-relaxed text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="guarantee" className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[36px] border border-red-400/20 bg-red-500/10 p-10 shadow-[0_0_50px_rgba(255,0,0,0.12)]">
          <div className="text-sm uppercase tracking-[0.35em] text-red-400">30-Day Risk Protection</div>
          <h2 className="mt-6 text-4xl font-bold">First Paid Audit Protected For 30 Days</h2>
          <p className="mt-6 max-w-4xl text-lg leading-relaxed text-zinc-300">
            If a first-time paid audit fails to identify elevated marketplace exposure signals and a new restriction or payout review occurs within 30 days, ShadowScore refunds the audit fee.
          </p>
          <p className="mt-5 text-zinc-500">
            Applies to first-time audits only. Existing warnings must be disclosed. Recommended actions must be followed. Future scans do not include first-audit protection.
          </p>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.35em] text-red-400">Pricing</div>
          <h2 className="mt-6 text-4xl font-bold">Built For Sellers Who Cannot Afford To Lose The Account</h2>
          <p className="mx-auto mt-5 max-w-3xl text-zinc-500">
            Choose a plan. The selected plan gets a red security frame and is included automatically in the WhatsApp audit request.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {[
            {
              name: "Exposure Intelligence",
              price: "$199",
              tag: "Most Popular",
              sub: "one time",
              desc: "Private marketplace exposure review for one seller account.",
              items: ["Hidden exposure review", "Marketplace risk summary", "Tracking integrity review", "30 day risk outlook", "Seller protection recommendations", "30 day protection"],
              button: "Request Audit",
            },
            {
              name: "Continuous Monitoring",
              price: "$299",
              tag: "",
              sub: "per month",
              desc: "Monthly monitoring for active marketplace operators.",
              items: ["Weekly monitoring", "Behavioral drift tracking", "Tracking integrity analysis", "Priority alerts", "Monthly recommendations"],
              button: "Start Monitoring",
            },
            {
              name: "Agency Intelligence",
              price: "$1,499",
              tag: "",
              sub: "per month",
              desc: "For agencies and multi-store operators.",
              items: ["Multi-account monitoring", "Cross-marketplace exposure tracking", "Founder access", "Private intelligence playbooks", "Custom reporting"],
              button: "Talk To Us",
            },
          ].map((plan) => (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan.name)}
              className={`flex min-h-[660px] cursor-pointer flex-col justify-between rounded-[30px] border p-7 transition-all duration-300 ${
                selectedPlan === plan.name
                  ? "border-red-400 bg-red-500/5 shadow-[0_0_50px_rgba(255,0,0,0.25)]"
                  : "border-white/10 bg-white/[0.025] hover:border-white/20"
              }`}
            >
              {plan.tag && (
                <div className="mb-6 inline-flex rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white">
                  {plan.tag}
                </div>
              )}

              <div className="text-3xl font-bold">{plan.name}</div>
              <div className="mt-6 text-6xl font-bold text-white">{plan.price}</div>
              <div className="mt-2 text-sm uppercase tracking-[0.2em] text-zinc-500">{plan.sub}</div>
              <div className="mt-5 text-zinc-400">{plan.desc}</div>

              <div className="mt-8 space-y-4">
                {plan.items.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 text-red-400">✓</div>
                    <div className="text-zinc-300">{item}</div>
                  </div>
                ))}
              </div>

              <button className="mt-10 w-full rounded-2xl bg-red-600 py-4 font-black transition hover:bg-red-500">
                {plan.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-red-950/40 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.12),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-red-400/30 bg-red-500/10 px-5 py-2 text-sm uppercase tracking-[0.25em] text-red-300">
              Active Marketplace Intelligence Network
            </div>
            <h2 className="mt-6 text-3xl font-bold text-white md:text-5xl">Platforms Under Behavioral Monitoring</h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-zinc-400">
              ShadowScore monitors marketplace exposure across multiple seller ecosystems before visible enforcement actions happen.
            </p>
          </div>

          <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-red-400/20 bg-black/80 shadow-[0_0_50px_rgba(255,0,0,0.16)]">
            <img
              src="/marketplaces-monitor-enterprise-v5.png?v=market-v5"
              alt="Marketplaces monitored by ShadowScore including eBay, Amazon, Walmart, SHEIN, TikTok Shop and Etsy"
              className="h-auto w-full grayscale transition duration-700 hover:grayscale-0 hover:saturate-125"
            />
          </div>

          <div className="mt-12 text-center text-sm text-zinc-500">
            Marketplace names are displayed for monitoring coverage only. ShadowScore is independent and not affiliated with these platforms.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.35em] text-red-400">FAQ</div>
          <h2 className="mt-6 text-4xl font-bold">
            Questions Sellers Ask Before They Realize The Risk Is Already Building
          </h2>
        </div>

        <div className="mt-16 space-y-5">
          {visibleFaq.map((faq) => (
            <details key={faq.q} className="rounded-3xl border border-white/10 bg-white/[0.025] hover:border-white/20 p-8">
              <summary className="cursor-pointer text-xl font-bold">{faq.q}</summary>
              <p className="mt-5 leading-relaxed text-zinc-400">{faq.a}</p>
            </details>
          ))}
        </div>

        {!showMoreFaq && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setShowMoreFaq(true)}
              className="rounded-2xl border border-white/10 px-8 py-4 transition hover:border-red-400/30"
            >
              Show More Questions
            </button>
          </div>
        )}
      </section>

      <section id="contact" className="mx-auto max-w-5xl px-6 py-24 text-center">
        <div className="rounded-[40px] border border-red-400/20 bg-black/70 p-14 backdrop-blur-xl">
          <div className="text-sm uppercase tracking-[0.35em] text-red-400">Contact ShadowScore</div>
          <h2 className="mt-6 text-4xl font-bold">Speak With The Risk Agent</h2>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            Private early-access reviews for marketplace sellers, agencies and multi-store operators.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-5 md:flex-row">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              className="rounded-2xl bg-red-600 px-10 py-5 font-black shadow-[0_0_40px_rgba(255,0,0,0.25)] transition hover:bg-red-500"
            >
              Open WhatsApp Chat
            </a>

            <a
              href="mailto:help@shadowscore.io"
              className="rounded-2xl border border-white/10 px-10 py-5 text-zinc-300 transition hover:border-red-400/30"
            >
              help@shadowscore.io
            </a>
          </div>
        </div>

        <div className="mt-12 text-sm text-zinc-600">
          ShadowScore © 2026 · Marketplace Risk Intelligence
        </div>
      </section>

      {showScanner && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 px-6 backdrop-blur-xl">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-red-400/20 bg-black p-10">
            <div className="text-sm uppercase tracking-[0.25em] text-red-400">Elevated Exposure Detected</div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] hover:border-white/20 p-5">
              <div className="text-sm text-zinc-500">Store URL</div>
              <div className="mt-3 break-all text-xl">{scanText}</div>
            </div>

            <div className="mt-8 space-y-4 text-zinc-400">
              <div>● Reading marketplace signals</div>
              <div>● Checking tracking exposure</div>
              <div>● Analyzing review exposure</div>
              <div>● Preparing private audit request</div>
            </div>

            <div className="mt-10 rounded-3xl border border-red-400/20 bg-red-500/10 p-8">
              <div className="text-7xl font-bold text-white">72</div>
              <div className="mt-4 text-3xl font-bold">Elevated Exposure Preview</div>
              <p className="mt-5 leading-relaxed text-zinc-400">
                This public scan is intentionally limited. A full private audit requires store context, screenshots and operational exports.
              </p>
            </div>

            <button
              onClick={() => setShowScanner(false)}
              className="mt-8 w-full rounded-2xl border border-white/10 px-8 py-4 transition hover:border-red-400/30"
            >
              Back To Site
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
