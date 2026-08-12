import type { Metadata } from "next";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";
import { BETA_PRODUCT, PLAN_COMPARISON, PRICING_PLANS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Plans and pricing | ShadowScore",
  description: "Compare ShadowScore plans for individual investigations, professionals, teams, and organizations.",
  alternates: { canonical: "/pricing" },
};

const pricingFaq = [
  ["How is the Individual plan billed?", `Individual is a one-time ${BETA_PRODUCT.price} USD purchase. It covers one Business Investigation, one Executive Report, and workspace access for that investigation.`],
  ["How are the other plans billed?", "Professional, Business, and Enterprise are monthly commercial plans. Your order summary confirms the plan, billing terms, and total before commitment."],
  ["Which plan is best for a team?", "Business is designed for teams that need a shared workspace, shared reports, role-based access, and higher investigation volume."],
  ["Can I start with one investigation?", "Yes. Choose Individual to complete one investigation. You can discuss a higher-volume plan later as your review needs grow."],
  ["What does an Executive Report include?", "Each report presents an executive recommendation, supported findings, evidence gaps, a source trail, and prioritized actions."],
  ["How do organization controls differ?", "Enterprise adds organization-level governance, access policies, advanced workflow capabilities, and priority support."],
] as const;

export default function PricingPage() {
  return (
    <ShadowScoreLayout hideReviewMessaging>
      <main className="pricing-page" id="main-content">
        <section className="pricing-hero" aria-labelledby="pricing-title">
          <p className="pricing-eyebrow">Plans for every investigation workflow</p>
          <h1 id="pricing-title">Choose the right level of business intelligence.</h1>
          <p>Start with one investigation or equip a team with shared reports, controls, and higher investigation volume.</p>
          <ul className="pricing-trust-strip" aria-label="Plan terms">
            <li><span aria-hidden="true">✓</span>Clear billing cadence</li>
            <li><span aria-hidden="true">✓</span>Executive Reports included</li>
            <li><span aria-hidden="true">✓</span>Workspace access</li>
          </ul>
        </section>

        <section className="pricing-plans-section" aria-labelledby="plans-title">
          <h2 className="sr-only" id="plans-title">ShadowScore pricing plans</h2>
          <div className="pricing-plan-grid">
            {PRICING_PLANS.map((plan) => (
              <article className={`pricing-plan${plan.recommended ? " pricing-plan-featured" : ""}`} key={plan.id} aria-labelledby={`${plan.id}-title`}>
                <div>
                  <div className="pricing-plan-topline">
                    <span>{plan.label}</span>
                    {plan.recommended ? <strong>Recommended</strong> : null}
                  </div>
                  <h3 id={`${plan.id}-title`}>{plan.name}</h3>
                  <p className="pricing-plan-audience">{plan.audience}</p>
                  <div className="pricing-price-block"><strong>{plan.price}</strong><span>USD<br />{plan.cadence}</span></div>
                  <div className="pricing-plan-rule" />
                  <p className="pricing-plan-label">What is included</p>
                  <ul>{plan.features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul>
                </div>
                <Link className={plan.recommended ? "pricing-primary" : "pricing-secondary"} href={plan.href} aria-label={`${plan.cta}, ${plan.price} ${plan.cadence}`}>{plan.cta}</Link>
              </article>
            ))}
          </div>
          <p className="pricing-commercial-note"><strong>Individual is a one-time purchase.</strong> Professional, Business, and Enterprise are monthly commercial plans. USD pricing is shown before applicable taxes.</p>
        </section>

        <section className="pricing-section" aria-labelledby="comparison-title">
          <div className="pricing-heading"><p className="pricing-eyebrow">Compare plans</p><h2 id="comparison-title">The essentials, side by side.</h2><p>Compare investigation access, workspace structure, collaboration, and support.</p></div>
          <div className="pricing-table-wrap" tabIndex={0} role="region" aria-label="Plan feature comparison">
            <table className="pricing-table">
              <thead><tr><th scope="col">Capability</th>{PRICING_PLANS.map((plan) => <th scope="col" key={plan.id}>{plan.name}<small>{plan.price}</small></th>)}</tr></thead>
              <tbody>{PLAN_COMPARISON.map(([feature, ...values]) => <tr key={feature}><th scope="row">{feature}</th>{values.map((value, index) => <td key={`${feature}-${PRICING_PLANS[index].id}`}>{value}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="pricing-section pricing-faq-section" aria-labelledby="questions-title">
          <div className="pricing-heading"><p className="pricing-eyebrow">Pricing FAQ</p><h2 id="questions-title">Questions before you choose.</h2></div>
          <div className="pricing-faq">{pricingFaq.map(([question, answer]) => <details key={question}><summary><span>{question}</span><span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
        </section>

        <section className="pricing-final-cta" aria-labelledby="final-cta-title"><div><p className="pricing-eyebrow">Start with one decision</p><h2 id="final-cta-title">Run one Business Investigation for {BETA_PRODUCT.price}.</h2><p>Confirm the scope before payment, then access the completed Executive Report in your workspace.</p></div><Link className="pricing-primary" href="/intake">Start an investigation</Link></section>
      </main>
    </ShadowScoreLayout>
  );
}
