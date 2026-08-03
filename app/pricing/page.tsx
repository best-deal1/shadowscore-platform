import type { Metadata } from "next";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";
import { BETA_PRODUCT } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing | ShadowScore",
  description: `${BETA_PRODUCT.name} with one ${BETA_PRODUCT.deliverable} for ${BETA_PRODUCT.price}.`,
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <ShadowScoreLayout>
      <main className="pricing-page">
        <section className="pricing-hero px-6 pb-14 pt-20 text-center sm:pt-28">
          <div className="mx-auto max-w-4xl">
            <p className="pricing-eyebrow">Beta pricing</p>
            <h1 className="mt-5 text-5xl font-black tracking-[-0.045em] text-white sm:text-7xl">One investigation. One clear price.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-300">{BETA_PRODUCT.promise} Starting is free. Payment occurs after you review the Business and scope.</p>
          </div>
        </section>
        <section className="pricing-section pb-28" aria-labelledby="product-title">
          <article className="pricing-plan pricing-plan-featured mx-auto max-w-3xl">
            <div>
              <span className="pricing-pill">One-time purchase</span>
              <div className="mt-5 flex items-end gap-2">
                <strong>{BETA_PRODUCT.price}</strong>
                <span className="pb-1 text-sm text-zinc-500">USD, {BETA_PRODUCT.period}</span>
              </div>
              <h2 id="product-title">{BETA_PRODUCT.name}</h2>
              <p className="mt-4 text-sm leading-6 text-zinc-400">Review one Business using the submitted identity, available sources, and optional customer Evidence. Receive one {BETA_PRODUCT.deliverable} for that Investigation.</p>
              <h3 className="mt-7 text-sm font-bold text-white">The Executive Report includes</h3>
              <ul>
                {BETA_PRODUCT.includes.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}
              </ul>
            </div>
            <Link className="pricing-primary" href="/intake">Start Business Investigation</Link>
          </article>
          <div className="pricing-heading mt-16">
            <p className="pricing-eyebrow">Purchase terms</p>
            <h2>Review before payment</h2>
            <p>You can confirm the Business, Investigation scope, optional Evidence, deliverable, and total price before checkout. Payment is one time.</p>
          </div>
        </section>
      </main>
    </ShadowScoreLayout>
  );
}
