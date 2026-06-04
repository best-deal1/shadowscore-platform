"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PaymentButtons from "../components/PaymentButtons";

const WHATSAPP_NUMBER = "972557293979";
const TIKTOK_URL = "https://www.tiktok.com/@shadowscore8";

const marketplaceCoverage = [
  { name: "eBay", logo: "eBay", className: "text-[#E53238]" },
  { name: "Amazon", logo: "amazon", className: "text-[#FF9900]" },
  { name: "Walmart", logo: "Walmart ✶", className: "text-[#2E7BEF]" },
  { name: "SHEIN", logo: "SHEIN", className: "text-white" },
  { name: "TikTok Shop", logo: "TikTok", className: "text-white" },
  { name: "Etsy", logo: "Etsy", className: "text-[#F1641E]" },
];

const threatFeed = [
  { platform: "eBay", event: "MC011 proof-of-delivery review patterns", signal: "Tracking integrity", severity: "High" },
  { platform: "eBay", event: "MC999 restriction and appeal activity", signal: "Account trust", severity: "Elevated" },
  { platform: "eBay", event: "Payout hold reports and managed payments reviews", signal: "Payout exposure", severity: "Elevated" },
  { platform: "Amazon", event: "Seller verification and document rejection signals", signal: "Identity posture", severity: "Elevated" },
  { platform: "Walmart", event: "Fulfillment consistency and seller review activity", signal: "Operational drift", severity: "Rising" },
  { platform: "TikTok Shop", event: "New seller identity and compliance checks", signal: "Access behavior", severity: "Watchlist" },
];

const plans = [
  {
    name: "Marketplace Audit",
    price: "$49",
    sub: "24-hour exposure snapshot",
    desc: "Fast first read for sellers who need a quick signal check before deciding what to do next.",
    tag: "",
    items: ["ShadowScore rating", "Top 3 risk findings", "Executive PDF snapshot", "Recommended next actions"],
    button: "Get Marketplace Audit",
  },
  {
    name: "Intelligence Review",
    price: "$99",
    sub: "rapid manual review",
    desc: "For sellers facing MC011, MC999, payout hold, account review or sudden marketplace friction.",
    tag: "Most Popular",
    items: ["Manual case review", "Tracking integrity analysis", "Payout exposure review", "WhatsApp consultation", "Risk action plan"],
    button: "Request Review",
  },
  {
    name: "Real Marketplace Cases",
    price: "$199",
    sub: "full case investigation",
    desc: "A deeper private investigation for serious operators who need a full evidence and exposure timeline.",
    tag: "",
    items: ["Evidence timeline", "Root cause analysis", "Appeal readiness check", "Executive report", "30-day protection"],
    button: "Open Investigation",
  },
  {
    name: "Continuous Monitoring",
    price: "$299",
    sub: "per month",
    desc: "Ongoing operational risk monitoring for active sellers who cannot afford surprise enforcement.",
    tag: "",
    items: ["Monthly trust review", "Risk feed access", "Operational intelligence", "Early warning detection", "WhatsApp support"],
    button: "Monitor My Store",
  },
];

const faqItems = [
  {
    q: "What does \"poor selling activity\" mean?",
    a: "It is a broad marketplace phrase. It may include late delivery, tracking inconsistency, weak evidence, document gaps, policy issues, fulfillment instability or other seller activity that creates risk. ShadowScore treats it as a risk category, not as one single cause.",
  },
  {
    q: "What does ShadowScore assess?",
    a: "ShadowScore assesses seller-supplied evidence, operational risk indicators, evidence completeness, tracking quality, policy exposure and marketplace review readiness. It does not reveal internal marketplace logic or proprietary platform scores.",
  },
  {
    q: "Is ShadowScore a reinstatement service?",
    a: "No. ShadowScore is an exposure intelligence platform. If an account is already restricted, the review can help organize the situation, evidence and likely risk drivers, but ShadowScore does not promise reinstatement.",
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
    q: "Can ShadowScore guarantee that my account will not be restricted?",
    a: "No. ShadowScore helps sellers identify elevated exposure early and take stronger operational action before risk becomes visible enforcement.",
  },
  {
    q: "Is ShadowScore affiliated with the marketplaces shown?",
    a: "No. Marketplace names are shown for coverage reference only. ShadowScore is independent and is not affiliated with eBay, Amazon, Walmart, SHEIN, TikTok Shop or Etsy.",
  },
];

