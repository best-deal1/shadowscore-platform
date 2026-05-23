"use client";

import { useEffect, useMemo, useState } from "react";

const whatsappNumber = "9720557293979";

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
      "Etsy · Seller safety exposure detected",
      "Amazon · Increased review exposure probability",
    ],
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSignal((current) => (current + 1) % rotatingSignals.length);
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
      a: "Yes. Agency plans support multi-account operational monitoring.",
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
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const handleScan = () => {
    if (!scanText.trim()) return;

    setShowScanner(true);

    setTimeout(() => {
      openWhatsApp();
    }, 2600);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.08] bg-[linear-gradient(to_right,#ff000015_1px,transparent_1px),linear-gradient(to_bottom,#ff000015_1px,transparent_1px)] bg-[size:70px_70px]" />

      <header className="sticky top-0 z-50 border-b border-red-950/30 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-500/40 bg-black shadow-[0_0_28px_rgba(255,0,0,0.28)]">
              <div className="absolute inset-2 rounded-xl border-l-2 border-r-2 border-red-600/80" />
              <span className="relative text-2xl font-black">S</span>
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

          <nav className="hidden items-center gap-10 text-zinc-400 md:flex">
            <a href="#signals" className="transition hover:text-white">Signals</a>
            <a href="#agent" className="transition hover:text-white">Agent</a>
            <a href="#guarantee" className="transition hover:text-white">Guarantee</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#contact" className="transition hover:text-white">Contact</a>
          </nav>

          <a
            href="#pricing"
            className="rounded-2xl bg-red-600 px-7 py-4 font-bold shadow-[0_0_30px_rgba(255,0,0,0.35)] transition hover:bg-red-500"
          >
            Get Audit
          </a>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-24">
        <div className="absolute right-0 top-0 h-[700px] w-[700px] rounded-full bg-red-700/10 blur-3xl" />

        <div className="grid items-center gap-20 lg:grid-cols-2">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2 text-sm text-red-300">
              ● Marketplace Behavioral Intelligence Active
            </div>

            <h1 className="text-6xl font-black leading-[0.95] tracking-tight md:text-7xl">
              The Marketplace Already Decided You're Risky.
              <span className="mt-3 block text-red-500">ShadowScore Tells You First.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-relaxed text-zinc-400">
              ShadowScore detects silent marketplace exposure before enforcement systems react.
            </p>

            <p className="mt-5 max-w-2xl text-lg text-zinc-500">
              Silent trust decay can start weeks before payout holds, account reviews or restrictions.
            </p>

            <div className="mt-10 rounded-[28px] border border-white/10 bg-black/60 p-6 shadow-[0_0_40px_rgba(255,0,0,0.12)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 md:flex-row">
                <input
                  value={scanText}
                  onChange={(e) => setScanText(e.target.value)}
                  placeholder="Paste store URL or seller username"
                  className="flex-1 rounded-2xl border border-white/10 bg-black px-6 py-5 text-lg outline-none focus:border-red-500"
                />

                <button
                  onClick={handleScan}
                  className="rounded-2xl bg-red-600 px-10 py-5 text-lg font-black shadow-[0_0_30px_rgba(255,0,0,0.35)] transition hover:bg-red-500"
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
                className="rounded-2xl border border-red-500/30 bg-red-500/10 px-8 py-4 font-bold transition hover:bg-red-500/20"
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
                <div key={label} className="rounded-2xl border border-white/10 bg-black/60 p-4">
                  <div className="text-2xl font-black text-red-500 md:text-3xl">{value}</div>
                  <div className="mt-2 text-sm text-zinc-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-red-600/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-red-500/20 bg-black/70 shadow-[0_0_70px_rgba(255,0,0,0.18)] backdrop-blur-xl">
              <img
                src="/shadowscore-main-logo.jpg"
                alt="ShadowScore Marketplace Risk Intelligence"
                className="h-auto w-full object-cover"
              />
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-black/70 p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                    Live Risk Terminal
                  </div>
                  <div className="mt-2 text-3xl font-black">ShadowScore Monitor</div>
                </div>
                <div className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-300">
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
                    <div className="mt-3 text-4xl font-black">{value}</div>
                    <div className="mt-2 text-sm text-red-400">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-red-300">
                    Live Signal Feed
                  </div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
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

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-[36px] border border-white/10 bg-black/60 p-10 backdrop-blur-xl">
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
              ["488", "Stores Reviewed", "+8 today", "+64 this month"],
              ["64", "Risk Events", "+3 today", "+20 this month"],
              ["42", "Alerts Sent", "+2 today", "+15 this month"],
              ["21", "Sellers Stabilized", "+1 today", "+10 this month"],
              ["$184K", "Exposure Monitored", "+$9K today", "+$41K this month"],
              ["6", "Markets Covered", "active", "monitoring"],
            ].map(([value, label, daily, monthly]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-black/70 p-7 transition hover:border-red-500/30">
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

      <section id="agent" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.35em] text-red-400">The Agent</div>
          <h2 className="mt-6 text-5xl font-black">A Seller Defense Agent, Not Another Dashboard</h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["01", "Observe", "Detects marketplace exposure across operational behavior, trust signals and fulfillment consistency."],
            ["02", "Score", "Translates invisible marketplace signals into a private risk view."],
            ["03", "Warn", "Warns before exposure becomes a payout hold, account review or restriction."],
            ["04", "Prepare", "Shows what to stabilize before the marketplace acts."],
          ].map(([num, title, text]) => (
            <div key={title} className="rounded-[28px] border border-white/10 bg-black/60 p-8 backdrop-blur-xl">
              <div className="text-5xl font-black text-red-500">{num}</div>
              <div className="mt-6 text-3xl font-black">{title}</div>
              <p className="mt-5 leading-relaxed text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="signals" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.35em] text-red-400">Signal Engine</div>
          <h2 className="mt-6 text-5xl font-black">Marketplace Enforcement Starts Before The Warning</h2>
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
            <div key={title} className="rounded-[28px] border border-white/10 bg-black/60 p-8 backdrop-blur-xl">
              <div className="text-sm font-black text-red-500">{num}</div>
              <div className="mt-5 text-2xl font-black">{title}</div>
              <p className="mt-4 leading-relaxed text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="guarantee" className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[36px] border border-red-500/20 bg-red-500/10 p-10 shadow-[0_0_50px_rgba(255,0,0,0.12)]">
          <div className="text-sm uppercase tracking-[0.35em] text-red-400">30-Day Risk Protection</div>
          <h2 className="mt-6 text-5xl font-black">First Paid Audit Protected For 30 Days</h2>
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
          <h2 className="mt-6 text-5xl font-black">Built For Sellers Who Cannot Afford To Lose The Account</h2>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {[
            {
              name: "Risk Audit",
              price: "$199",
              tag: "Most Popular",
              desc: "Private marketplace exposure review for one seller account.",
              items: ["Hidden risk review", "Marketplace exposure analysis", "Tracking integrity review", "30 day risk outlook", "Seller protection recommendations", "30 day protection"],
              button: "Request Audit",
            },
            {
              name: "Pro Monitor",
              price: "$299",
              tag: "",
              desc: "Monthly monitoring for active marketplace operators.",
              items: ["Weekly monitoring", "Behavioral drift tracking", "Tracking integrity analysis", "Priority alerts", "Monthly recommendations"],
              button: "Start Monitoring",
            },
            {
              name: "Agency",
              price: "$1,499",
              tag: "",
              desc: "For agencies and multi-store operators.",
              items: ["Multi-account monitoring", "Cross-marketplace exposure tracking", "Founder access", "Private intelligence playbooks", "Custom reporting"],
              button: "Talk To Us",
            },
          ].map((plan) => (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan.name)}
              className={`cursor-pointer rounded-[32px] border p-10 transition-all duration-300 ${
                selectedPlan === plan.name
                  ? "border-red-500 bg-red-500/5 shadow-[0_0_50px_rgba(255,0,0,0.25)]"
                  : "border-white/10 bg-black/60"
              }`}
            >
              {plan.tag && (
                <div className="mb-6 inline-flex rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white">
                  {plan.tag}
                </div>
              )}

              <div className="text-3xl font-black">{plan.name}</div>
              <div className="mt-6 text-6xl font-black text-red-500">{plan.price}</div>
              <div className="mt-5 text-zinc-400">{plan.desc}</div>

              <div className="mt-8 space-y-4">
                {plan.items.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 text-red-500">✓</div>
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
            <div className="inline-flex items-center gap-3 rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2 text-sm uppercase tracking-[0.25em] text-red-300">
              Active Marketplace Intelligence Network
            </div>
            <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">Platforms Under Behavioral Monitoring</h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-zinc-400">
              ShadowScore monitors marketplace exposure across multiple seller ecosystems before visible enforcement actions happen.
            </p>
          </div>

          <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-red-500/20 bg-black/80 shadow-[0_0_50px_rgba(255,0,0,0.16)]">
            <img
              src="/marketplaces-monitor.jpg"
              alt="Marketplaces monitored by ShadowScore including eBay, Amazon, Walmart, SHEIN, TikTok Shop and Etsy"
              className="h-auto w-full object-cover"
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
          <h2 className="mt-6 text-5xl font-black">
            Questions Sellers Ask Before They Realize The Risk Is Already Building
          </h2>
        </div>

        <div className="mt-16 space-y-5">
          {visibleFaq.map((faq) => (
            <details key={faq.q} className="rounded-3xl border border-white/10 bg-black/60 p-8">
              <summary className="cursor-pointer text-xl font-bold">{faq.q}</summary>
              <p className="mt-5 leading-relaxed text-zinc-400">{faq.a}</p>
            </details>
          ))}
        </div>

        {!showMoreFaq && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setShowMoreFaq(true)}
              className="rounded-2xl border border-white/10 px-8 py-4 transition hover:border-red-500/30"
            >
              Show More Questions
            </button>
          </div>
        )}
      </section>

      <section id="contact" className="mx-auto max-w-5xl px-6 py-24 text-center">
        <div className="rounded-[40px] border border-red-500/20 bg-black/70 p-14 backdrop-blur-xl">
          <div className="text-sm uppercase tracking-[0.35em] text-red-400">Contact ShadowScore</div>
          <h2 className="mt-6 text-5xl font-black">Speak With The Risk Agent</h2>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            Private early-access reviews for marketplace sellers, agencies and multi-store operators.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-5 md:flex-row">
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              className="rounded-2xl bg-red-600 px-10 py-5 font-black shadow-[0_0_40px_rgba(255,0,0,0.25)] transition hover:bg-red-500"
            >
              Open WhatsApp Chat
            </a>

            <a
              href="mailto:help@shadowscore.io"
              className="rounded-2xl border border-white/10 px-10 py-5 text-zinc-300 transition hover:border-red-500/30"
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
          <div className="w-full max-w-2xl rounded-[32px] border border-red-500/20 bg-black p-10">
            <div className="text-sm uppercase tracking-[0.25em] text-red-400">Elevated Exposure Detected</div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-5">
              <div className="text-sm text-zinc-500">Store URL</div>
              <div className="mt-3 break-all text-xl">{scanText}</div>
            </div>

            <div className="mt-8 space-y-4 text-zinc-400">
              <div>● Reading marketplace signals</div>
              <div>● Checking tracking exposure</div>
              <div>● Analyzing review exposure</div>
              <div>● Preparing private audit request</div>
            </div>

            <div className="mt-10 rounded-3xl border border-red-500/20 bg-red-500/10 p-8">
              <div className="text-7xl font-black text-red-500">72</div>
              <div className="mt-4 text-3xl font-black">Elevated Exposure Preview</div>
              <p className="mt-5 leading-relaxed text-zinc-400">
                This public scan is intentionally limited. A full private audit requires store context, screenshots and operational exports.
              </p>
            </div>

            <button
              onClick={() => setShowScanner(false)}
              className="mt-8 w-full rounded-2xl border border-white/10 px-8 py-4 transition hover:border-red-500/30"
            >
              Back To Site
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
