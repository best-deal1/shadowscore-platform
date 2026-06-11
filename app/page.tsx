"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PaymentButtons from "../components/PaymentButtons";

const WHATSAPP_NUMBER = "972557293979";
const TIKTOK_URL = "https://www.tiktok.com/@shadowscore8";

const marketplaces = [
  { name: "eBay", logo: "eBay", hoverClass: "group-hover:text-[#E53238]" },
  { name: "Amazon", logo: "amazon", hoverClass: "group-hover:text-[#FF9900]" },
  { name: "Walmart", logo: "Walmart", hoverClass: "group-hover:text-[#2E7BEF]" },
  { name: "Etsy", logo: "Etsy", hoverClass: "group-hover:text-[#F1641E]" },
  { name: "TikTok Shop", logo: "TikTok", hoverClass: "group-hover:text-white" },
];

const additionalPlatforms = ["SHEIN", "Vinted", "Depop", "Facebook Marketplace", "Shopify Risk Signals"];

const paymentSystems = [
  { name: "PayPal", logo: "PayPal", className: "text-sky-300" },
  { name: "Payoneer", logo: "Payoneer", className: "text-orange-300" },
  { name: "Stripe", logo: "Stripe", className: "text-violet-300" },
];

const riskCategories = [
  ["Performance Risk", "INR, late shipment, defects, feedback patterns and account-health movement."],
  ["Policy Risk", "Marketplace policies, restricted behavior, category rules and listing compliance."],
  ["Product Policy Risk", "Adult items, weapon-related accessories, medical claims and restricted product groups."],
  ["VeRO / IP Risk", "Brand complaints, copyrighted images, trademark usage and rights-owner reports."],
  ["Security Risk", "Login patterns, device changes, identity mismatch and linked-account exposure."],
  ["Verification Risk", "Business license, ID, utility bill, warehouse proof and supplier documentation gaps."],
  ["Supplier Risk", "Amazon, retail arbitrage, invoice quality, unauthorized distribution and sourcing consistency."],
  ["Payout Risk", "PayPal reserve, Payoneer compliance review, Stripe reserve, deferred settlement, payout holds, withdrawal freezes, chargebacks and cashflow exposure."],
  ["Reputation Risk", "Product ratings, negative reviews, customer complaints, return patterns and trust deterioration."],
  ["Community Reporting Risk", "Competitor reports, high-complaint categories and repeated listing takedowns."],
  ["Authenticity Risk", "Counterfeit exposure, brand authenticity, supplier documentation and invoice quality."],
];

const intelligenceTopics = [
  { platform: "eBay", event: "Missing tracking before handling deadline", signal: "Fulfillment SLA", severity: "High" },
  { platform: "eBay", event: "MC011 proof-of-delivery review patterns", signal: "Fulfillment", severity: "High" },
  { platform: "eBay", event: "BBE restriction despite healthy visible metrics", signal: "Trust", severity: "Elevated" },
  { platform: "eBay", event: "VeRO and rights-owner complaints", signal: "IP", severity: "High" },
  { platform: "TikTok Shop", event: "Business verification and warehouse proof requests", signal: "Verification", severity: "Elevated" },
  { platform: "TikTok Shop", event: "Deferred settlement due to low product rating", signal: "Payout + Reputation", severity: "High" },
  { platform: "PayPal", event: "Reserve and chargeback exposure", signal: "Payment", severity: "Elevated" },
  { platform: "Walmart", event: "Counterfeit and supplier authenticity investigations", signal: "Authenticity", severity: "High" },
  { platform: "Payoneer", event: "Cross-border seller verification and compliance reviews", signal: "Payments", severity: "Elevated" },
];

const plans = [
  {
    name: "Free Marketplace Risk Scan",
    price: "",
    sub: "complimentary assessment",
    desc: "Upload evidence and receive a basic risk map with missing documents and visible exposure areas.",
    tag: "Start Here",
    items: ["Basic ShadowScore", "Missing evidence flags", "Marketplace requirements", "Report download available for $9.90"],
    button: "Start Risk Assessment",
  },
  {
    name: "Full Audit Report",
    price: "$49",
    sub: "downloadable report",
    desc: "A deeper assessment with risk categories, evidence readiness and recommended actions.",
    tag: "Most Popular",
    items: ["Full risk breakdown", "PDF-style findings", "Action recommendations", "PayPal or card payment"],
    button: "Unlock Report",
  },
  {
    name: "Case Investigation",
    price: "$199",
    sub: "manual review",
    desc: "Manual post-mortem for sellers facing restrictions, payout holds, policy issues or verification failures.",
    tag: "",
    items: ["Evidence timeline", "Likely trigger areas", "Appeal readiness review", "Consultation handoff"],
    button: "Open Investigation",
  },
  {
    name: "Continuous Monitoring",
    price: "$299",
    sub: "per month",
    desc: "Ongoing trust and risk monitoring for sellers who depend on multiple marketplaces.",
    tag: "",
    items: ["Monthly risk review", "Policy exposure tracking", "Payment risk review", "Early warning guidance"],
    button: "Start Monitoring",
  },
];

