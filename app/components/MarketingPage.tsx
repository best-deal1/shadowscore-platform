import Link from "next/link";
import type { MarketingPage } from "../lib/marketing";
import { MarketingCta, MarketingPageView } from "./MarketingAnalytics";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";

const related = [
  ["/business-due-diligence", "Business due diligence"], ["/company-check", "Company check"], ["/company-registry-search", "Company registry search"], ["/company-extract", "Company extract"], ["/supplier-verification", "Supplier verification"],
];

export function JsonLd({ data }: { data: object }) { return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />; }

export default function MarketingPage({ page, locale = "en" }: { page: MarketingPage; locale?: "en" | "he" }) {
  const prefix = locale === "he" ? "/he" : "";
  const faq = page.faqs ?? [];
  return <ShadowScoreLayout><div dir={locale === "he" ? "rtl" : "ltr"} className="bg-[#07111f] text-slate-100">
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "ShadowScore", item: "https://shadowscore.io" }, { "@type": "ListItem", position: 2, name: page.h1 }] }} />
    {faq.length ? <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }} /> : null}
    <main><MarketingPageView event={page.slug === "company-check" ? "company_check_viewed" : page.slug === "company-registry-search" || page.slug === "company-registry" ? "company_registry_viewed" : page.slug === "company-extract" ? "company_extract_viewed" : page.slug === "supplier-verification" || page.slug === "supplier-check" ? "supplier_verification_viewed" : "methodology_viewed"} />
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_85%_10%,rgba(14,165,233,.19),transparent_30%),#07111f] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl"><p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">{page.eyebrow}</p><h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{page.h1}</h1><p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">{page.intro}</p><div className="mt-10 flex flex-wrap gap-4"><MarketingCta className="rounded-full bg-sky-500 px-6 py-3 font-bold text-slate-950 hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Start due diligence</MarketingCta><Link href={`${prefix}/sample-report`} className="rounded-full border border-white/20 px-6 py-3 font-bold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">View sample report</Link></div></div>
      </section>
      <article className="mx-auto max-w-5xl px-6 py-16 sm:py-24"><div className="grid gap-12">{page.sections.map((section) => <section key={section.title} className="max-w-3xl"><h2 className="text-3xl font-bold tracking-tight">{section.title}</h2><p className="mt-4 text-lg leading-8 text-slate-300">{section.body}</p></section>)}</div><section className="mt-20 rounded-3xl border border-sky-300/20 bg-sky-400/10 p-8"><h2 className="text-2xl font-bold">Make the next step clear</h2><p className="mt-3 max-w-3xl leading-7 text-slate-300">ShadowScore provides independent business identity and risk intelligence. Missing evidence must not be treated as confirmed misconduct.</p><MarketingCta className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-bold text-slate-950 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Start due diligence</MarketingCta></section>{faq.length ? <section className="mt-20"><h2 className="text-3xl font-bold">Frequently asked questions</h2><div className="mt-7 divide-y divide-white/10 border-y border-white/10">{faq.map((item) => <details key={item.question} className="py-5"><summary className="cursor-pointer font-bold">{item.question}</summary><p className="mt-3 max-w-3xl leading-7 text-slate-300">{item.answer}</p></details>)}</div></section> : null}<nav aria-label="Related pages" className="mt-20"><h2 className="text-xl font-bold">Explore related checks</h2><div className="mt-5 flex flex-wrap gap-3">{related.map(([href, label]) => <Link key={href} href={`${prefix}${href}`} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{label}</Link>)}</div></nav></article>
    </main>
  </div></ShadowScoreLayout>;
}
