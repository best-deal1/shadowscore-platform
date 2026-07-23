"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getMarketingMessages, localizedLocaleNames, localizedPath, supportedLocales, type SupportedLocale } from "../lib/i18n/localization";

export function MarketingLanguageSwitcher({ locale }: { locale: SupportedLocale }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  async function select(next: SupportedLocale) {
    await fetch("/api/locale", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: next }) });
    const path = localizedPath(pathname, next);
    router.push(searchParams.size ? `${path}?${searchParams}` : path);
  }
  const label = getMarketingMessages(locale).marketing.language;
  return <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200"><span>{label}</span><select value={locale} onChange={(event) => void select(event.target.value as SupportedLocale)} className="rounded-lg border border-white/20 bg-[#07111f] px-2 py-1 text-inherit focus:outline-none focus:ring-2 focus:ring-sky-300">{supportedLocales.map((item) => <option key={item} value={item}>{localizedLocaleNames[item]}</option>)}</select></label>;
}
