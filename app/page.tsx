"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState("Risk Audit");
  const [scanText, setScanText] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [activeSignal, setActiveSignal] = useState(0);
  const [showMoreFaq, setShowMoreFaq] = useState(false);

  const rotatingSignals = useMemo(
    () => [
      "Amazon · Tracking upload delay increased",
      "eBay · Tracking integrity drift detected",
      "Walmart · Payout exposure watchlist",
      "TikTok Shop · Seller velocity anomaly detected",
      "Etsy · Behavioral trust degradation identified",
      "Amazon · Increased review exposure probability",
    ],
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSignal((prev) => (prev + 1) % rotatingSignals.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [rotatingSignals]);

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
      a: "ShadowScore focuses on marketplace behavioral intelligence and operational exposure monitoring.",
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
      a: "Yes. Agency plans support multi-account operational monitoring.",
    },
    {
      q: "Do you store marketplace credentials?",
      a: "No marketplace credentials are requested during initial reviews.",
    },
  ];

  const visibleFaq = showMoreFaq ? faqItems : faqItems.slice(0, 4);

  const handleScan = () => {
    if (!scanText) return;

    setShowScanner(true);

    setTimeout(() => {
      const message = `ShadowScore Audit Request

Store:
${scanText}

Selected Plan:
${selectedPlan}

I would like a private marketplace exposure audit.`;

      window.open(
        `https://wa.me/9720557293979?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    }, 2500);
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 opacity-[0.08] pointer-events-none bg-[linear-gradient(to_right,#ff000015_1px,transparent_1px),linear-gradient(to_bottom,#ff000015_1px,transparent_1px)] bg-[size:70px_70px]" />

      <header className="sticky top-0 z-50 border-b border-red-950/30 bg-black/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-red-600/30 blur-xl" />
              <img
                src="/shadowscore-shield-logo.png"
                alt="ShadowScore"
                className="relative h-16 w-16 rounded-2xl object-cover border border-red-500/40 shadow-[0_0_28px_rgba(255,0,0,0.35)]"
              />
            </div>

            <div className="leading-none">
              <div className="text-3xl font-black tracking-tight">
                Shadow<span className="text-red-500">Score</span>
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.38em] text-zinc-500">
                Risk Intelligence
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-zinc-400">
            <a href="#signals" className="hover:text-white transition">
              Signals
            </a>
            <a href="#agent" className="hover:text-white transition">
              Agent
            </a>
            <a href="#guarantee" className="hover:text-white transition">
              Guarantee
            </a>
            <a href="#pricing" className="hover:text-white transition">
              Pricing
            </a>
            <a href="#contact" className="hover:text-white transition">
              Contact
            </a>
          </nav>

          <a
            href="#pricing"
            className="rounded-2xl bg-red-600 hover:bg-red-500 transition px-7 py-4 font-bold shadow-[0_0_30px_rgba(255,0,0,0.35)]"
          >
            Get Audit
          </a>
        </div>
      </header>

      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-16">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-red-700/10 blur-3xl rounded-full" />

        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 border border-red-500/30 bg-red-500/10 px-5 py-2 rounded-full text-red-300 text-sm mb-8">
              ● Marketplace Behavioral Intelligence Active
            </div>

            <h1 className="text-6xl md:text-7xl font-black leading-[0.95] tracking-tight">
              The Marketplace Already Decided You're Risky.
              <span className="text-red-500 block mt-3">
                ShadowScore Tells You First.
              </span>
            </h1>

            <p className="mt-8 text-xl text-zinc-400 leading-relaxed max-w-2xl">
              ShadowScore detects silent marketplace exposure before enforcement
              systems react.
            </p>

            <p className="mt-5 text-zinc-500 text-lg max-w-2xl">
              Silent trust decay can start weeks before payout holds, account
              reviews or restrictions.
            </p>

            <div className="mt-10 border border-white/10 bg-black/60 rounded-[28px] p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(255,0,0,0.12)]">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  value={scanText}
                  onChange={(e) => setScanText(e.target.value)}
                  placeholder="Paste store URL or seller username"
                  className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-5 text-lg outline-none focus:border-red-500"
                />

                <button
                  onClick={handleScan}
                  className="bg-red-600 hover:bg-red-500 transition rounded-2xl px-10 py-5 text-lg font-black shadow-[0_0_30px_rgba(255,0,0,0.35)]"
                >
                  Scan My Store
                </button>
              </div>

              <div className="mt-5 text-zinc-500 text-sm">
                No password required • First paid audit includes 30-Day Risk
                Protection
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
              <a
                href="#pricing"
                className="rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition px-8 py-4 font-bold"
              >
                Request Private Audit
              </a>

              <a
                href="#pricing"
                className="rounded-2xl border border-white/10 hover:border-white/20 transition px-8 py-4 font-bold text-zinc-300"
              >
                View Pricing
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-10 max-w-2xl">
              {[
                ["30 Days", "Risk Protection"],
                ["$199", "First Audit"],
                ["No Login", "Password Needed"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/60 p-4">
                  <div className="text-2xl md:text-3xl font-black text-red-500">{value}</div>
                  <div className="text-zinc-400 mt-2 text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 bg-red-600/20 blur-3xl rounded-full" />

            <div className="relative overflow-hidden rounded-[32px] border border-red-500/20 bg-black/70 backdrop-blur-xl shadow-[0_0_70px_rgba(255,0,0,0.18)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.20),transparent_58%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,0,0,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />

              <div className="relative flex flex-col items-center justify-center px-8 py-12 text-center">
                <img
                  src="/shadowscore-shield-logo.png"
                  alt="ShadowScore"
                  className="h-64 w-64 rounded-[36px] object-cover shadow-[0_0_80px_rgba(255,0,0,0.35)]"
                />

                <div className="mt-8 text-5xl font-black tracking-tight">
                  SHADOW<span className="text-red-500">SCORE</span>
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
                  <div className="text-zinc-500 uppercase tracking-[0.25em] text-xs">
                    Live Risk Terminal
                  </div>

                  <div className="text-3xl font-black mt-2">
                    ShadowScore Monitor
                  </div>
                </div>

                <div className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-300">
                  Elevated
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 mt-8">
                {[
                  ["Marketplace Trust", "72", "Elevated Risk"],
                  ["Tracking Integrity", "61", "Degrading"],
                  ["Payout Stability", "54", "Watchlist"],
                  ["Enforcement Risk", "HIGH", "30 Day Window"],
                ].map(([title, value, label]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-black/50 p-5"
                  >
                    <div className="text-zinc-500 text-sm">{title}</div>

                    <div className="text-4xl font-black mt-3">{value}</div>

                    <div className="text-red-400 mt-2 text-sm">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-red-300 uppercase tracking-[0.2em] text-xs">
                    Live Signal Feed
                  </div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Active
                  </div>
                </div>

                <div className="mt-4 text-xl font-semibold text-white transition-all duration-500">
                  {rotatingSignals[activeSignal]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="rounded-[36px] border border-white/10 bg-black/60 backdrop-blur-xl p-10">
          <div className="text-center">
            <div className="text-red-400 tracking-[0.35em] uppercase text-sm">
              ShadowScore Network Intelligence
            </div>

            <p className="mt-4 text-zinc-500">
              Early Access Network Metrics. Metrics shown for demonstration
              during early access.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mt-10">
            {[
              ["488", "Stores Reviewed", "+8 today", "+64 this month"],
              ["64", "Risk Events", "+3 today", "+20 this month"],
              ["42", "Alerts Sent", "+2 today", "+15 this month"],
              ["21", "Sellers Stabilized", "+1 today", "+10 this month"],
              ["$184K", "Exposure Monitored", "+$9K today", "+$41K this month"],
              ["6", "Markets Covered", "active", "monitoring"],
            ].map(([value, label, daily, monthly]) => (
              <div
                key={label}
                className="rounded-3xl border border-white/10 bg-black/70 p-7 hover:border-red-500/30 transition"
              >
                <div className="text-5xl font-black">{value}</div>

                <div className="mt-3 text-zinc-400">{label}</div>

                <div className="mt-6 text-emerald-400">{daily}</div>

                <div className="mt-2 text-red-400">{monthly}</div>

                <div className="mt-6 h-14 rounded-xl bg-gradient-to-r from-black via-red-900 to-black opacity-80" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="agent" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center">
          <div className="text-red-400 tracking-[0.35em] uppercase text-sm">
            The Agent
          </div>

          <h2 className="mt-6 text-5xl font-black">
            A Seller Defense Agent, Not Another Dashboard
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {[
            [
              "01",
              "Observe",
              "Detects marketplace exposure across operational behavior, trust signals and fulfillment consistency.",
            ],
            [
              "02",
              "Score",
              "Translates invisible marketplace signals into a private risk view.",
            ],
            [
              "03",
              "Warn",
              "Warns before exposure becomes a payout hold, account review or restriction.",
            ],
            [
              "04",
              "Prepare",
              "Shows what to stabilize before the marketplace acts.",
            ],
          ].map(([num, title, text]) => (
            <div
              key={title}
              className="rounded-[28px] border border-white/10 bg-black/60 p-8 backdrop-blur-xl"
            >
              <div className="text-red-500 text-5xl font-black">{num}</div>

              <div className="mt-6 text-3xl font-black">{title}</div>

              <p className="mt-5 text-zinc-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="signals" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center">
          <div className="text-red-400 tracking-[0.35em] uppercase text-sm">
            Signal Engine
          </div>

          <h2 className="mt-6 text-5xl font-black">
            Marketplace Enforcement Starts Before The Warning
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {[
            ["01", "Tracking Integrity", "Late uploads, TBA exposure, invalid scans, carrier mismatch and weak proof of delivery."],
            ["02", "Velocity Risk", "Sudden sales growth, category spikes, new account pressure and fulfillment instability."],
            ["03", "Trust Decay", "Buyer sentiment, INR activity, refund drift, payout friction and support routing changes."],
            ["04", "Operational Exposure", "SKU churn, source dependency, fulfillment gaps and account stability signals."],
            ["05", "Review Exposure", "Identifies elevated similarity to accounts that later entered review or restriction."],
            ["06", "Action Layer", "Direct actions before damage reaches account health or payout systems."],
          ].map(([num, title, text]) => (
            <div key={title} className="rounded-[28px] border border-white/10 bg-black/60 p-8 backdrop-blur-xl">
              <div className="text-red-500 text-sm font-black">{num}</div>
              <div className="mt-5 text-2xl font-black">{title}</div>
              <p className="mt-4 text-zinc-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="guarantee" className="max-w-7xl mx-auto px-6 py-20">
        <div className="rounded-[36px] border border-red-500/20 bg-red-500/10 p-10 shadow-[0_0_50px_rgba(255,0,0,0.12)]">
          <div className="text-red-400 tracking-[0.35em] uppercase text-sm">
            30-Day Risk Protection
          </div>

          <h2 className="mt-6 text-5xl font-black">
            First Paid Audit Protected For 30 Days
          </h2>

          <p className="mt-6 text-zinc-300 text-lg leading-relaxed max-w-4xl">
            If a first-time paid audit fails to identify elevated marketplace
            exposure signals and a new restriction or payout review occurs within
            30 days, ShadowScore refunds the audit fee.
          </p>

          <p className="mt-5 text-zinc-500">
            Applies to first-time audits only. Existing warnings must be
            disclosed. Recommended actions must be followed. Future scans do not
            include first-audit protection.
          </p>
        </div>
      </section>

      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center">
          <div className="text-red-400 tracking-[0.35em] uppercase text-sm">
            Pricing
          </div>

          <h2 className="mt-6 text-5xl font-black">
            Built For Sellers Who Cannot Afford To Lose The Account
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mt-16">
          {[
            {
              name: "Risk Audit",
              price: "$199",
              tag: "Most Popular",
              desc: "Private marketplace exposure review for one seller account.",
              items: [
                "Hidden risk review",
                "Marketplace exposure analysis",
                "Tracking integrity review",
                "30 day risk outlook",
                "Seller protection recommendations",
                "30 day protection",
              ],
              button: "Request Audit",
            },
            {
              name: "Pro Monitor",
              price: "$299",
              tag: "",
              desc: "Monthly monitoring for active marketplace operators.",
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
              name: "Agency",
              price: "$1,499",
              tag: "",
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
          ].map((plan) => (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan.name)}
              className={`rounded-[32px] border p-10 cursor-pointer transition-all duration-300 ${
                selectedPlan === plan.name
                  ? "border-red-500 shadow-[0_0_50px_rgba(255,0,0,0.25)] bg-red-500/5"
                  : "border-white/10 bg-black/60"
              }`}
            >
              {plan.tag && (
                <div className="inline-flex px-4 py-2 rounded-full bg-red-500 text-white text-sm font-bold mb-6">
                  {plan.tag}
                </div>
              )}

              <div className="text-3xl font-black">{plan.name}</div>

              <div className="mt-6 text-6xl font-black text-red-500">
                {plan.price}
              </div>

              <div className="mt-5 text-zinc-400">{plan.desc}</div>

              <div className="mt-8 space-y-4">
                {plan.items.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="text-red-500 mt-1">✓</div>
                    <div className="text-zinc-300">{item}</div>
                  </div>
                ))}
              </div>

              <button className="mt-10 w-full rounded-2xl bg-red-600 hover:bg-red-500 transition py-4 font-black">
                {plan.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="relative py-24 border-t border-red-950/40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.12),transparent_60%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-3 border border-red-500/30 bg-red-500/10 px-5 py-2 rounded-full text-red-300 text-sm tracking-[0.25em] uppercase">
              Active Marketplace Intelligence Network
            </div>

            <h2 className="mt-6 text-4xl md:text-5xl font-black text-white">
              Platforms Under Behavioral Monitoring
            </h2>

            <p className="mt-5 text-zinc-400 max-w-3xl mx-auto text-lg leading-relaxed">
              ShadowScore monitors marketplace exposure across multiple seller
              ecosystems before visible enforcement actions happen.
            </p>
          </div>

          <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-red-500/20 bg-black/80 shadow-[0_0_50px_rgba(255,0,0,0.16)]">
            <img
              src="/marketplaces-monitor.jpg"
              alt="eBay, Amazon, Walmart and SHEIN monitored by ShadowScore"
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="rounded-3xl border border-[#f1641e]/40 bg-[#f1641e]/10 p-8 text-center shadow-[0_0_35px_rgba(241,100,30,0.16)]">
              <div className="text-5xl font-black text-[#f1641e]">Etsy</div>
              <div className="mt-3 text-xs uppercase tracking-[0.25em] text-zinc-500">
                Seller safety monitoring
              </div>
            </div>

            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center shadow-[0_0_35px_rgba(255,0,0,0.16)]">
              <div className="text-4xl font-black text-white">TikTok Shop</div>
              <div className="mt-3 text-xs uppercase tracking-[0.25em] text-zinc-500">
                Shop signal monitoring
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-zinc-500 text-sm">
            Marketplace names are displayed for monitoring coverage only.
            ShadowScore is independent and not affiliated with these platforms.
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center">
          <div className="text-red-400 tracking-[0.35em] uppercase text-sm">
            FAQ
          </div>

          <h2 className="mt-6 text-5xl font-black">
            Questions Sellers Ask Before They Realize The Risk Is Already Building
          </h2>
        </div>

        <div className="mt-16 space-y-5">
          {visibleFaq.map((faq) => (
            <details
              key={faq.q}
              className="rounded-3xl border border-white/10 bg-black/60 p-8"
            >
              <summary className="cursor-pointer text-xl font-bold">
                {faq.q}
              </summary>

              <p className="mt-5 text-zinc-400 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>

        {!showMoreFaq && (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowMoreFaq(true)}
              className="rounded-2xl border border-white/10 px-8 py-4 hover:border-red-500/30 transition"
            >
              Show More Questions
            </button>
          </div>
        )}
      </section>

      <section id="contact" className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="rounded-[40px] border border-red-500/20 bg-black/70 p-14 backdrop-blur-xl">
          <div className="text-red-400 tracking-[0.35em] uppercase text-sm">
            Contact ShadowScore
          </div>

          <h2 className="mt-6 text-5xl font-black">
            Speak With The Risk Agent
          </h2>

          <p className="mt-6 text-zinc-400 text-lg leading-relaxed">
            Private early-access reviews for marketplace sellers, agencies and
            multi-store operators.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-5 mt-12">
            <a
              href="https://wa.me/9720557293979"
              target="_blank"
              className="rounded-2xl bg-red-600 hover:bg-red-500 transition px-10 py-5 font-black shadow-[0_0_40px_rgba(255,0,0,0.25)]"
            >
              Open WhatsApp Chat
            </a>

            <a
              href="mailto:help@shadowscore.io"
              className="rounded-2xl border border-white/10 px-10 py-5 text-zinc-300 hover:border-red-500/30 transition"
            >
              help@shadowscore.io
            </a>
          </div>
        </div>

        <div className="mt-12 text-zinc-600 text-sm">
          ShadowScore © 2026 · Marketplace Risk Intelligence
        </div>
      </section>

      {showScanner && (
        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center px-6">
          <div className="w-full max-w-2xl rounded-[32px] border border-red-500/20 bg-black p-10">
            <div className="text-red-400 tracking-[0.25em] uppercase text-sm">
              Elevated Exposure Detected
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-5">
              <div className="text-zinc-500 text-sm">Store URL</div>

              <div className="mt-3 text-xl break-all">{scanText}</div>
            </div>

            <div className="space-y-4 mt-8 text-zinc-400">
              <div>● Reading marketplace signals</div>
              <div>● Checking tracking exposure</div>
              <div>● Analyzing review exposure</div>
              <div>● Preparing private audit request</div>
            </div>

            <div className="mt-10 rounded-3xl border border-red-500/20 bg-red-500/10 p-8">
              <div className="text-7xl font-black text-red-500">72</div>

              <div className="text-3xl font-black mt-4">
                Elevated Exposure Preview
              </div>

              <p className="mt-5 text-zinc-400 leading-relaxed">
                This public scan is intentionally limited. A full private audit
                requires store context, screenshots and operational exports.
              </p>
            </div>

            <button
              onClick={() => setShowScanner(false)}
              className="mt-8 w-full rounded-2xl border border-white/10 px-8 py-4 hover:border-red-500/30 transition"
            >
              Back To Site
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