const faqItems = [
  ["What is ShadowScore?", "ShadowScore is an independent Marketplace Trust Intelligence platform that helps sellers assess operational risk, evidence readiness and marketplace exposure across major marketplaces."],
  ["Is ShadowScore affiliated with eBay, Amazon, Walmart, Etsy, SHEIN, Vinted or TikTok Shop?", "No. ShadowScore is independent. Marketplace names are shown only to indicate supported coverage areas."],
  ["Does ShadowScore access internal marketplace systems?", "No. ShadowScore does not access internal marketplace data, algorithms or proprietary trust scores. Assessments are based on seller-supplied evidence, public marketplace policies and observable operational indicators."],
  ["Can ShadowScore guarantee account recovery?", "No. ShadowScore does not guarantee marketplace outcomes. It helps sellers understand risk categories, evidence gaps and likely exposure areas."],
  ["Can a seller with positive feedback still be restricted?", "Yes. Visible seller metrics do not always equal account safety. Marketplaces can evaluate compliance, verification, supplier, payment, security and trust indicators."],
  ["What is BBE?", "BBE usually refers to bad buying experience. It can appear even when a seller believes visible metrics are healthy, because marketplace evaluation can include broader trust and risk signals."],
  ["What is VeRO risk?", "VeRO risk relates to rights-owner complaints, trademark usage, copied images, copyrighted descriptions and brand enforcement on marketplace listings."],
  ["What documents should I upload?", "Upload review notices, payout hold messages, tracking exports, delivery proof, account health screenshots, policy warnings, verification requests and supplier documents."],
  ["Is this a recovery service?", "Recovery is not the main product. ShadowScore focuses on intelligence, evidence readiness and prevention. In some cases, sellers may be introduced to independent recovery consultants."],
  ["How do payments work?", "ShadowScore supports PayPal, Payoneer, credit card and bank transfer. Live checkout links can be connected to PayPal or Stripe."],
  ["What is Marketplace Health Stage?", "It is a practical status layer that classifies an account as Healthy, Warning, Restricted, Suspended or Permanent Restriction based on visible evidence."],
  ["Do you analyze Payoneer?", "Yes. Payoneer reviews, account verification, payout friction and cross-border payment risk can be included in the payment-risk layer."],
  ["Do you analyze counterfeit or authenticity issues?", "Yes. Authenticity risk includes counterfeit exposure, branded-product risk, supplier documentation quality and invoice consistency."],
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
  return <div className={`rounded-[34px] border border-white/10 bg-black/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_70px_rgba(120,0,20,0.16)] backdrop-blur-xl ${className}`}>{children}</div>;
}

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState("Full Audit Report");
  const [scanText, setScanText] = useState("");
  const [showMoreFaq, setShowMoreFaq] = useState(false);
  const visibleFaq = showMoreFaq ? faqItems : faqItems.slice(0, 6);
  const selected = useMemo(() => plans.find((plan) => plan.name === selectedPlan) || plans[1], [selectedPlan]);

  const buildWhatsappUrl = (planName = selectedPlan, store = scanText) => {
    const message = `ShadowScore request

Store / Seller: ${store || "Not provided yet"}
Selected Plan: ${planName}

I would like to start a marketplace trust assessment.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const openWhatsApp = (planName = selectedPlan) => window.open(buildWhatsappUrl(planName), "_blank", "noopener,noreferrer");

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(180,15,30,0.18),transparent_44%),radial-gradient(circle_at_18%_25%,rgba(160,12,24,0.11),transparent_38%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/shadowscore-shield-v8.png?v=v8" alt="ShadowScore shield" className="h-10 w-10 rounded-xl object-contain bg-black p-1" />
            <div className="leading-none">
              <div className="text-2xl font-extrabold tracking-tight">Shadow<span className="text-red-400">Score</span></div>
              <div className="mt-1.5 text-[10px] uppercase tracking-[0.34em] text-zinc-500">Marketplace & Payout Intelligence</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#risk-categories" className="hover:text-white">Risk Categories</a>
            <a href="#cases" className="hover:text-white">Cases</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href={TIKTOK_URL} target="_blank" rel="noreferrer" className="hover:text-white">TikTok</a>
            <Link href="/intake" className="text-red-300 hover:text-red-200">Free Scan</Link>
          </nav>
          <Link href="/intake" className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold shadow-[0_0_22px_rgba(220,38,38,0.28)] transition hover:bg-red-500">Scan My Marketplace Risk</Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-14 pt-12 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/8 px-4 py-2 text-sm text-red-200">
              <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]" />
              Marketplace Health Intelligence For Professional Sellers
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
              Marketplace & Payout Risk Intelligence
              <span className="mt-4 block text-red-400">Before Revenue Is Impacted.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400">
              Analyze trust, compliance, verification, reputation, payout and operational risk across eBay, Amazon, Walmart, Etsy, TikTok Shop, PayPal, Payoneer and Stripe.
            </p>
            <div className="mt-6 max-w-2xl rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-5 text-sm leading-7 text-red-100">
              Sellers see orders, feedback and revenue. Marketplaces see risk. ShadowScore maps the gap before it becomes a restriction, hold or review.
            </div>
            <div className="mt-9 rounded-3xl border border-white/10 bg-black/55 p-5 backdrop-blur-xl">
              <div className="flex flex-col gap-3 md:flex-row">
                <input value={scanText} onChange={(event) => setScanText(event.target.value)} placeholder="Paste store URL or seller username" className="flex-1 rounded-2xl border border-white/10 bg-black px-5 py-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-red-400" />
                <Link href="/intake" className="rounded-2xl bg-red-600 px-8 py-4 text-center font-bold transition hover:bg-red-500">Scan My Marketplace Risk</Link>
              </div>
              <div className="mt-4 text-sm text-zinc-500">No password required • Evidence-based • Independent assessment</div>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-xs text-zinc-500">
              {marketplaces.map((item) => <span key={item.name} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">{item.name}</span>)}
              {paymentSystems.map((item) => <span key={item.name} className="rounded-full border border-red-400/20 bg-red-500/[0.04] px-3 py-2 text-red-100">{item.name}</span>)}
            </div>
          </div>

          <Panel className="p-8">
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">Marketplace Trust Dashboard</div>
            <div className="mt-5 rounded-3xl border border-orange-400/25 bg-orange-500/10 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-orange-200">Marketplace Health Stage</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                {["Healthy", "Warning", "Restricted", "Suspended", "Permanent Restriction"].map((stage, index) => (
                  <span key={stage} className={`rounded-full border px-3 py-2 ${index === 1 ? "border-orange-300/50 bg-orange-500/20 text-orange-100" : "border-white/10 bg-black/40 text-zinc-500"}`}>
                    {stage}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-400">The product does not only score risk. It identifies the current enforcement stage and the next likely escalation path.</p>
            </div>
            <div className="mt-5 grid gap-4">
              {[
                ["Overall Trust Score", "74", "Elevated exposure"],
                ["Policy Exposure", "82", "Restricted category and policy signals"],
                ["Supplier Risk", "68", "Invoice and sourcing consistency"],
                ["Payment Risk", "79", "Reserve, hold and chargeback exposure"],
              ].map(([title, value, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/55 p-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{title}</div>
                      <div className="mt-2 text-sm text-zinc-500">{text}</div>
                    </div>
                    <div className="text-4xl font-black text-red-300">{value}</div>
                  </div>
                  <div className="mt-4 h-1.5 rounded-full bg-white/10"><div className="h-1.5 w-3/4 rounded-full bg-gradient-to-r from-red-700 via-red-500 to-red-300" /></div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-zinc-400">
              This is an independent assessment view. It does not represent internal marketplace data.
            </div>
          </Panel>
        </div>
      </section>

      <section id="risk-categories" className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">ShadowScore Framework</div>
          <h2 className="mt-4 text-4xl font-bold">Marketplace, Reputation And Payout Risk In One View.</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-zinc-500">Every case is mapped into a structured risk framework across marketplace enforcement, reputation signals, verification gaps, operations and payout exposure.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {riskCategories.map(([title, body]) => (
            <div key={title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-xl font-bold text-white">{title}</div>
              <p className="mt-4 leading-7 text-zinc-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel className="p-8">
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">Marketplace Blind Spot</div>
            <h2 className="mt-4 text-4xl font-bold">Seller Performance Does Not Always Equal Account Safety.</h2>
            <p className="mt-5 leading-8 text-zinc-400">A seller can have positive feedback, delivered orders and healthy visible metrics, yet still face BBE, MC011, VeRO, verification review, payout hold or permanent selling restriction.</p>
          </Panel>
          <Panel className="p-8">
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">Trust Timeline</div>
            <div className="mt-6 space-y-4">
              {["Healthy", "Warning signal", "Restricted or payout hold", "Suspended", "Permanent restriction"].map((item, index) => (
                <div key={item} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/55 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10 text-sm font-black text-red-200">{index + 1}</div>
                  <div className="font-bold text-white">{item}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>


      <section className="mx-auto max-w-7xl px-6 py-16">
        <Panel className="p-8">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-red-300">New Signal Added</div>
              <h2 className="mt-4 text-4xl font-bold">Missing Tracking Before Handling Deadline</h2>
              <p className="mt-5 leading-8 text-zinc-400">When a seller depends on AliExpress or another external supplier and cannot upload tracking before the ship-by date, the account can enter a fulfillment-risk pattern even before the buyer complains.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Signal", "No tracking uploaded"],
                ["Impact", "+12 risk points"],
                ["Stage", "Warning"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/55 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">{label}</div>
                  <div className="mt-3 text-xl font-black text-red-200">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section id="topics" className="mx-auto max-w-7xl px-6 py-16">
        <Panel className="p-7">
          <div className="flex flex-col gap-6 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-red-300">Marketplace Intelligence Topics</div>
              <h2 className="mt-4 text-4xl font-bold">Real Issues Sellers Report Every Day</h2>
              <p className="mt-4 max-w-3xl leading-7 text-zinc-500">Public seller reports are converted into structured risk categories. The internal scoring model stays private.</p>
            </div>
            <div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">Community Signals</div>
          </div>
          <div className="mt-7 grid gap-3">
            {intelligenceTopics.map((item) => (
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
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Case Library</div>
          <h2 className="mt-4 text-4xl font-bold">No Fake Testimonials. Real Marketplace Patterns.</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-zinc-500">ShadowScore is built from observed marketplace cases, not invented success stories.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Above Standard", "Restricted despite healthy visible metrics."],
            ["Missing Tracking", "AliExpress or supplier delay before the handling deadline."],
            ["Delivered Orders", "Still entered review due to broader trust exposure."],
            ["VeRO Complaint", "Listing removed after rights-owner report."],
            ["TikTok Verification", "Business proof and warehouse evidence requested."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-2xl font-black text-red-300">{title}</div>
              <p className="mt-4 leading-7 text-zinc-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Pricing</div>
          <h2 className="mt-4 text-4xl font-bold">Scan Free. Download The Report Only If It Helps.</h2>
          <p className="mx-auto mt-4 max-w-3xl text-zinc-500">The initial scan is free. If the findings are useful, unlock the downloadable report for $9.90 or upgrade to a full audit.</p>
        </div>
        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.name} onClick={() => setSelectedPlan(plan.name)} className={`relative flex h-full min-h-[650px] cursor-pointer flex-col rounded-[30px] border p-6 transition-all duration-300 ${selectedPlan === plan.name ? "border-red-400/65 bg-red-500/8 shadow-[0_0_38px_rgba(220,38,38,0.13)]" : "border-white/10 bg-white/[0.025] hover:border-white/20"}`}>
              {plan.tag && <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-red-400/40 bg-red-600 px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_0_28px_rgba(220,38,38,0.45)]">{plan.tag}</div>}
              <div className="flex min-h-[210px] flex-col">
                <div className="text-xl font-bold">{plan.name}</div>
                <div className="mt-7 text-4xl font-bold tracking-tight text-white">{plan.price}</div>
                <div className="mt-2 text-sm text-zinc-500">{plan.sub}</div>
                <p className="mt-6 leading-7 text-zinc-400">{plan.desc}</p>
              </div>
              <div className="mt-8 flex-1 space-y-4">
                {plan.items.map((item) => <div key={item} className="flex items-start gap-3 text-zinc-300"><div className="mt-1 text-red-300">✓</div><div>{item}</div></div>)}
              </div>
              <div onClick={(event) => event.stopPropagation()}>
                {plan.name.includes("Free") ? <Link href="/intake" className="mt-6 block rounded-2xl bg-emerald-600 px-5 py-3 text-center text-sm font-black text-white shadow-[0_0_22px_rgba(16,185,129,0.28)] hover:bg-emerald-500">Start Scan</Link> : <PaymentButtons planName={plan.name} price={plan.price} />}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm leading-7 text-zinc-500">Accepted payments: PayPal, Payoneer, Visa, Mastercard, American Express and bank transfer. ShadowScore is independent and does not access internal marketplace systems.</div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[30px] border border-white/10 bg-black/55 p-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-red-300">Connected Payment Risk</div>
              <h2 className="mt-3 text-3xl font-bold">Payments Are Part Of Marketplace Health.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-zinc-500">PayPal, Payoneer and Stripe reviews, reserves, deferred settlement, payout holds, withdrawal freezes and chargeback patterns are analyzed as part of the risk picture.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {paymentSystems.map((item) => (
                <div key={item.name} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
                  <div className={`text-lg font-black ${item.className}`}>{item.logo}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.16),transparent_45%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <div className="text-sm uppercase tracking-[0.32em] text-red-300">Marketplace Coverage</div>
            <h2 className="mt-4 text-4xl font-black text-white md:text-5xl">Built For Multi-Platform Sellers</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-500">Primary coverage stays focused on the marketplaces professional sellers use every day. Additional platforms remain in research until enough field signals are collected.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {marketplaces.map((item) => (
              <div key={item.name} className="group relative flex h-36 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/70 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_35px_rgba(0,0,0,0.42)] transition duration-500 hover:-translate-y-1 hover:border-red-400/35 hover:bg-white/[0.035]">
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div>
                  <div className={`text-3xl font-black tracking-tight text-zinc-500 transition duration-500 ${item.hoverClass} group-hover:scale-105 group-hover:drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]`}>{item.logo}</div>
                  <div className="mt-3 text-[10px] uppercase tracking-[0.22em] text-zinc-700 transition group-hover:text-zinc-300">{item.name}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-center text-sm leading-7 text-zinc-500">
            Additional platforms under research: {additionalPlatforms.join(" • ")}. Kept intentionally focused to avoid generic coverage claims.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">FAQ</div>
          <h2 className="mt-4 text-4xl font-bold">Professional Questions. Direct Answers.</h2>
        </div>
        <div className="mt-12 space-y-4">
          {visibleFaq.map(([q, a]) => <details key={q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><summary className="cursor-pointer text-lg font-semibold">{q}</summary><p className="mt-4 leading-7 text-zinc-400">{a}</p></details>)}
        </div>
        {!showMoreFaq && <div className="mt-8 text-center"><button type="button" onClick={() => setShowMoreFaq(true)} className="rounded-xl border border-white/10 px-7 py-3.5 text-zinc-300 transition hover:border-red-400/30 hover:text-white">Show More Questions</button></div>}
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="rounded-[34px] border border-white/10 bg-white/[0.03] p-10">
          <div className="text-sm uppercase tracking-[0.28em] text-red-300">Early Access</div>
          <h2 className="mt-4 text-4xl font-bold">Join The Marketplace Trust Intelligence Layer</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-400">No fake reviews. No recovery promises. Just a sharper way to understand marketplace risk before it hurts the business.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 md:flex-row">
            <Link href="/intake" className="rounded-xl bg-red-600 px-8 py-4 font-bold transition hover:bg-red-500">Start Scan My Marketplace Risk</Link>
            <button type="button" onClick={() => openWhatsApp(selected.name)} className="rounded-xl border border-white/10 px-8 py-4 text-zinc-300 transition hover:border-red-400/30 hover:text-white">Need help? Talk on WhatsApp</button>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-white/10 bg-black/35 p-4 text-center text-xs leading-6 text-zinc-500">
          ShadowScore provides independent marketplace risk intelligence only. It does not guarantee account recovery, payment release or legal outcomes. Users remain responsible for their own marketplace actions, submissions and business decisions.
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-sm text-zinc-600">
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/security" className="hover:text-white">Security</Link>
          <a href={TIKTOK_URL} target="_blank" rel="noreferrer" className="hover:text-white">TikTok</a>
        </div>
      </section>
    </main>
  );
}
