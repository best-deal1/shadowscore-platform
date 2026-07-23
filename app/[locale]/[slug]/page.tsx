import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "../../components/MarketingPage";
import { MarketingLanguageSwitcher } from "../../../components/MarketingLanguageSwitcher";
import { englishPages } from "../../lib/marketing";
import { getMarketingMessages, isSupportedLocale, localizedMarketingMetadata, localizedPath, supportedLocales, type SupportedLocale } from "../../../lib/i18n/localization";

export function generateStaticParams() {
  return supportedLocales.filter((locale) => locale !== "en").flatMap((locale) => Object.keys(englishPages).map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale) || locale === "en" || !englishPages[slug]) return {};
  return localizedMarketingMetadata(locale, slug);
}

export default async function LocalizedMarketingPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale) || locale === "en" || !englishPages[slug]) notFound();
  return <LocalizedPage locale={locale} slug={slug} />;
}

function LocalizedPage({ locale, slug }: { locale: SupportedLocale; slug: string }) {
  const copy = getMarketingMessages(locale).marketing;
  const href = (path: string) => localizedPath(path, locale);
  const related = Object.keys(englishPages).filter((item) => item !== slug).slice(0, 5);
  return <main dir={locale === "ar" || locale === "he" ? "rtl" : "ltr"} className="min-h-screen bg-[#07111f] text-slate-100">
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: copy.title, description: copy.description, inLanguage: locale, url: `https://shadowscore.io${href(`/${slug}`)}` }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: copy.home, item: `https://shadowscore.io${href("/")}` }, { "@type": "ListItem", position: 2, name: copy.title }] }} />
    <div className="mx-auto flex max-w-5xl justify-end px-6 pt-6"><MarketingLanguageSwitcher locale={locale} /></div><section className="border-b border-white/10 bg-[radial-gradient(circle_at_85%_10%,rgba(14,165,233,.19),transparent_30%),#07111f] px-6 py-20 sm:py-28"><div className="mx-auto max-w-5xl"><p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">{copy.eyebrow}</p><h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{copy.title}</h1><p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">{copy.intro}</p><div className="mt-10 flex flex-wrap gap-4"><Link href="/intake" className="rounded-full bg-sky-500 px-6 py-3 font-bold text-slate-950 hover:bg-sky-400">{copy.cta}</Link><Link href={href("/sample-report")} className="rounded-full border border-white/20 px-6 py-3 font-bold hover:bg-white/10">{copy.sample}</Link></div></div></section>
    <article className="mx-auto max-w-5xl px-6 py-16 sm:py-24"><nav aria-label={copy.breadcrumb} className="mb-12 text-sm text-slate-400"><Link href={href("/")} className="hover:text-white">{copy.home}</Link><span className="mx-2" aria-hidden="true">/</span><span>{copy.title}</span></nav><section className="max-w-3xl"><h2 className="text-3xl font-bold tracking-tight">{copy.next}</h2><p className="mt-4 text-lg leading-8 text-slate-300">{copy.notice}</p></section><section className="mt-20"><h2 className="text-xl font-bold">{copy.related}</h2><div className="mt-5 flex flex-wrap gap-3">{related.map((item) => <Link key={item} href={href(`/${item}`)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/10">{copy.title}</Link>)}</div></section></article>
  </main>;
}
