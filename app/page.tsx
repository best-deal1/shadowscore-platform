"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PaymentButtons from "../components/PaymentButtons";
import { TIKTOK_URL, CONTACT_EMAIL, SUPPORT_EMAIL, buildWhatsAppUrl } from "../lib/config";


const marketplaces = [
  { name: "eBay", key: "ebay" },
  { name: "Amazon", key: "amazon" },
  { name: "Walmart", key: "walmart" },
  { name: "Etsy", key: "etsy" },
  { name: "TikTok Shop", key: "tiktok" },
];

function MarketplaceLogo({ type }: { type: string }) {
  if (type === "ebay") {
    return (
      <div className="text-4xl font-black tracking-tight grayscale opacity-55 transition duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105">
        <span className="text-[#e53238]">e</span><span className="text-[#0064d2]">b</span><span className="text-[#f5af02]">a</span><span className="text-[#86b817]">y</span>
      </div>
    );
  }

  if (type === "amazon") {
    return (
      <div className="text-center grayscale opacity-55 transition duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105">
        <div className="text-4xl font-black tracking-tight text-white">amazon</div>
        <div className="mx-auto mt-1 h-1 w-16 rounded-full bg-[#ff9900]" />
      </div>
    );
  }

  if (type === "walmart") {
    return (
      <div className="flex items-center justify-center gap-2 grayscale opacity-55 transition duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105">
        <span className="text-3xl font-black text-[#2e7bef]">Walmart</span>
        <span className="text-3xl text-[#ffc220]">✦</span>
      </div>
    );
  }

  if (type === "etsy") {
    return <div className="text-4xl font-black tracking-tight text-[#f1641e] grayscale opacity-55 transition duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105">Etsy</div>;
  }

  return (
    <div className="text-center grayscale opacity-55 transition duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105">
      <div className="text-4xl font-black tracking-tight text-white [text-shadow:_-2px_0_#25f4ee,2px_0_#fe2c55]">TikTok</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-zinc-400">Shop</div>
    </div>
  );
}

const additionalPlatforms = ["SHEIN", "Vinted", "Depop", "Facebook Marketplace", "Shopify Risk Signals", "Temu", "AliExpress"];


const heroMessages = [
  {
    headline: "Protect Revenue",
    highlight: "Before Problems Escalate.",
    sub: "Monitor marketplace, verification, compliance and payout risks before they freeze cashflow, reduce visibility or restrict access.",
  },
  {
    headline: "Good Sellers",
    highlight: "Still Get Restricted.",
    sub: "Top Rated status, positive feedback and delivered orders do not always mean marketplace trust is healthy.",
  },
  {
    headline: "The Warning Is Usually",
    highlight: "Not The Beginning.",
    sub: "BBE, MC011, verification loops, reserves and payout holds often appear after risk has already been building.",
  },
  {
    headline: "Know Your Risk",
    highlight: "Before They Do.",
    sub: "ShadowScore maps visible evidence into marketplace, reputation and payout risk intelligence.",
  },
];

const paymentSystems = [
  { name: "PayPal", logo: "PayPal", className: "text-sky-300" },
  { name: "Payoneer", logo: "Payoneer", className: "text-orange-300" },
  { name: "Stripe", logo: "Stripe", className: "text-violet-300" },
  { name: "Visa", logo: "Visa", className: "text-blue-300" },
  { name: "Mastercard", logo: "Mastercard", className: "text-red-300" },
  { name: "Amex", logo: "Amex", className: "text-cyan-300" },
];

const riskCategories = [
  ["Performance Risk", "INR, late shipment, defects, feedback patterns, service metrics and account-health movement."],
  ["Policy Risk", "Marketplace policies, restricted behavior, category rules, listing compliance and product setup gaps."],
  ["Product Policy Risk", "Adult items, weapon-related accessories, medical claims, restricted categories and category mismatch."],
  ["VeRO / IP Risk", "Brand complaints, copyrighted images, trademark usage, copied descriptions and rights-owner reports."],
  ["Security Risk", "Login anomalies, device changes, IP reputation, identity mismatch and linked-account exposure."],
  ["Verification Risk", "Business license, ID, utility bill, warehouse proof, tax details and supplier documentation gaps."],
  ["Supplier Risk", "Amazon, retail arbitrage, invoice quality, unauthorized distribution and sourcing consistency."],
  ["Financial Risk", "PayPal reserve, Payoneer review, Stripe reserve, deferred settlement, payout holds, withdrawal freezes and chargebacks."],
  ["Reputation Risk", "Product ratings, negative reviews, customer complaints, return patterns and trust deterioration."],
  ["Community Reporting Risk", "Competitor reports, high-complaint categories, repeated listing takedowns and user-generated enforcement triggers."],
  ["Authenticity Risk", "Counterfeit exposure, brand authenticity, supplier documentation and invoice consistency."],
  ["Transparency Risk", "Unclear suspension reasons, placeholder policy names, missing root-cause details and poor appeal visibility."],
];

