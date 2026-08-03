"use client";

import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { useLocale } from "../../components/LocaleProvider";
import { CONTACT_EMAIL } from "../../lib/config";
import { LEGAL_ACCEPTANCE_VERSION } from "../../lib/legal";

export default function TermsPage() {
  const { t } = useLocale();
  const terms = t.legal.terms;

  return <ShadowScoreLayout><main className="mx-auto max-w-6xl px-6 py-12 sm:py-20">
    <div className="text-sm uppercase tracking-[0.28em] text-red-300">{terms.label}</div>
    <h1 className="mt-4 max-w-4xl text-4xl font-black sm:text-5xl">{terms.title}</h1>
    <p className="mt-6 max-w-4xl text-lg leading-8 text-zinc-400">{terms.introduction}</p>
    <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="grid gap-6">
        <div className="rounded-3xl border border-red-400/25 bg-red-500/10 p-6"><div className="text-xs font-black uppercase tracking-[0.24em] text-red-200">{terms.acceptanceLabel}</div><div className="mt-2 font-mono text-sm text-zinc-300">{LEGAL_ACCEPTANCE_VERSION}</div><p className="mt-4 text-sm leading-7 text-zinc-300">{terms.acceptanceCopy}</p></div>
        {terms.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.title} className="scroll-mt-28 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7"><h2 className="text-2xl font-black">{section.title}</h2>{section.body.map((paragraph) => <p key={paragraph} className="mt-4 max-w-3xl leading-8 text-zinc-400">{paragraph}</p>)}{section.items && <ul className="mt-5 grid gap-3 sm:grid-cols-2">{section.items.map((item) => <li key={item} className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">{item}</li>)}</ul>}</section>)}
      </div>
      <aside className="order-first rounded-3xl border border-white/10 bg-zinc-950/80 p-6 lg:order-none lg:sticky lg:top-24">
        <nav aria-label={terms.label}><ol className="space-y-3 text-sm">{terms.sections.map((section, index) => <li key={section.title}><a href={`#section-${index + 1}`} className="block text-zinc-400 underline-offset-4 hover:text-white hover:underline focus-visible:text-white">{section.title}</a></li>)}</ol></nav>
        <div className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-zinc-400"><a href="/privacy" className="font-bold text-red-300 underline-offset-4 hover:text-red-200 hover:underline">{t.legal.privacy.label}</a><br /><a href={`mailto:${CONTACT_EMAIL}`} className="mt-2 inline-block break-all underline underline-offset-4 hover:text-white">{CONTACT_EMAIL}</a></div>
      </aside>
    </div>
  </main></ShadowScoreLayout>;
}
