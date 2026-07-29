import type { Metadata } from "next";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export const metadata: Metadata = {
  title: "Pricing | ShadowScore",
  description: "Start with a free business preview. Unlock a full ShadowScore report for $9.90.",
  alternates: { canonical: "/pricing" },
};

const reportFeatures = [
  "Decision and recommended next step",
  "Identity and risk evidence",
  "Source and evidence trail",
  "Report saved to your workspace",
];

export default function PricingPage() {
  return (
    <ShadowScoreLayout>
      <main className="pricing-page">
        <section className="pricing-hero px-6 pb-16 pt-20 text-center sm:pt-28">
          <div className="mx-auto max-w-4xl">
            <p className="pricing-eyebrow">Clear, one-time pricing</p>
            <h1 className="mt-6 text-5xl font-black tracking-[-0.045em] text-white sm:text-7xl">
              Preview first. Pay for the full report when it is useful.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Run a free preview for any business. Unlock the complete evidence-backed report for $9.90.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-5 px-6 pb-20 md:grid-cols-2" aria-label="ShadowScore pricing options">
          <article className="pricing-plan">
            <div>
              <span className="pricing-pill">Free</span>
              <h2>Business preview</h2>
              <div className="mt-5"><strong>$0</strong></div>
              <p className="mt-5 text-sm leading-6 text-zinc-400">
                Check the initial decision, supporting signals, and recommended next step before you buy.
              </p>
              <ul>
                <li><span>✓</span>Initial trust decision</li>
                <li><span>✓</span>Plain-language reason</li>
                <li><span>✓</span>Top evidence gaps</li>
                <li><span>✓</span>Recommended next step</li>
              </ul>
            </div>
            <Link className="pricing-secondary" href="/intake">Start free preview</Link>
          </article>

          <article className="pricing-plan pricing-plan-featured">
            <div>
              <span className="pricing-pill">One-time purchase</span>
              <h2>Full report</h2>
              <div className="mt-5 flex items-end gap-2"><strong>$9.90</strong><span className="pb-1 text-sm text-zinc-500">per report</span></div>
              <p className="mt-5 text-sm leading-6 text-zinc-400">
                Unlock the complete report after reviewing the free preview. Payment is requested only when you choose to continue.
              </p>
              <ul>{reportFeatures.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
            </div>
            <Link className="pricing-primary" href="/intake">Start with a free preview</Link>
          </article>
        </section>

        <section className="pricing-section pt-0" aria-labelledby="monitoring-title">
          <div className="pricing-heading">
            <p className="pricing-eyebrow">Coming soon</p>
            <h2 id="monitoring-title">Continuous monitoring</h2>
            <p>Monitoring plans are in development. Current purchases cover one full report and workspace access for that report.</p>
          </div>
        </section>

        <section className="pricing-section pb-28" aria-labelledby="pricing-faq-title">
          <div className="pricing-heading"><p className="pricing-eyebrow">Purchase details</p><h2 id="pricing-faq-title">Before you unlock a report</h2></div>
          <div className="mx-auto mt-12 max-w-4xl space-y-3">
            <details className="pricing-faq"><summary>When do I pay?<span aria-hidden="true">+</span></summary><p>Payment is requested after the free preview, when you choose to unlock the full report.</p></details>
            <details className="pricing-faq"><summary>Is this a subscription?<span aria-hidden="true">+</span></summary><p>No. The $9.90 purchase unlocks one full report.</p></details>
            <details className="pricing-faq"><summary>Where is my report saved?<span aria-hidden="true">+</span></summary><p>Your unlocked report is saved to your ShadowScore workspace.</p></details>
          </div>
        </section>
      </main>
    </ShadowScoreLayout>
  );
}