const intelligenceTopics = [
  { platform: "eBay", event: "BBE restriction despite Top Rated or Above Standard status", signal: "Trust", severity: "High" },
  { platform: "eBay", event: "Missing tracking before handling deadline", signal: "Fulfillment SLA", severity: "High" },
  { platform: "eBay", event: "MC011 proof-of-delivery review patterns", signal: "Fulfillment", severity: "High" },
  { platform: "eBay", event: "VeRO and rights-owner complaints", signal: "IP", severity: "High" },
  { platform: "eBay", event: "Security concern suspensions with limited explanation", signal: "Security", severity: "High" },
  { platform: "TikTok Shop", event: "Business verification and warehouse proof requests", signal: "Verification", severity: "Elevated" },
  { platform: "TikTok Shop", event: "Deferred settlement due to low product rating", signal: "Financial + Reputation", severity: "High" },
  { platform: "Walmart", event: "Counterfeit and supplier authenticity suspensions", signal: "Authenticity", severity: "High" },
  { platform: "PayPal", event: "Reserve and chargeback exposure", signal: "Financial", severity: "Elevated" },
  { platform: "Payoneer", event: "Business verification and compliance review loops", signal: "Payment Verification", severity: "Elevated" },
];


const caseLibrary = [
  { name: "Top Rated + BBE", platform: "eBay", cause: "Bad Buyer Experience", outcome: "Permanent selling restriction", lesson: "Seller level and feedback do not always equal account safety." },
  { name: "MC081 registration suspension", platform: "eBay", cause: "Security / registration integrity", outcome: "Permanent suspension risk", lesson: "Identity, device, IP and registration consistency matter." },
  { name: "Low rating + deferred settlement", platform: "TikTok Shop", cause: "Product quality and reputation", outcome: "Violation points and delayed settlement", lesson: "Product ratings can become payment risk." },
  { name: "Counterfeit suspension", platform: "Walmart", cause: "Authenticity / supplier documentation", outcome: "Account suspension and POA review", lesson: "Supplier evidence is part of marketplace trust." },
  { name: "Retail resale warning", platform: "Amazon", cause: "Dropshipping / commercial resale detection", outcome: "Refund restriction or account closure warning", lesson: "Supplier model can create risk before marketplace enforcement." },
];

const timelineStages = [
  ["Healthy", "Visible metrics look normal, but evidence should already be organized."],
  ["Warning", "Early signals appear: verification, ratings, tracking, policy or payment friction."],
  ["Restricted", "Order limits, listing removals, promotion blocks or payout holds begin."],
  ["Suspended", "Selling access is limited or stopped while appeal or review is pending."],
  ["Critical", "Permanent restriction, severe payment freeze or business-continuity risk."],
];

const plans = [
  {
    name: "Free Risk Scan",
    price: "",
    sub: "complimentary business health scan",
    desc: "Upload evidence and receive a basic risk map with missing documents, visible exposure areas and marketplace health stage.",
    tag: "Start Here",
    items: ["Basic ShadowScore", "Missing evidence flags", "Marketplace and payout category mapping", "Report download available for $9.90"],
    button: "Scan Free",
  },
  {
    name: "Full Audit Report",
    price: "$49",
    sub: "downloadable report",
    desc: "A deeper assessment with risk categories, evidence readiness, health stage and recommended actions.",
    tag: "Most Popular",
    items: ["Full risk breakdown", "PDF-style findings", "Action recommendations", "PayPal or card payment"],
    button: "Unlock Report",
  },
  {
    name: "Case Investigation",
    price: "$199",
    sub: "manual post-mortem",
    desc: "Manual investigation for sellers facing restrictions, payout holds, policy issues, verification failures or unclear enforcement reasons.",
    tag: "",
    items: ["Evidence timeline", "Likely trigger areas", "Next likely outcome", "Consultation handoff"],
    button: "Open Investigation",
  },
  {
    name: "Continuous Monitoring",
    price: "$299",
    sub: "per month",
    desc: "Ongoing trust, reputation and payout monitoring for sellers who depend on multiple marketplaces and payment systems.",
    tag: "",
    items: ["Monthly risk review", "Policy and reputation tracking", "Payment risk review", "Early warning guidance"],
    button: "Start Monitoring",
  },
];

