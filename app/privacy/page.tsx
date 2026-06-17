import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { PRIVACY_EMAIL } from "../../lib/config";

export default function PrivacyPage() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-sm uppercase tracking-[0.28em] text-red-300">Privacy Policy</div>
        <h1 className="mt-4 text-5xl font-black">Privacy First Risk Intelligence</h1>
        <p className="mt-6 max-w-4xl text-lg leading-8 text-zinc-400">
          ShadowScore is designed around evidence uploads, public information, user-provided context and analytical review. Initial assessments do not require marketplace passwords.
        </p>

        <div className="mt-10 grid gap-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">What We Collect</h2>
            <p className="mt-4 leading-8 text-zinc-400">
              We may collect store URLs, marketplace names, screenshots, documents, messages, payout notices, tracking evidence, contact information, payment preference, and other information you choose to provide for a risk review.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">How We Use Information</h2>
            <p className="mt-4 leading-8 text-zinc-400">
              We use information to prepare assessments, generate reports, provide support, improve risk models, prevent abuse, maintain records of legal acceptance and operate the ShadowScore service.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">What Not To Upload</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                "Marketplace passwords",
                "Card numbers or CVV codes",
                "Unnecessary identity documents",
                "Private API keys",
                "Bank login credentials",
                "Information you are not authorized to share",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">{item}</div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">Data Sharing</h2>
            <p className="mt-4 leading-8 text-zinc-400">
              We do not sell customer documents or marketplace data. We may use trusted service providers for hosting, communication, analytics, payment processing and support where required to operate the service.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">Legal Acceptance Records</h2>
            <p className="mt-4 leading-8 text-zinc-400">
              When users proceed to checkout, ShadowScore may create a reference ID, timestamp and acceptance version to document that the user accepted the Terms of Service and Privacy Policy before payment.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-2xl font-black">Privacy Requests</h2>
            <p className="mt-4 leading-8 text-zinc-400">
              For privacy requests, contact <a href={`mailto:${PRIVACY_EMAIL}`} className="text-red-300 hover:text-red-200">{PRIVACY_EMAIL}</a>.
            </p>
          </section>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
