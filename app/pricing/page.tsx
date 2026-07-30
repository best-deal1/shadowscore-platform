import type { Metadata } from "next";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export const metadata: Metadata = {
  title: "Pricing | ShadowScore",
  description: "One Business Investigation produces one Executive Report for a one-time price of $9.90.",
  alternates: { canonical: "/pricing" },
};

const faqs = [
  {
    question: "What do I get for free?",
    answer: "Starting an Investigation is free. You can identify the Business and review the scope before payment.",
  },
  {
    question: "When do I pay?",
    answer: "Payment occurs after you confirm the Business and scope. One Executive Report costs $9.90.",
  },
  {
    question: "Is the report saved?",
    answer: "Yes. Your Executive Report remains attached to its Investigation in Archive.",
  },
  {
    question: "Can I buy multiple reports?",
    answer: "Yes. Each purchase covers one Business and one Investigation.",
  },
  {
    question: "Is a subscription required?",
    answer: "No. The $9.90 price is a one-time payment for one Executive Report.",
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
              One Business Investigation produces one Executive Report for a one-time price of $9.90.
            </p>
          </div>
        </section>

        <section className="pricing-section pricing-today" aria-labelledby="available-today-title">
          <div className="pricing-heading">
            <p className="pricing-eyebrow">Available today</p>
            <h2 id="available-today-title">One clear purchase</h2>
            <p>Starting is free. Payment is required to generate the Executive Report. No subscription is required.</p>
          </div>

          <div className="pricing-offer-grid pricing-offer-grid-single">
            <article className="pricing-offer-card pricing-offer-card-featured">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="pricing-availability">Available now</p>
                  <span className="pricing-purchase-type">One-time purchase</span>
                </div>
                <h3>Executive Report</h3>
                <p className="pricing-offer-price">$9.90</p>
                <p className="pricing-offer-description">Start free. Confirm the Business and scope, then pay once to generate the report.</p>
                <ul>
                  <li><CheckIcon />Free Investigation setup and scope review</li>
                  <li><CheckIcon />Executive report</li>
                  <li><CheckIcon />Evidence review</li>
                  <li><CheckIcon />Source references</li>
                  <li><CheckIcon />Saved to Archive</li>
                </ul>
              </div>
              <Link className="pricing-primary" href="/intake">Start Investigation</Link>
            </article>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-6 text-zinc-400">You will see the Business, Investigation scope, and total price before payment. Payment is processed by the selected provider.</p>
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
