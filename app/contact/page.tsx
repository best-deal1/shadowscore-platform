import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { CONTACT_EMAIL, SUPPORT_EMAIL, buildWhatsAppUrl } from "../../lib/config";

const whatsappUrl = buildWhatsAppUrl("Hi ShadowScore, I would like to discuss a marketplace risk case.");

export default function ContactPage() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-sm uppercase tracking-[0.28em] text-red-300">Contact ShadowScore</div>
        <h1 className="mt-4 text-5xl font-black">Talk With An Analyst</h1>
        <p className="mt-6 text-lg leading-8 text-zinc-400">
          Request an early access review, discuss a marketplace or payout risk case, or ask about supported platforms, payments and partnership options.
        </p>
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <div className="text-xl font-bold">Preferred Contact</div>
          <p className="mt-4 leading-7 text-zinc-400">
            Send a short summary of the marketplace, issue type and any notice or dashboard screenshot you want reviewed. Do not send marketplace passwords, CVV details or sensitive card information.
          </p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-xl bg-red-600 px-7 py-4 font-bold text-white transition hover:bg-red-500">
            Open WhatsApp
          </a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <a href={`mailto:${CONTACT_EMAIL}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-zinc-300 transition hover:border-red-400/30 hover:text-white">
            General: {CONTACT_EMAIL}
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-zinc-300 transition hover:border-red-400/30 hover:text-white">
            Support: {SUPPORT_EMAIL}
          </a>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
