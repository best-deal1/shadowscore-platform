"use client";

import { useMemo, useState } from "react";

const WHATSAPP_NUMBER = "9720557293979";

const intelligenceEvents = [
  {
    id: "MC011-7421",
    platform: "eBay",
    event: "MC011 delivery review",
    severity: "Elevated",
    signal: "Tracking integrity",
    change: "+18%",
    time: "12m ago",
  },
  {
    id: "PYH-1189",
    platform: "eBay",
    event: "Payout hold cluster",
    severity: "High",
    signal: "Delivery verification",
    change: "+11%",
    time: "28m ago",
  },
  {
    id: "AZV-3021",
    platform: "Amazon",
    event: "Identity verification rejection",
    severity: "High",
    signal: "Document quality",
    change: "+7%",
    time: "44m ago",
  },
  {
    id: "WMT-8810",
    platform: "Walmart",
    event: "Seller review wave",
    severity: "Rising",
    signal: "Fulfillment consistency",
    change: "+9%",
    time: "1h ago",
  },
  {
    id: "TTK-0932",
    platform: "TikTok Shop",
    event: "New shop verification friction",
    severity: "Watchlist",
    signal: "Account access pattern",
    change: "+5%",
    time: "2h ago",
  },
];

const timeline = [
  ["Normal activity", "Sales and feedback appear stable from the seller side."],
  ["Tracking degradation", "Late or non-standard tracking signals begin accumulating."],
  ["Payout friction", "Payment systems introduce temporary review behavior."],
  ["Risk escalation", "Delivery verification signals require evidence."],
  ["Manual review", "The account enters human or hybrid platform review."],
  ["Visible enforcement", "The seller finally sees the warning, hold or restriction."],
];

const climate = [
  ["eBay", "Elevated", "MC011, payout holds and tracking integrity reports rising"],
  ["Amazon", "Normal", "Verification reports stable, document reviews continue"],
  ["Walmart", "Rising", "Seller review and fulfillment consistency signals increasing"],
  ["TikTok Shop", "Unknown", "Early signal volume still too low for reliable trend"],
];

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

const faqItems = [
  {
    q: "What information does ShadowScore reveal?",
    a: "ShadowScore shows where marketplace exposure may already be building: tracking reliability, payout exposure, operational drift and the actions that should be stabilized first. It does not reveal marketplace internal logic or proprietary detection methods.",
  },
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
    q: "Can ShadowScore guarantee that my account will not be restricted?",
    a: "No platform can guarantee that. ShadowScore helps sellers identify elevated exposure early and take stronger operational action before risk becomes visible enforcement.",
  },
];

function SeverityBadge({ severity }: { severity: string }) {
  const cls =
    severity === "High"
      ? "border-red-400/35 bg-red-500/10 text-red-200"
      : severity === "Elevated"
      ? "border-orange-400/35 bg-orange-500/10 text-orange-200"
      : severity === "Rising"
      ? "border-yellow-400/35 bg-yellow-500/10 text-yellow-200"
      : "border-blue-400/35 bg-blue-500/10 text-blue-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>
      {severity}
    </span>
  );
}

function CyberPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[30px] border border-white/10 bg-black/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_60px_rgba(120,0,20,0.16)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState("Exposure Intelligence");
  const [scanText, setScanText] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showMoreFaq, setShowMoreFaq] = useState(false);

  const visibleFaq = showMoreFaq ? faqItems : faqItems.slice(0, 4);

  const selectedPlanData = useMemo(
    () => plans.find((plan) => plan.name === selectedPlan) || plans[0],
    [selectedPlan]
  );

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

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(220,38,38,0.16),transparent_42%),radial-gradient(circle_at_12%_18%,rgba(127,29,29,0.16),transparent_35%)]" />
      <div className="fixed inset-x-0 top-0 pointer-events-none h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/shadowscore-shield-v8.png?v=v9"
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

          <nav className="hidden items-center gap-10 text-sm text-zinc-400 md:flex">
            <a href="#feed" className="transition hover:text-white">Feed</a>
            <a href="#timeline" className="transition hover:text-white">Timeline</a>
            <a href="#agent" className="transition hover:text-white">Agent</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="/intake" className="text-red-300 transition hover:text-red-200">Console</a>
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
              <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.9)]" />
              Marketplace Exposure Intelligence
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
              Every Marketplace Has A Trust Score For Your Account.
              <span className="mt-4 block text-red-400">
                They Just Don't Show It To You.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400">
              ShadowScore reveals silent behavioral signals and hidden exposure weeks before payout holds,
              account reviews or restrictions become visible.
            </p>

            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-500">
              Most sellers only see the warning after the platform has already formed a risk profile.
            </p>

            <div className="mt-6 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-zinc-400">
              Built like a cyber intelligence console for marketplace operators: live signal feed, exposure timeline, trust radar and private audit workflow.
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
                No password required • First paid audit includes 30-day Risk Protection
              </div>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["Live", "Risk Feed"],
                ["30 Days", "Risk Protection"],
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

            <CyberPanel className="relative min-h-[560px] overflow-hidden p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,40,60,0.14),transparent_55%)]" />
              <div className="relative">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.34em] text-zinc-500">Exposure Terminal</div>
                    <div className="mt-2 text-2xl font-extrabold">ShadowScore Risk View</div>
                  </div>
                  <SeverityBadge severity="Elevated" />
                </div>

                <div className="mt-7 grid gap-4">
                  {[
                    ["Trust Score", "67", "Risk posture above normal range"],
                    ["Primary Signal", "Tracking", "Late, weak or non-standard verification"],
                    ["Review Probability", "Rising", "Pattern similarity increased this week"],
                  ].map(([label, value, note]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                      <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">{label}</div>
                      <div className="mt-3 text-4xl font-black text-white">{value}</div>
                      <div className="mt-2 text-sm text-zinc-500">{note}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-5">
                  <div className="text-sm font-bold text-red-200">Signal interpretation</div>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">
                    The account may still look healthy from the seller side, while marketplace trust systems detect accumulating operational risk.
                  </p>
                </div>
              </div>
            </CyberPanel>
          </div>
        </div>
      </section>

      <section id="feed" className="mx-auto max-w-7xl px-6 py-16">
        <CyberPanel className="p-7">
          <div className="flex flex-col gap-6 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-red-300">
                Live Marketplace Intelligence
              </div>
              <h2 className="mt-4 text-4xl font-bold">Community Risk Feed</h2>
              <p className="mt-4 max-w-3xl leading-7 text-zinc-500">
                Public marketplace incidents converted into structured enforcement intelligence. The feed is public signal. The scoring model remains private.
              </p>
            </div>
            <div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-200">
              Monitoring Active
            </div>
          </div>

          <div className="mt-7 grid gap-3">
            {intelligenceEvents.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 rounded-2xl border border-white/10 bg-black/60 p-5 md:grid-cols-[110px_1fr_150px_100px_90px]"
              >
                <div className="font-bold text-zinc-300">{item.platform}</div>
                <div>
                  <div className="font-semibold text-white">{item.event}</div>
                  <div className="mt-1 text-sm text-zinc-500">{item.signal}</div>
                </div>
                <SeverityBadge severity={item.severity} />
                <div className="font-bold text-red-300">{item.change}</div>
                <div className="text-sm text-zinc-500">{item.time}</div>
              </div>
            ))}
          </div>
        </CyberPanel>
      </section>

      <section id="timeline" className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">Trust Timeline</div>
            <h2 className="mt-4 text-4xl font-bold">The Warning Is Not Where The Story Begins</h2>
            <p className="mt-5 max-w-xl leading-7 text-zinc-400">
              Enforcement is usually the visible endpoint of an invisible signal build-up. ShadowScore turns scattered operational events into a chronological risk story.
            </p>
          </div>

          <CyberPanel className="p-7">
            <div className="space-y-6">
              {timeline.map(([title, body], index) => (
                <div key={title} className="grid grid-cols-[70px_1fr] gap-5">
                  <div className="text-sm font-bold text-zinc-500">T-{timeline.length - index}</div>
                  <div className="relative border-l border-red-500/30 pb-6 pl-6">
                    <div className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-red-500 shadow-[0_0_14px_rgba(248,113,113,0.7)]" />
                    <div className="text-lg font-bold">{title}</div>
                    <div className="mt-2 text-sm leading-7 text-zinc-500">{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </CyberPanel>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <CyberPanel className="p-7">
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">Trust Radar</div>
            <h2 className="mt-4 text-3xl font-bold">Exposure Breakdown</h2>
            <div className="mt-8 space-y-5">
              {[
                ["Tracking Health", 62, "Elevated"],
                ["Delivery Trust", 84, "Stable"],
                ["Payout Stability", 58, "Watchlist"],
                ["Operational Consistency", 71, "Moderate"],
                ["Marketplace Exposure", 67, "Elevated"],
              ].map(([name, score, status]) => (
                <div key={name as string}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-zinc-300">{name}</span>
                    <span className="font-bold text-white">{score}/100 · {status}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-gradient-to-r from-red-700 via-red-500 to-red-300" style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CyberPanel>

          <CyberPanel className="p-7">
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">Marketplace Climate</div>
            <h2 className="mt-4 text-3xl font-bold">Platform Risk Map</h2>
            <div className="mt-8 space-y-4">
              {climate.map(([platform, status, note]) => (
                <div key={platform} className="rounded-2xl border border-white/10 bg-black/50 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold">{platform}</div>
                    <SeverityBadge severity={status} />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-500">{note}</p>
                </div>
              ))}
            </div>
          </CyberPanel>
        </div>
      </section>

      <section id="agent" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">The Agent</div>
            <h2 className="mt-4 text-4xl font-bold">A Seller Defense Agent, Not Another Dashboard</h2>
            <p className="mt-5 leading-7 text-zinc-500">
              The product is designed to behave like a cyber analyst for marketplace sellers: collect signals, classify exposure, identify patterns and recommend stabilization steps.
            </p>
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
              src="/marketplaces-monitor-v8.png?v=market-v9"
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
