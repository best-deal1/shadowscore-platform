"use client";

import Link from "next/link";
import { useState } from "react";
import ShadowScoreLayout from "../components/ShadowScoreLayout";

type BillingCycle = "monthly" | "annual";

type Plan = {
  name: string;
  description: string;
  monthlyPrice: number | null;
  features: readonly string[];
  cta: string;
  href: string;
  popular?: boolean;
};

const plans: readonly Plan[] = [
  {
    name: "Community",
    description: "Explore core business risk signals and start your first reviews.",
    monthlyPrice: 0,
    features: ["Free risk previews", "Community risk signals", "Basic business profiles", "One workspace member"],
    cta: "Start free",
    href: "/signup",
  },
  {
    name: "Professional",
    description: "Run recurring checks and keep an evidence trail for your decisions.",
    monthlyPrice: 49,
    features: ["Full investigation reports", "Saved scan history", "Business monitoring", "Report exports"],
    cta: "Start Professional",
    href: "/signup",
  },
  {
    name: "Business",
    description: "Coordinate due diligence across teams, suppliers, and business partners.",
    monthlyPrice: 199,
    features: ["Everything in Professional", "Team workspace", "Expanded monitoring", "Priority support"],
    cta: "Start Business",
    href: "/signup",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Configure ShadowScore for higher volumes, controls, and support needs.",
    monthlyPrice: null,
    features: ["Custom usage limits", "Enterprise access controls", "Implementation support", "Commercial terms"],
    cta: "Contact Sales",
    href: "/contact",
  },
];

const roiOutcomes = [
  { title: "Reduce fraud", copy: "Surface identity conflicts and risk signals before commitment." },
  { title: "Verify suppliers", copy: "Review business identity, ownership claims, and supporting evidence." },
  { title: "Monitor business partners", copy: "Track saved entities for changes that affect an active relationship." },
  { title: "Improve compliance", copy: "Keep findings, sources, and decisions in a consistent review trail." },
  { title: "Make evidence-backed decisions", copy: "Connect each recommendation to the evidence used in the review." },
] as const;

function PlanPrice({ monthlyPrice, cycle }: { monthlyPrice: number | null; cycle: BillingCycle }) {
  if (monthlyPrice === null) {
    return <div className="mt-6 text-3xl font-black tracking-tight">Contact Sales</div>;
  }

  const displayedPrice = cycle === "annual" ? monthlyPrice * 0.8 : monthlyPrice;
  const price = Number.isInteger(displayedPrice) ? displayedPrice.toFixed(0) : displayedPrice.toFixed(2);

  return (
    <div className="mt-6">
      <div className="flex items-end gap-2">
        <span className="text-4xl font-black tracking-tight">${price}</span>
        <span className="pb-1 text-sm font-bold text-zinc-400">/month</span>
      </div>
      <div className="mt-2 min-h-5 text-xs text-zinc-500">
        {monthlyPrice === 0
          ? "No payment required"
          : cycle === "annual"
            ? `$${(displayedPrice * 12).toFixed(2)} billed annually`
            : "Billed monthly"}
      </div>
    </div>
  );
}

export default function UpgradePage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <ShadowScoreLayout>
      <main className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <section className="text-center">
          <div className="text-xs font-black uppercase tracking-[0.32em] text-red-300">Plans</div>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            One subscription for continuous business intelligence.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            Choose a plan for your review volume and team. Add usage and credits as your investigation needs grow.
          </p>

          <div className="mt-8 inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1" role="group" aria-label="Billing cycle">
            <button
              type="button"
              aria-pressed={billingCycle === "monthly"}
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-xl px-5 py-3 text-sm font-black transition ${billingCycle === "monthly" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              aria-pressed={billingCycle === "annual"}
              onClick={() => setBillingCycle("annual")}
              className={`rounded-xl px-5 py-3 text-sm font-black transition ${billingCycle === "annual" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Annual <span className="ml-1 text-xs text-red-200">Save 20%</span>
            </button>
          </div>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Subscription plans">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex rounded-[30px] border p-6 ${plan.popular ? "border-red-400/50 bg-red-500/[0.08]" : "border-white/10 bg-white/[0.03]"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-6 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">
                  Most Popular
                </div>
              )}
              <div className="flex w-full flex-col">
                <h2 className="text-xl font-black">{plan.name}</h2>
                <p className="mt-3 min-h-20 text-sm leading-6 text-zinc-400">{plan.description}</p>
                <PlanPrice monthlyPrice={plan.monthlyPrice} cycle={billingCycle} />
                <ul className="mt-6 space-y-3 border-t border-white/10 pt-6 text-sm text-zinc-200">
                  {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 rounded-2xl px-5 py-4 text-center text-sm font-black transition ${plan.popular ? "bg-red-600 text-white hover:bg-red-500" : "border border-white/10 text-white hover:border-red-400/40"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2" aria-labelledby="addons-title">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
            <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Add-ons</div>
            <h2 id="addons-title" className="mt-3 text-2xl font-black">Usage-Based Pricing</h2>
            <p className="mt-3 leading-7 text-zinc-400">Add investigation and monitoring capacity when activity exceeds the usage included in your subscription.</p>
            <Link href="/contact" className="mt-6 inline-flex text-sm font-black text-red-300 hover:text-red-200">Discuss usage needs →</Link>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
            <div className="text-xs font-black uppercase tracking-[0.26em] text-red-300">Add-ons</div>
            <h2 className="mt-3 text-2xl font-black">Credits</h2>
            <p className="mt-3 leading-7 text-zinc-400">Purchase credits for additional reports, data collection, and specialist review without changing your base plan.</p>
            <Link href="/contact" className="mt-6 inline-flex text-sm font-black text-red-300 hover:text-red-200">Ask about credits →</Link>
          </div>
        </section>

        <section className="mt-20" aria-labelledby="outcomes-title">
          <div className="text-center">
            <div className="text-xs font-black uppercase tracking-[0.32em] text-red-300">Business outcomes</div>
            <h2 id="outcomes-title" className="mt-4 text-3xl font-black">Turn evidence into better operating decisions.</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {roiOutcomes.map((outcome) => (
              <div key={outcome.title} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <h3 className="font-black text-zinc-100">{outcome.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{outcome.copy}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </ShadowScoreLayout>
  );
}
