import type { Metadata } from "next";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export const metadata: Metadata = {
  title: "Pricing | ShadowScore",
  description: "Start with a free ShadowScore preview, then unlock a full investigation report for $9.90.",
  alternates: { canonical: "/pricing" },
};

type RoadmapStatus = "Coming Soon" | "Planned";

const roadmapPlans: Array<{
  name: string;
  price: string;
  period?: string;
  status: RoadmapStatus;
  description: string;
}> = [
  {
    name: "Professional Plan",
    price: "$49",
    period: "per month",
    status: "Coming Soon",
    description: "Recurring investigation tools and reports for individual professionals.",
  },
  {
    name: "Business Plan",
    price: "$199",
    period: "per month",
    status: "Planned",
    description: "Monitoring and shared workflows for operating teams.",
  },
  {
    name: "Enterprise Plan",
    price: "Contact Sales",
    status: "Planned",
    description: "Governance and deployment support for larger review programs.",
  },
];

const faqs = [
  {
    question: "What do I get for free?",
    answer: "The Free Preview includes an initial decision, key findings, and evidence gaps.",
  },
  {
    question: "When do I pay?",
    answer: "You pay only when you choose to unlock a Full Investigation Report. Each report costs $9.90.",
  },
  {
    question: "Is the report saved?",
    answer: "Yes. Your unlocked report is saved to your ShadowScore workspace.",
  },
  {
    question: "Can I buy multiple reports?",
    answer: "Yes. You can purchase a Full Investigation Report for each investigation you complete.",
  },
  {
    question: "Are subscriptions available today?",
    answer: "Professional, Business, and Enterprise subscriptions are on the product roadmap. The roadmap status for each plan is shown above.",
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
            <p className="pricing-eyebrow">Simple, one-time pricing</p>
            <h1 className="mt-5 text-5xl font-black tracking-[-0.045em] text-white sm:text-7xl">Pricing</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
              Start free. Pay only when you need a complete investigation.
            </p>
          </div>
        </section>

        <section className="pricing-section pricing-today" aria-labelledby="available-today-title">
          <div className="pricing-heading">
            <p className="pricing-eyebrow">Available today</p>
            <h2 id="available-today-title">Choose how far you want to investigate</h2>
            <p>Review the initial findings for free. Unlock the complete report when you need the full evidence review.</p>
          </div>

          <div className="pricing-offer-grid">
            <article className="pricing-offer-card">
              <div>
                <p className="pricing-availability">Available now</p>
                <h3>Free Preview</h3>
                <p className="pricing-offer-price">$0</p>
                <p className="pricing-offer-description">Get an initial view before deciding whether to unlock the full investigation.</p>
                <ul>
                  <li><CheckIcon />Initial decision</li>
                  <li><CheckIcon />Key findings</li>
                  <li><CheckIcon />Evidence gaps</li>
                </ul>
              </div>
              <Link className="pricing-secondary" href="/intake">Start Free</Link>
            </article>

            <article className="pricing-offer-card pricing-offer-card-featured">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="pricing-availability">Available now</p>
                  <span className="pricing-purchase-type">One-time purchase</span>
                </div>
                <h3>Full Investigation Report</h3>
                <p className="pricing-offer-price">$9.90</p>
                <p className="pricing-offer-description">Unlock the complete investigation after reviewing your free preview.</p>
                <ul>
                  <li><CheckIcon />Executive report</li>
                  <li><CheckIcon />Evidence review</li>
                  <li><CheckIcon />Source references</li>
                  <li><CheckIcon />Saved to workspace</li>
                </ul>
              </div>
              <Link className="pricing-primary" href="/intake">Unlock Report</Link>
            </article>
          </div>
        </section>

        <section className="pricing-section pricing-roadmap" aria-labelledby="future-plans-title">
          <div className="pricing-heading">
            <p className="pricing-eyebrow">Future plans</p>
            <h2 id="future-plans-title">Subscriptions on the roadmap</h2>
            <p>These plans show where the product is headed. They are separate from the offers available today.</p>
          </div>
          <div className="pricing-roadmap-grid">
            {roadmapPlans.map((plan) => (
              <article className="pricing-roadmap-card" key={plan.name}>
                <span className={`pricing-roadmap-status pricing-roadmap-status-${plan.status === "Planned" ? "planned" : "soon"}`}>
                  {plan.status}
                </span>
                <h3>{plan.name}</h3>
                <div className="pricing-roadmap-price">
                  <strong>{plan.price}</strong>
                  {plan.period && <span>{plan.period}</span>}
                </div>
                <p>{plan.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pricing-section pb-28" aria-labelledby="pricing-faq-title">
          <div className="pricing-heading">
            <p className="pricing-eyebrow">FAQ</p>
            <h2 id="pricing-faq-title">Purchase details</h2>
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