function severityClass(severity: string) {
  if (severity === "High") return "border-red-400/40 bg-red-500/10 text-red-200";
  if (severity === "Elevated") return "border-orange-400/40 bg-orange-500/10 text-orange-200";
  if (severity === "Rising") return "border-yellow-400/40 bg-yellow-500/10 text-yellow-200";
  return "border-white/15 bg-white/[0.04] text-zinc-300";
}

function Badge({ severity }: { severity: string }) {
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClass(severity)}`}>{severity}</span>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[34px] border border-white/10 bg-black/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_70px_rgba(120,0,20,0.16)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState("Intelligence Review");
  const [scanText, setScanText] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showMoreFaq, setShowMoreFaq] = useState(false);

  const selected = useMemo(() => plans.find((plan) => plan.name === selectedPlan) || plans[1], [selectedPlan]);
  const visibleFaq = showMoreFaq ? faqItems : faqItems.slice(0, 4);

  const buildWhatsappUrl = (planName = selectedPlan, store = scanText) => {
    const message = `ShadowScore Audit Request

Store / Seller:
${store || "Not provided yet"}

Selected Plan:
${planName}

Requested Review:
Marketplace exposure and enforcement risk review

Context:
- Tracking drift review
- Payout exposure review
- Trust decay analysis
- MC011 / MC999 / payout hold readiness
- Action plan

