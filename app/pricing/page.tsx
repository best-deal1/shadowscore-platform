import type { Metadata } from "next";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";
import { BETA_PRODUCT, PLAN_COMPARISON, PLANNED_PLANS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing and plans | ShadowScore",
  description: `Compare ShadowScore investigation options. Start with one ${BETA_PRODUCT.deliverable} for ${BETA_PRODUCT.price}.`,
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <ShadowScoreLayout>
      <main className="pricing-page">
        <section className="pricing-hero px-6 pb-16 pt-20 text-center sm:pt-28">
          <div className="mx-auto max-w-4xl">
            <p className="pricing-eyebrow">Pricing and plans</p>
            <h1 className="mt-5 text-5xl font-black tracking-[-0.045em] text-white sm:text-7xl">Start with one decision-ready investigation.</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-300">Review the Business and scope before payment. Pay once, then receive an Executive Report with findings, sources, and prioritized actions.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link className="pricing-primary" href="/intake">Start an investigation</Link>
              <Link className="pricing-secondary" href="/sample-report">View a sample report</Link>
            </div>
            <ul className="pricing-trust-strip" aria-label="Purchase summary">
              <li><span aria-hidden="true">✓</span>One-time payment</li><li><span aria-hidden="true">✓</span>Scope review before checkout</li><li><span aria-hidden="true">✓</span>Secure report access</li>
            </ul>
          </div>
        </section>

        <section className="pricing-section" aria-labelledby="available-title">
          <div className="pricing-heading"><p className="pricing-eyebrow">Available now</p><h2 id="available-title">A complete investigation for {BETA_PRODUCT.price}</h2><p>The beta offer covers one Business and one Executive Report. It is a one-time purchase in USD, with no recurring charge.</p></div>
          <article className="pricing-plan pricing-plan-featured mx-auto mt-10 max-w-4xl">
            <div className="pricing-plan-content"><div><span className="pricing-pill">One-time purchase</span><h3>{BETA_PRODUCT.name}</h3><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">Review one Business using its submitted identity, available sources, and optional customer evidence.</p></div><div className="pricing-price-block"><strong>{BETA_PRODUCT.price}</strong><span>USD, {BETA_PRODUCT.period}</span></div></div>
            <div className="pricing-includes">
              <div><h4>Executive Report</h4><ul>{BETA_PRODUCT.includes.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul></div>
              <div><h4>Purchase expectations</h4><ul><li><span aria-hidden="true">✓</span>Confirm the Business and scope before checkout</li><li><span aria-hidden="true">✓</span>Track processing status in your workspace</li><li><span aria-hidden="true">✓</span>Open the completed report from your account</li><li><span aria-hidden="true">✓</span>See evidence gaps and source availability</li></ul></div>
            </div>
            <Link className="pricing-primary" href="/intake">Start Business Investigation</Link>
            <p className="pricing-terms-note">You will see the total price and purchase terms before payment. Source availability and processing time vary by Business and submitted scope.</p>
          </article>
        </section>

        <section className="pricing-section" aria-labelledby="plans-title">
          <div className="pricing-heading"><p className="pricing-eyebrow">Plans for growing teams</p><h2 id="plans-title">Choose a path that fits your review volume</h2><p>Professional, Business, and Enterprise plans are being prepared. Subscriptions are not available yet. Talk with us to help shape the right commercial path for your team.</p></div>
          <div className="pricing-plan-grid">{PLANNED_PLANS.map((plan) => <article className="pricing-future-plan" key={plan.name}><span className="pricing-status">{plan.availability}</span><h3>{plan.name}</h3><p>{plan.audience}</p><ul>{plan.features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul><Link href={`/contact?subject=${plan.name}`} className="pricing-secondary">Discuss {plan.name}</Link></article>)}</div>
        </section>

        <section className="pricing-section" aria-labelledby="compare-title">
          <div className="pricing-heading"><p className="pricing-eyebrow">Plan comparison</p><h2 id="compare-title">One investigation today, a path for tomorrow</h2></div>
          <div className="pricing-table-wrap" tabIndex={0} aria-label="Scrollable plan comparison"><table className="pricing-table"><caption className="sr-only">Compare the available investigation with planned ShadowScore plans</caption><thead><tr><th scope="col">Capability</th><th scope="col">Investigation</th><th scope="col">Professional</th><th scope="col">Business</th><th scope="col">Enterprise</th></tr></thead><tbody>{PLAN_COMPARISON.map(([feature, ...values]) => <tr key={feature}><th scope="row">{feature}</th>{values.map((value, index) => <td key={`${feature}-${index}`}>{value}</td>)}</tr>)}</tbody></table></div>
          <p className="pricing-table-note">Planned capabilities describe product direction and may change before launch. Contact us for current availability.</p>
        </section>

        <section className="pricing-section pb-28" aria-labelledby="questions-title">
          <div className="pricing-heading"><p className="pricing-eyebrow">Purchase questions</p><h2 id="questions-title">Know what happens before you pay</h2></div>
          <div className="pricing-faq mt-10"><details><summary>When do I pay?</summary><p>Start by submitting the Business identity and investigation scope. You can review those details and the total price before checkout.</p></details><details><summary>What will I receive?</summary><p>One Executive Report for the purchased Business Investigation. It includes an executive recommendation, findings, evidence gaps, a source trail, and prioritized actions.</p></details><details><summary>How long does processing take?</summary><p>Processing depends on the Business, submitted scope, and source availability. Your workspace shows the current status and provides access when the report is ready.</p></details><details><summary>Is this a subscription?</summary><p>No. The beta Business Investigation is a one-time purchase. Professional, Business, and Enterprise subscriptions are not available yet.</p></details></div>
          <div className="enterprise-cta mt-14"><div><p className="pricing-eyebrow">Need a team plan?</p><h2>Tell us about your investigation workflow.</h2><p>Share your review volume, collaboration needs, and procurement requirements. We will respond with the current options.</p></div><Link className="pricing-primary" href="/contact?subject=Team%20plan">Contact sales</Link></div>
        </section>
      </main>
    </ShadowScoreLayout>
  );
}
