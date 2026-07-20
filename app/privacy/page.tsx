"use client";

import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { useLocale } from "../../components/LocaleProvider";
import { PRIVACY_EMAIL } from "../../lib/config";

export default function PrivacyPage() {
  const { t } = useLocale();
  const privacy = t.legal.privacy;
  const interpolateEmail = (value: string) => value.replace("{email}", PRIVACY_EMAIL);

  return <ShadowScoreLayout><section className="mx-auto max-w-5xl px-6 py-20">
    <div className="text-sm uppercase tracking-[0.28em] text-red-300">{privacy.label}</div>
    <h1 className="mt-4 text-5xl font-black">{privacy.title}</h1>
    <p className="mt-6 max-w-4xl text-lg leading-8 text-zinc-400">{privacy.introduction}</p>
    <div className="mt-10 grid gap-6">{privacy.sections.map((section) => <section key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7"><h2 className="text-2xl font-black">{section.title}</h2>{section.body.map((paragraph) => <p key={paragraph} className="mt-4 leading-8 text-zinc-400">{section.title === privacy.sections.at(-1)?.title ? <>{interpolateEmail(paragraph).split(PRIVACY_EMAIL)[0]}<a href={`mailto:${PRIVACY_EMAIL}`} className="text-red-300 hover:text-red-200">{PRIVACY_EMAIL}</a>{interpolateEmail(paragraph).split(PRIVACY_EMAIL)[1]}</> : paragraph}</p>)}{section.items && <div className="mt-5 grid gap-3 md:grid-cols-2">{section.items.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">{item}</div>)}</div>}</section>)}</div>
  </section></ShadowScoreLayout>;
}
