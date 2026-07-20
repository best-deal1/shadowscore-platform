"use client";

import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { useLocale } from "../../components/LocaleProvider";
import { LEGAL_ACCEPTANCE_VERSION } from "../../lib/legal";

export default function TermsPage() {
  const { t } = useLocale();
  const terms = t.legal.terms;

  return <ShadowScoreLayout><section className="mx-auto max-w-5xl px-6 py-20">
    <div className="text-sm uppercase tracking-[0.28em] text-red-300">{terms.label}</div>
    <h1 className="mt-4 text-5xl font-black">{terms.title}</h1>
    <p className="mt-6 max-w-4xl text-lg leading-8 text-zinc-400">{terms.introduction}</p>
    <div className="mt-8 rounded-3xl border border-red-400/25 bg-red-500/10 p-6"><div className="text-xs font-black uppercase tracking-[0.24em] text-red-200">{terms.acceptanceLabel}</div><div className="mt-2 font-mono text-sm text-zinc-300">{LEGAL_ACCEPTANCE_VERSION}</div><p className="mt-4 text-sm leading-7 text-zinc-400">{terms.acceptanceCopy}</p></div>
    <div className="mt-10 grid gap-6">{terms.sections.map((section) => <section key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7"><h2 className="text-2xl font-black">{section.title}</h2>{section.body.map((paragraph) => <p key={paragraph} className="mt-4 leading-8 text-zinc-400">{paragraph}</p>)}{section.items && <div className="mt-5 grid gap-3 md:grid-cols-2">{section.items.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">{item}</div>)}</div>}</section>)}</div>
  </section></ShadowScoreLayout>;
}
