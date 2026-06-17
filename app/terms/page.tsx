import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { LEGAL_ACCEPTANCE_VERSION } from "../../lib/legal";

const noGuarantees = [
  "Account approval",
  "Account reinstatement",
  "Suspension prevention",
  "Marketplace acceptance",
  "Verification approval",
  "Payment release",
  "Revenue growth",
  "Sales performance",
  "Business success",
  "Legal or regulatory outcomes",
];

const platforms = "eBay, Amazon, Etsy, Walmart, TikTok Shop, PayPal, Payoneer, Stripe and any other marketplace, payment provider or third-party platform referenced on the site";

export default function TermsPage() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-sm uppercase tracking-[0.28em] text-red-300">Terms of Service</div>
        <h1 className="mt-4 text-5xl font-black">Independent Risk Intelligence Only</h1>
        <p className="mt-6 max-w-4xl text-lg leading-8 text-zinc-400">
          These Terms explain how ShadowScore reports, scans, reviews and risk assessments may be used. ShadowScore provides informational risk intelligence, analytical insights and predictive assessments only.
        </p>

        <div className="mt-8 rounded-3xl border border-red-400/25 bg-red-500/10 p-6">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-red-200">Legal Acceptance Version</div>
          <div className="mt-2 font-mono text-sm text-zinc-300">{LEGAL_ACCEPTANCE_VERSION}</div>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            Users must accept the checkout disclaimer before payment. This acceptance is required before opening payment options.
          </p>
        </div>

        <div className="mt-10 grid gap-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">1. Informational Use Only</h2>
            <p className="mt-4 leading-8 text-zinc-400">
              ShadowScore provides risk intelligence, estimates, scorecards, reports, recommendations and analytical insights for informational purposes only. The platform does not provide legal, financial, tax, accounting, investment, compliance or professional advice.
            </p>
            <p className="mt-4 leading-8 text-zinc-400">
              All final business, compliance, operational, legal and financial decisions remain the sole responsibility of the user.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">2. No Guarantees</h2>
            <p className="mt-4 leading-8 text-zinc-400">ShadowScore does not guarantee any of the following:</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {noGuarantees.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">{item}</div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">3. Risk Scores Are Analytical Opinions</h2>
            <p className="mt-4 leading-8 text-zinc-400">
              Risk scores, confidence scores, probabilities, severity labels, recommendations and assessments are opinion-based analytical outputs generated from available evidence, public information, user-provided information, AI analysis and proprietary methodologies.
            </p>
            <p className="mt-4 leading-8 text-zinc-400">
              Risk scores should not be interpreted as factual statements, certifications, endorsements, guarantees, official approvals or determinations of trustworthiness.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">4. Independent Third-Party Decisions</h2>
            <p className="mt-4 leading-8 text-zinc-400">
              Marketplace operators and payment providers make independent decisions that ShadowScore cannot control. This includes {platforms}.
            </p>
            <p className="mt-4 leading-8 text-zinc-400">
              ShadowScore is not affiliated with, endorsed by, controlled by or officially connected to those third parties unless explicitly stated in writing.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">5. User Evidence And Accuracy</h2>
            <p className="mt-4 leading-8 text-zinc-400">
              Users are responsible for providing accurate, complete and lawful information. Missing, outdated, altered, incomplete or misleading information may reduce report quality or produce inaccurate assessments.
            </p>
            <p className="mt-4 leading-8 text-zinc-400">
              Users must not upload passwords, CVV data, unnecessary personal identity documents, private marketplace credentials or any information they are not authorized to share.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">6. No Refund After Delivery</h2>
            <p className="mt-4 leading-8 text-zinc-400">
              Once a report, scan, review, consultation, analysis or other digital service has been generated, delivered, shared or substantially performed, the service is considered consumed and non-refundable.
            </p>
            <p className="mt-4 leading-8 text-zinc-400">
              ShadowScore may review exceptional cases at its discretion, but no refund is guaranteed after delivery.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">7. Limitation Of Liability</h2>
            <p className="mt-4 leading-8 text-zinc-400">
              To the maximum extent permitted by law, ShadowScore shall not be liable for direct, indirect, incidental, special, consequential or business damages arising from use of the platform, reliance on reports or actions taken by third parties.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">8. Changes To Terms</h2>
            <p className="mt-4 leading-8 text-zinc-400">
              ShadowScore may update these Terms from time to time. Continued use of the service after changes means acceptance of the updated Terms.
            </p>
          </section>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
