import type { Metadata } from "next";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export const metadata: Metadata = {
  title: "Pricing | ShadowScore",
  description: "Compare four ShadowScore investigation plans for business trust, relationship, commitment, and monitoring decisions.",
  alternates: { canonical: "/pricing" },
};

const plans = [
  {
    name: "Quick Investigation",
    price: "$49",
    period: "one time",
    decision: "Should I trust this business?",
    description: "Get a focused trust assessment before a first purchase, payment, or conversation.",
    features: ["Business identity check", "Key risk signals", "Clear trust recommendation"],
    cta: "Start Quick Investigation",
  },
  {
    name: "Professional Investigation",
    price: "$99",
    period: "one time",
    decision: "Should I move forward with this supplier, customer, or partner?",
    description: "Assess the relationship before you sign, extend terms, or begin working together.",
    features: ["Full evidence review", "Relationship risk analysis", "Recommended next steps"],
    cta: "Start Professional Investigation",
    featured: true,
  },
  {
    name: "Business Intelligence Report",
    price: "$199",
    period: "one time",
    decision: "Should I commit to a high-value business relationship?",
    description: "Support a high-value commitment with a detailed view of the business, its risks, and the available evidence.",
    features: ["Detailed business assessment", "Evidence and risk analysis", "Executive decision report"],
    cta: "Order Intelligence Report",
  },
  {
    name: "Continuous Monitoring",
    price: "$299",
    period: "per month",
    decision: "Notify me when the business risk changes.",
    description: "Track an active relationship and receive an alert when new information changes its risk profile.",
    features: ["Ongoing risk review", "Material change alerts", "Updated decision context"],
    cta: "Start Monitoring",
  },
];

const faqs = [
  {
    question: "Which investigation should I choose?",
    answer: "Choose based on the decision at stake. Quick supports an initial trust decision. Professional supports a working relationship. Business Intelligence supports a high-value commitment.",
  },
  {
    question: "When should I use Continuous Monitoring?",
    answer: "Use Continuous Monitoring after you begin an important business relationship and need to know when its risk changes.",
  },
  {
    question: "Where do I start?",
    answer: "Select a plan and provide the business details. You will review the investigation scope before payment.",
  },
];

function CheckIcon() {
  return <span aria-hidden="true">✓</span>;
}

export default function PricingPage() {
  return (
    <ShadowScoreLayout>
      <main className="pricing-page">
        <section className="pricing-hero px-6 pb-14 pt-20 text-center sm:pt-28">
          <div className="mx-auto max-w-4xl">
            <p className="pricing-eyebrow">Investigation plans</p>
            <h1 className="mt-5 text-5xl font-black tracking-[-0.045em] text-white sm:text-7xl">Business confidence before you commit</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
              Choose the investigation that matches the business decision you need to make.
            </p>
          </div>
        </section>

        <section className="pricing-section pricing-today" aria-labelledby="plans-title">
          <div className="pricing-heading">
            <p className="pricing-eyebrow">Four business decisions</p>
            <h2 id="plans-title">Choose based on what is at stake</h2>
            <p>Each plan provides the level of review needed for a specific business decision.</p>
          </div>

          <div className="mt-14 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article className={`pricing-plan ${plan.featured ? "pricing-plan-featured" : ""}`} key={plan.name}>
                <div>
                  <span className="pricing-pill">{plan.name}</span>
                  <div className="mt-5 flex items-end gap-2">
                    <strong>{plan.price}</strong>
                    <span className="pb-1 text-sm text-zinc-500">{plan.period}</span>
                  </div>
                  <h3>{plan.decision}</h3>
                  <p className="mt-4 text-sm leading-6 text-zinc-400">{plan.description}</p>
                  <ul>
                    {plan.features.map((feature) => <li key={feature}><CheckIcon />{feature}</li>)}
                  </ul>
                </div>
                <Link className={plan.featured ? "pricing-primary" : "pricing-secondary"} href="/intake">{plan.cta}</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="pricing-section" aria-labelledby="comparison-title">
          <div className="pricing-heading">
            <p className="pricing-eyebrow">Comparison</p>
            <h2 id="comparison-title">Match the plan to the decision</h2>
          </div>
          <div className="pricing-table-wrap">
            <table>
              <thead><tr><th scope="col">Plan</th>{plans.map((plan) => <th className={plan.featured ? "is-featured" : ""} scope="col" key={plan.name}>{plan.name}</th>)}</tr></thead>
              <tbody>
                <tr><th scope="row">Decision</th>{plans.map((plan) => <td className={plan.featured ? "is-featured" : ""} key={plan.name}>{plan.decision}</td>)}</tr>
                <tr><th scope="row">Price</th>{plans.map((plan) => <td className={plan.featured ? "is-featured" : ""} key={plan.name}>{plan.price} {plan.period}</td>)}</tr>
                <tr><th scope="row">Review type</th><td>Focused</td><td className="is-featured">Comprehensive</td><td>Detailed</td><td>Ongoing</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="pricing-section pb-28" aria-labelledby="pricing-faq-title">
          <div className="pricing-heading">
            <p className="pricing-eyebrow">FAQ</p>
            <h2 id="pricing-faq-title">Choosing a plan</h2>
          </div>
          <div className="mx-auto mt-12 max-w-4xl space-y-3">
            {faqs.map((faq) => (
              <details className="pricing-faq" key={faq.question}>
                <summary>{faq.question}<span aria-hidden="true">+</span></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </ShadowScoreLayout>
  );
}