const faqItems = [
  ["What is ShadowScore?", "ShadowScore is an independent Marketplace & Payment Risk Intelligence platform that helps digital sellers assess risk before revenue, payouts or account access are affected."],
  ["Is ShadowScore only for eBay?", "No. eBay was one trigger, but the platform supports broader marketplace and payment risk analysis across eBay, Amazon, Walmart, Etsy, TikTok Shop, PayPal, Payoneer and Stripe."],
  ["Is ShadowScore affiliated with any marketplace or payment company?", "No. ShadowScore is independent. Marketplace and payment names are shown only to indicate supported coverage areas."],
  ["Does ShadowScore access internal marketplace systems?", "No. ShadowScore does not access internal marketplace data, algorithms or proprietary trust scores. Assessments are based on seller-supplied evidence, public policies and observable operational indicators."],
  ["Can ShadowScore guarantee account recovery?", "No. ShadowScore does not guarantee marketplace outcomes. It helps sellers understand risk categories, evidence gaps, likely exposure areas and next recommended actions."],
  ["Can a seller with positive feedback still be restricted?", "Yes. Visible seller metrics do not always equal account safety. Marketplaces can evaluate compliance, verification, supplier, payment, security, reputation and trust indicators."],
  ["What is BBE?", "BBE usually refers to bad buying experience. It can appear even when a seller believes visible metrics are healthy, because marketplace evaluation can include broader trust and risk signals."],
  ["What is VeRO risk?", "VeRO risk relates to rights-owner complaints, trademark usage, copied images, copyrighted descriptions and brand enforcement on marketplace listings."],
  ["What is payout risk?", "Payout risk includes reserves, deferred settlement, payment holds, withdrawal freezes, chargebacks and payment processor reviews."],
  ["What is Marketplace Health Stage?", "It is a practical status layer that classifies a case as Healthy, Warning, Restricted, Suspended or Permanent Restriction based on visible evidence."],
  ["What documents should I upload?", "Upload review notices, payout hold messages, tracking exports, delivery proof, account health screenshots, policy warnings, verification requests and supplier documents."],
  ["Is the scan free?", "Yes. The initial scan is free. Payment is only required if you want the downloadable report, a manual investigation or continuous monitoring."],
  ["Do you analyze Payoneer?", "Yes. Payoneer reviews, account verification, payout friction and cross-border payment risk can be included in the financial-risk layer."],
  ["Do you analyze counterfeit or authenticity issues?", "Yes. Authenticity risk includes counterfeit exposure, branded-product risk, supplier documentation quality and invoice consistency."],
  ["Do you scan random URLs or rumors?", "No. The current product focuses on marketplace and payment evidence, not gossip, public campaigns or unverified claims. ShadowScore is built around platform notices, seller dashboards, payment messages and operational evidence."],
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
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);
  const hero = heroMessages[heroIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroVisible(false);
      window.setTimeout(() => {
        setHeroIndex((current) => (current + 1) % heroMessages.length);
        setHeroVisible(true);
      }, 260);
    }, 4400);
    return () => window.clearInterval(timer);
  }, []);

  const buildWhatsappUrl = (planName = selectedPlan, store = scanText) => {
    const message = `ShadowScore request

Store / Seller: ${store || "Not provided yet"}
Selected Plan: ${planName}

I would like to start a marketplace trust assessment.`;
    return buildWhatsAppUrl(message);
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
          <Link href="/intake" className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold shadow-[0_0_22px_rgba(220,38,38,0.28)] transition hover:bg-red-500">Scan My Business Risk</Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-14 pt-12 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/8 px-4 py-2 text-sm text-red-200">
              <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]" />
              Marketplace Health Intelligence For Professional Sellers
            </div>
            <div className={`min-h-[285px] transition-opacity duration-500 md:min-h-[250px] ${heroVisible ? "opacity-100" : "opacity-0"}`}>
              <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
                {hero.headline}
                <span className="mt-4 block text-red-400">{hero.highlight}</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400">
                {hero.sub}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {heroMessages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setHeroIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${index === heroIndex ? "w-9 bg-red-400" : "w-2.5 bg-white/20 hover:bg-white/40"}`}
                  aria-label={`Show hero message ${index + 1}`}
                />
              ))}
            </div>
            <div className="mt-6 max-w-2xl rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-5 text-sm leading-7 text-red-100">
              Sellers see orders, feedback and revenue. Marketplaces see risk. ShadowScore maps the gap before it becomes a restriction, hold or review.
            </div>
            <div className="mt-9 rounded-3xl border border-white/10 bg-black/55 p-5 backdrop-blur-xl">
              <div className="flex flex-col gap-3 md:flex-row">
                <input value={scanText} onChange={(event) => setScanText(event.target.value)} placeholder="Paste store URL or seller username" className="flex-1 rounded-2xl border border-white/10 bg-black px-5 py-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-red-400" />
                <Link href="/intake" className="rounded-2xl bg-red-600 px-8 py-4 text-center font-bold transition hover:bg-red-500">Scan My Business Risk</Link>
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
          <h2 className="mt-4 text-4xl font-bold">Marketplace And Payment Risk In One View.</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-zinc-500">Every case is mapped into a structured risk framework across marketplace enforcement, verification, compliance, operations and financial exposure.</p>
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
              {timelineStages.map(([item, detail], index) => (
                <div key={item} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/55 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10 text-sm font-black text-red-200">{index + 1}</div>
                  <div>
                    <div className="font-bold text-white">{item}</div>
                    <div className="mt-1 text-sm leading-6 text-zinc-500">{detail}</div>
                  </div>
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
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {caseLibrary.map((item) => (
            <div key={item.name} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">{item.platform}</div>
              <div className="mt-3 text-2xl font-black text-red-300">{item.name}</div>
              <p className="mt-4 text-sm leading-6 text-zinc-500"><span className="font-bold text-zinc-300">Cause:</span> {item.cause}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500"><span className="font-bold text-zinc-300">Outcome:</span> {item.outcome}</p>
              <p className="mt-4 leading-7 text-zinc-400">{item.lesson}</p>
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
            <h2 className="mt-4 text-4xl font-black text-white md:text-5xl">Coverage Across The World's Largest Marketplaces</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-500">Primary coverage stays focused on the marketplaces professional sellers use every day. Additional platforms remain in research until enough field signals are collected.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {marketplaces.map((item) => (
              <div key={item.name} className="group relative flex h-36 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/70 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_35px_rgba(0,0,0,0.42)] transition duration-500 hover:-translate-y-1 hover:border-red-400/35 hover:bg-white/[0.035]">
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div>
                  <MarketplaceLogo type={item.key} />
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


      <section className="mx-auto max-w-7xl px-6 py-16">
        <Panel className="p-8">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-red-300">Case Intelligence Engine</div>
              <h2 className="mt-4 text-4xl font-bold">No Random URL Claims. Only Marketplace Evidence.</h2>
              <p className="mt-5 leading-8 text-zinc-400">
                ShadowScore focuses on structured seller evidence: platform notices, seller dashboards, payout messages, account-health screens, tracking records and verification requests.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Evidence First", "The scan is based on uploaded notices, screenshots, reports and document gaps."],
                ["Risk Classification", "Each case is mapped into marketplace, verification, compliance, payment and reputation risk domains."],
                ["Probability Layer", "The engine estimates restriction probability and likely escalation path from visible indicators."],
                ["Learning Dataset", "Each real case can become a structured data point for future model improvement."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/55 p-5">
                  <div className="font-bold text-white">{title}</div>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
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
          <h2 className="mt-4 text-4xl font-bold">Join The Marketplace & Payment Risk Intelligence Layer</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-400">No fake reviews. No recovery promises. Just a sharper way to understand marketplace risk before it hurts the business.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 md:flex-row">
            <Link href="/intake" className="rounded-xl bg-red-600 px-8 py-4 font-bold transition hover:bg-red-500">Scan My Business Risk</Link>
            <button type="button" onClick={() => openWhatsApp(selected.name)} className="rounded-xl border border-white/10 px-8 py-4 text-zinc-300 transition hover:border-red-400/30 hover:text-white">Talk With An Analyst</button>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-white/10 bg-black/35 p-5 text-center text-sm leading-7 text-zinc-400">
          ShadowScore provides independent marketplace risk intelligence only. It does not guarantee account recovery, payment release or legal outcomes. Users remain responsible for their own marketplace actions, submissions and business decisions.
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-500">
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">{CONTACT_EMAIL}</a>
          <span className="text-zinc-700">•</span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">{SUPPORT_EMAIL}</a>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-sm text-zinc-500">
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/security" className="hover:text-white">Security</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </div>
      </section>
    </main>
  );
}
