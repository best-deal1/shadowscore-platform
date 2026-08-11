import type { Metadata } from "next";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";
import { BETA_PRODUCT, PLANNED_PLANS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Business Investigation pricing | ShadowScore",
  description: `Purchase one ShadowScore ${BETA_PRODUCT.name} for ${BETA_PRODUCT.price} USD and receive an ${BETA_PRODUCT.deliverable}.`,
  alternates: { canonical: "/pricing" },
};

const investigationSteps = [
  ["Submit", "Provide the Business identity, your decision context, and any evidence you want considered."],
  ["Confirm scope", "Review the Business and investigation scope before making a purchase."],
  ["Pay once", `Complete one ${BETA_PRODUCT.price} USD payment for the confirmed investigation.`],
  ["Investigate", "ShadowScore evaluates available sources, records evidence gaps, and prepares the findings."],
  ["Access report", "Track progress in your workspace, then open the completed Executive Report from your account."],
] as const;

const reportDetails = [
  ["Executive recommendation", "A concise decision summary with the most important next action."],
  ["Findings and evidence gaps", "What the available evidence supports, plus material information that could not be confirmed."],
  ["Source trail", "A traceable record of the sources used to support the investigation."],
  ["Prioritized action plan", "Practical follow-up steps ordered by their value to the decision."],
] as const;

const purchaseFaq = [
  ["When and how do I pay?", `You submit and confirm the investigation scope first. Checkout then shows the ${BETA_PRODUCT.price} USD total for a one-time payment before you authorize it.`],
  ["What will I receive?", "You receive one Executive Report for the purchased Business Investigation. It contains an executive recommendation, findings, evidence gaps, a source trail, and prioritized actions."],
  ["How long does processing take?", "Processing time depends on the submitted scope, source availability, and the Business being reviewed. Your workspace shows the investigation status while the report is prepared."],
  ["What happens when a source is unavailable?", "The report identifies relevant evidence gaps and source limitations. Findings reflect the evidence that was available for the investigation."],
  ["How do I access my report?", "Sign in to your private workspace to track processing and open the completed report. Access remains tied to the account used for the purchase."],
  ["Can I purchase another investigation?", "Yes. Each purchase covers one confirmed Business Investigation and one Executive Report. Start a new investigation whenever you need to review another Business or scope."],
] as const;

export default function PricingPage() {
  return (
    <ShadowScoreLayout hideReviewMessaging>
      <main className="pricing-page" id="main-content">
        <section className="pricing-hero" aria-labelledby="pricing-title">
          <div className="pricing-hero-copy">
            <p className="pricing-eyebrow">One investigation. One clear price.</p>
            <h1 id="pricing-title">Investigate a Business before the decision.</h1>
            <p className="pricing-hero-lede">Submit the Business, confirm the scope, and pay once. ShadowScore turns available evidence into an Executive Report with findings, limitations, and prioritized actions.</p>
            <div className="pricing-hero-actions">
              <Link className="pricing-primary" href="/intake">Start Business Investigation</Link>
              <Link className="pricing-secondary" href="/sample-report">View Sample Report</Link>
            </div>
            <ul className="pricing-trust-strip" aria-label="Purchase summary">
              <li><span aria-hidden="true">✓</span>Scope confirmed first</li>
              <li><span aria-hidden="true">✓</span>One-time payment</li>
              <li><span aria-hidden="true">✓</span>Private report access</li>
            </ul>
          </div>

          <article className="pricing-offer" aria-labelledby="offer-title">
            <div className="pricing-offer-topline">
              <span>Available now</span>
              <span>One-time purchase</span>
            </div>
            <h2 id="offer-title">{BETA_PRODUCT.name}</h2>
            <p className="pricing-offer-description">One evidence-based review of one confirmed Business and scope.</p>
            <div className="pricing-price">
              <strong>{BETA_PRODUCT.price}</strong>
              <span>{BETA_PRODUCT.currency}<br />{BETA_PRODUCT.period}</span>
            </div>
            <div className="pricing-offer-rule" />
            <p className="pricing-offer-label">Your purchase includes</p>
            <ul className="pricing-offer-includes">
              <li><span aria-hidden="true">✓</span>One Business Investigation</li>
              <li><span aria-hidden="true">✓</span>One Executive Report</li>
              <li><span aria-hidden="true">✓</span>Workspace status tracking</li>
              <li><span aria-hidden="true">✓</span>Secure account access</li>
            </ul>
            <Link className="pricing-primary pricing-offer-action" href="/intake">Start Business Investigation</Link>
            <p className="pricing-terms-note">The total and purchase terms appear before payment. Source coverage and processing time vary by investigation.</p>
          </article>
        </section>

        <section className="pricing-section pricing-flow" aria-labelledby="flow-title">
          <div className="pricing-heading pricing-heading-left">
            <p className="pricing-eyebrow">How it works</p>
            <h2 id="flow-title">From Business details to a decision-ready report.</h2>
            <p>You stay in control of the scope and purchase before the investigation begins.</p>
          </div>
          <ol className="pricing-steps">
            {investigationSteps.map(([title, description], index) => (
              <li key={title}>
                <span className="pricing-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pricing-section pricing-report" aria-labelledby="report-title">
          <div className="pricing-report-intro">
            <p className="pricing-eyebrow">The deliverable</p>
            <h2 id="report-title">An Executive Report built for the next decision.</h2>
            <p>The report separates supported findings from unavailable evidence and turns the investigation into a practical course of action.</p>
            <Link className="pricing-secondary" href="/sample-report">View Sample Report</Link>
          </div>
          <div className="pricing-report-grid">
            {reportDetails.map(([title, description], index) => (
              <article key={title}>
                <span aria-hidden="true">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pricing-section pricing-team-paths" aria-labelledby="team-paths-title">
          <div className="pricing-heading pricing-heading-left">
            <p className="pricing-eyebrow">For larger review programs</p>
            <h2 id="team-paths-title">Need a team or organization path?</h2>
            <p>Professional, Business, and Enterprise options support conversations about higher investigation volume, collaboration, and governance.</p>
          </div>
          <div className="pricing-compact-plans">
            {PLANNED_PLANS.map((plan) => (
              <article key={plan.name}>
                <div><h3>{plan.name}</h3><span>{plan.availability}</span></div>
                <p>{plan.audience}</p>
                <Link href={`/contact?subject=${plan.name}`}>Discuss requirements <span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="pricing-section pricing-faq-section" aria-labelledby="questions-title">
          <div className="pricing-heading">
            <p className="pricing-eyebrow">Purchase FAQ</p>
            <h2 id="questions-title">What to expect before and after payment.</h2>
          </div>
          <div className="pricing-faq">
            {purchaseFaq.map(([question, answer]) => (
              <details key={question}>
                <summary><span>{question}</span><span aria-hidden="true">+</span></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="pricing-final-cta" aria-labelledby="final-cta-title">
          <div>
            <p className="pricing-eyebrow">Ready to investigate?</p>
            <h2 id="final-cta-title">Start with the Business and decision you need to review.</h2>
            <p>Confirm the scope before you pay {BETA_PRODUCT.price} USD for one complete investigation.</p>
          </div>
          <Link className="pricing-primary" href="/intake">Start Business Investigation</Link>
        </section>
      </main>
    </ShadowScoreLayout>
  );
}
