"use client";

import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { useLocale } from "../../components/LocaleProvider";
import { getUserPageCopy } from "../../lib/i18n";

export default function SecurityPage() {
  const { locale } = useLocale();
  const page = getUserPageCopy(locale).security;
  return <ShadowScoreLayout><main className="mx-auto max-w-6xl px-6 py-20"><div className="max-w-3xl"><div className="text-sm uppercase tracking-[0.28em] text-red-300">{page.eyebrow}</div><h1 className="mt-4 text-5xl font-black">{page.title}</h1><p className="mt-6 text-lg leading-8 text-zinc-400">{page.description}</p></div><div className="mt-12 grid gap-5 md:grid-cols-2">{page.sections.map((section, index) => <section key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7" aria-labelledby={`security-section-${index}`}><div className="text-xs font-black tracking-[.18em] text-red-300">0{index + 1}</div><h2 id={`security-section-${index}`} className="mt-4 text-2xl font-black text-white">{section.title}</h2><ul className="mt-5 space-y-3 text-sm leading-6 text-zinc-300">{section.items.map(item => <li key={item} className="flex gap-3"><span aria-hidden="true" className="text-red-300">•</span><span>{item}</span></li>)}</ul></section>)}</div></main></ShadowScoreLayout>;
}
