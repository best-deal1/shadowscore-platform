"use client";

import Link from "next/link";
import PaymentButtons from "../components/PaymentButtons";
import ShadowScoreLayout from "../components/ShadowScoreLayout";
import { useLocale } from "../../components/LocaleProvider";
import { publicPages } from "../../lib/i18n";

export default function UpgradePage() {
  const { locale } = useLocale();
  const page = publicPages[locale].plans;

  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[.95fr_1.05fr] lg:items-start">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.32em] text-red-300">{page.eyebrow}</div>
            <h1 className="mt-5 text-5xl font-black tracking-tight">{page.title}</h1>
            <p className="mt-5 text-lg leading-8 text-zinc-400">{page.description}</p>
          </div>
          <div className="rounded-[34px] border border-red-400/25 bg-red-500/[0.07] p-7">
            <div className="text-sm font-black uppercase tracking-[0.22em] text-red-200">{page.availableAfterPayment}</div>
            <div className="mt-6 space-y-3">
              {page.unlocks.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/45 p-4 text-sm font-bold text-zinc-100">✓ {item}</div>)}
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <PaymentButtons planName="Downloadable Professional Report" price="$9.90" buttonLabel={page.upgrade} />
              <Link href="/intake" className="rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-black text-white hover:border-red-400/30">{page.runScanFirst}</Link>
            </div>
          </div>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