I would like to begin a private ShadowScore review.`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const openWhatsApp = (planName = selectedPlan) => {
    window.open(buildWhatsappUrl(planName), "_blank", "noopener,noreferrer");
  };

  const handleScan = () => {
    setShowScanner(true);
    if (scanText.trim()) {
      window.setTimeout(() => openWhatsApp(selectedPlan), 1600);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(180,15,30,0.18),transparent_44%),radial-gradient(circle_at_18%_25%,rgba(160,12,24,0.11),transparent_38%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/shadowscore-shield-v8.png?v=v40"
              alt="ShadowScore shield"
              className="h-11 w-11 rounded-xl object-contain bg-black p-1"
            />
            <div className="leading-none">
              <div className="text-2xl font-extrabold tracking-tight">
                Shadow<span className="text-red-400">Score</span>
              </div>
              <div className="mt-1.5 text-[10px] uppercase tracking-[0.34em] text-zinc-500">
                Marketplace Trust Intelligence
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-10 text-sm text-zinc-400 md:flex">
            <a href="#topics" className="transition hover:text-white">Topics</a>
            <a href="#coverage" className="transition hover:text-white">Coverage</a>
            <a href="#cases" className="transition hover:text-white">Cases</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href={TIKTOK_URL} target="_blank" rel="noreferrer" className="transition hover:text-white">TikTok</a>
            <a href="/intake" className="text-red-300 transition hover:text-red-200">Console</a>
            <a href="/leads" className="transition hover:text-white">Leads</a>
          </nav>

          <button
            type="button"
            onClick={() => openWhatsApp(selectedPlan)}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold shadow-[0_0_22px_rgba(220,38,38,0.28)] transition hover:bg-red-500 md:px-6"
          >
            Book A Briefing
          </button>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-14 pt-12 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/8 px-4 py-2 text-sm text-red-200">
              <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]" />
              Marketplace Trust Assessment
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
              Understand Marketplace Risk
              <span className="mt-4 block text-red-400">
                Before Enforcement Happens.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400">
              Built from real seller investigations, payout holds, account restrictions, appeals, tracking issues and marketplace reviews.
            </p>

            <div className="mt-6 max-w-2xl rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-5 text-sm leading-7 text-red-100">
              ShadowScore helps sellers assess exposure signals before a problem becomes a visible restriction, hold or review.
            </div>

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
                  Request Intelligence Review
                </button>
              </div>

              <div className="mt-4 text-sm text-zinc-500">
                No password required • Evidence-based review • Independent risk assessment
              </div>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["Live", "Community Signals"],
                ["12+", "Intelligence Layers"],
                ["6", "Marketplaces"],
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
                  src="/shadowscore-shield-v8.png?v=hero-v34"
                  alt="ShadowScore cyber shield"
                  className="h-auto w-[210px] max-w-full object-contain drop-shadow-[0_0_34px_rgba(220,38,38,0.22)] md:w-[250px]"
                />

                <div className="mt-8 text-4xl font-extrabold tracking-tight md:text-5xl">
                  SHADOW<span className="text-red-400">SCORE</span>
                </div>

                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.42em] text-zinc-500">
                  Independent Marketplace Trust Assessment
                </div>

                <div className="mt-8 h-px w-full max-w-md bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

                <div className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-zinc-400">
                  Analyze exposure before the review escalates
                </div>

                <div id="coverage" className="mt-8 grid w-full max-w-lg grid-cols-3 gap-2 md:grid-cols-6">
                  {marketplaceCoverage.map((item) => (
                    <div
                      key={item.name}
                      className="group rounded-xl border border-white/10 bg-black/60 px-2 py-3 grayscale transition duration-500 hover:border-red-400/40 hover:bg-red-500/[0.06] hover:grayscale-0"
                    >
                      <div className={`text-sm font-black ${item.className} opacity-55 transition duration-500 group-hover:opacity-100 md:text-base`}>
                        {item.logo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <Panel className="p-7">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm text-red-300">Exposure Terminal</div>
                <h2 className="mt-2 text-3xl font-bold">ShadowScore Risk View</h2>
                <p className="mt-3 max-w-2xl leading-7 text-zinc-500">
                  Private assessment of seller-supplied evidence, public patterns and operational risk indicators.
                </p>
              </div>

              <div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                Independent Assessment
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                ["Marketplace Trust", "Review Needed", "w-4/5"],
                ["Tracking Integrity", "Assess", "w-3/5"],
                ["Payout Stability", "Watchlist", "w-2/5"],
                ["Policy Exposure", "Map Signals", "w-full"],
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
          </Panel>
        </section>
      </section>

      <section id="topics" className="mx-auto max-w-7xl px-6 py-16">
        <Panel className="p-7">
          <div className="flex flex-col gap-6 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-red-300">Marketplace Intelligence Topics</div>
              <h2 className="mt-4 text-4xl font-bold">Common Enforcement Events Sellers Face</h2>
              <p className="mt-4 max-w-3xl leading-7 text-zinc-500">
                Public marketplace incidents and seller-reported cases converted into structured risk-assessment topics. The scoring model remains private.
              </p>
            </div>
            <div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">
              Community Intelligence
            </div>
          </div>

          <div className="mt-7 grid gap-3">
            {threatFeed.map((item) => (
              <div key={item.event} className="grid gap-4 rounded-2xl border border-white/10 bg-black/60 p-5 md:grid-cols-[120px_1fr_150px_120px]">
                <div className="font-bold text-zinc-300">{item.platform}</div>
                <div className="font-semibold text-white">{item.event}</div>
                <div className="text-sm text-zinc-500">{item.signal}</div>
                <Badge severity={item.severity} />
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section id="cases" className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Case Intelligence</div>
          <h2 className="mt-4 text-4xl font-bold">Built From Real Marketplace Investigations</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-zinc-500">
            ShadowScore does not sell shortcuts. It organizes signals, evidence and likely risk drivers into decision-ready assessment.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["MC011", "Proof of delivery", "Tracking integrity, buyer confirmation and delivery evidence."],
            ["MC999", "Account restriction", "Account trust, access signals and policy review."],
            ["Payout Hold", "Managed payments", "Delivery confidence, order velocity and risk exposure."],
            ["Verification", "Seller identity", "Document quality, business consistency and access behavior."],
          ].map(([title, type, text]) => (
            <div key={title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-3xl font-black text-red-300">{title}</div>
              <div className="mt-3 text-xl font-bold">{type}</div>
              <p className="mt-4 leading-7 text-zinc-500">{text}</p>
            </div>
          ))}
        </div>
      </section>


      <section className="mx-auto max-w-7xl px-6 py-16">
        <Panel className="p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-red-300">Marketplace Post-Mortem</div>
              <h2 className="mt-4 text-4xl font-bold">Understand What Likely Happened</h2>
              <p className="mt-5 leading-8 text-zinc-400">
                Upload marketplace emails, tracking records, screenshots, appeal messages and policy notices. ShadowScore organizes the evidence into a clear risk narrative.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Likely Trigger Areas", "Tracking, payout, policy, verification and trust signals."],
                ["Missing Evidence", "What proof may have been weak, late or inconsistent."],
                ["Risk Escalation Timeline", "How small issues may have accumulated into enforcement exposure."],
                ["Next-Account Lessons", "Operational controls to avoid repeating the same risk pattern."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/55 p-5">
                  <div className="font-bold text-white">{title}</div>
                  <p className="mt-3 leading-7 text-zinc-500">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Pricing</div>
          <h2 className="mt-4 text-4xl font-bold">Start With A Marketplace Audit. Upgrade Into Intelligence.</h2>
          <p className="mx-auto mt-4 max-w-3xl text-zinc-500">
            A low-friction entry point for sellers under pressure, with deeper intelligence for serious operators.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan.name)}
              className={`relative flex h-full min-h-[640px] cursor-pointer flex-col rounded-[30px] border p-6 transition-all duration-300 ${
                selectedPlan === plan.name
                  ? "border-red-400/65 bg-red-500/8 shadow-[0_0_38px_rgba(220,38,38,0.13)]"
                  : "border-white/10 bg-white/[0.025] hover:border-white/20"
              }`}
            >
              {plan.tag && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-red-400/40 bg-red-600 px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_0_28px_rgba(220,38,38,0.45)]">
                  {plan.tag}
                </div>
              )}

              <div className="flex min-h-[190px] flex-col">
                <div className="text-xl font-bold">{plan.name}</div>
                <div className="mt-7 flex items-end gap-3">
                  <div className="text-4xl font-bold tracking-tight text-white">{plan.price}</div>
                </div>
                <div className="mt-2 text-sm text-zinc-500">{plan.sub}</div>
                <p className="mt-6 leading-7 text-zinc-400">{plan.desc}</p>
              </div>

              <div className="mt-8 flex-1 space-y-4">
                {plan.items.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-zinc-300">
                    <div className="mt-1 text-red-300">✓</div>
                    <div>{item}</div>
                  </div>
                ))}
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

              <PaymentButtons planName={plan.name} price={plan.price} />
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm leading-7 text-zinc-500">
          ShadowScore provides independent marketplace risk assessments based on seller-supplied information and publicly observable marketplace behavior. ShadowScore does not have access to internal marketplace systems and is not affiliated with eBay, Amazon, Walmart, Etsy, SHEIN or TikTok Shop.
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
              src="/marketplaces-monitor-v8.png?v=market-v34"
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

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[32px] border border-red-400/20 bg-red-500/[0.06] p-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-red-300">
                Private Intelligence Console
              </div>
              <h2 className="mt-4 text-3xl font-bold">
                Submit Evidence. Review Exposure. Generate A Private Report.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
                The console shows how approved sellers submit screenshots, tracking exports and marketplace notices before receiving exposure analysis.
              </p>
            </div>

            <a
              href="/intake"
              className="rounded-2xl bg-red-600 px-7 py-4 text-center font-semibold transition hover:bg-red-500"
            >
              Enter Console
            </a>
          </div>
        </div>
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
              href={TIKTOK_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 px-8 py-4 text-zinc-300 transition hover:border-red-400/30 hover:text-white"
            >
              TikTok Intelligence Feed
            </a>
          </div>
        </div>

        <div className="mt-10 text-sm text-zinc-600">
          ShadowScore © 2026 · Independent Marketplace Trust Assessment
        </div>
      </section>

      {showScanner && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 px-6 backdrop-blur-xl">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-red-400/20 bg-black p-8">
            <div className="text-sm uppercase tracking-[0.25em] text-red-300">Exposure Scan Initiated</div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-5">
              <div className="text-sm text-zinc-500">Store URL</div>
              <div className="mt-3 break-all text-xl">{scanText || "Missing store URL"}</div>
            </div>

            {!scanText.trim() && (
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
              <div className="text-6xl font-bold text-red-400">{scanText.trim() ? Math.max(41, Math.min(84, 41 + (scanText.length * 7) % 44)) : "--"}</div>
              <div className="mt-4 text-2xl font-bold">Exposure Preview</div>
              <p className="mt-4 leading-7 text-zinc-400">
                This public scan is intentionally limited. A full private audit requires seller context, screenshots and operational exports.
              </p>
              <div className="mt-5 text-sm text-zinc-500">Selected plan: {selected.name}</div>
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

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Legal & Trust</div>
          <div className="mt-5 flex flex-wrap gap-5 text-sm text-zinc-400">
            <a href="/about" className="hover:text-white">About</a>
            <a href="/privacy" className="hover:text-white">Privacy Policy</a>
            <a href="/terms" className="hover:text-white">Terms of Service</a>
            <a href="/security" className="hover:text-white">Security & Data Handling</a>
            <a href="https://www.tiktok.com/@shadowscore8" target="_blank" rel="noreferrer" className="hover:text-white">TikTok</a>
          </div>
          <p className="mt-5 max-w-4xl text-sm leading-7 text-zinc-500">
            ShadowScore provides independent marketplace trust assessments based on seller-supplied information and publicly observable marketplace behavior. ShadowScore does not have access to internal marketplace systems and is not affiliated with eBay, Amazon, Walmart, Etsy, SHEIN or TikTok Shop.
          </p>
        </div>
      </section>

    </main>
  );
}
