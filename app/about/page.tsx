"use client";

import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { useLocale } from "../../components/LocaleProvider";
import { publicPages } from "../../lib/i18n";

export default function AboutPage() {
  const { locale } = useLocale();
  const page = publicPages[locale].about;

  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-sm uppercase tracking-[0.28em] text-red-300">{page.eyebrow}</div>
        <h1 className="mt-4 text-5xl font-black">{page.title}</h1>
        <p className="mt-6 text-lg leading-8 text-zinc-400">
          {page.description}
        </p>
        <p className="mt-6 leading-8 text-zinc-400">
          {page.focus}
        </p>
        <p className="mt-6 leading-8 text-zinc-400">
          {page.independence}
        </p>
      </section>
    </ShadowScoreLayout>
  );
}
