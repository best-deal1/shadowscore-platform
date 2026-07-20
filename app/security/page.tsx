"use client";

import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { useLocale } from "../../components/LocaleProvider";
import { getUserPageCopy } from "../../lib/i18n";

export default function SecurityPage() {
  const { locale } = useLocale();
  const page = getUserPageCopy(locale).security;
  return <ShadowScoreLayout><section className="mx-auto max-w-4xl px-6 py-20"><div className="text-sm uppercase tracking-[0.28em] text-red-300">{page.eyebrow}</div><h1 className="mt-4 text-5xl font-black">{page.title}</h1><p className="mt-6 leading-8 text-zinc-400">{page.description}</p><div className="mt-8 grid gap-5 md:grid-cols-2">{page.items.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-zinc-300">{item}</div>)}</div></section></ShadowScoreLayout>;
}
