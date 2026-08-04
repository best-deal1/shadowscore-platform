"use client";

import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { useLocale } from "../../components/LocaleProvider";
import { publicPages } from "../../lib/i18n";

export default function AboutPage() {
  const { locale } = useLocale();
  const page = publicPages[locale].about;
  const content = locale === "he" ? {
    summary: "ShadowScore מרכזת בדיקות נאותות עסקיות בסביבת עבודה אחת. כל חקירה מחברת בין זהות העסק, מקורות, ממצאים, פערי מידע והחלטה מתועדת.",
    primary: "התחלת בדיקה",
    secondary: "צפייה בדוח לדוגמה",
    principlesTitle: "כיצד אנחנו עובדים",
    principlesIntro: "העקרונות האלה מגדירים את המוצר ואת הדרך שבה מוצגות מסקנות.",
    cards: [
      ["ראיות לפני מסקנות", "כל ממצא מקושר למקור הזמין. פערים וסתירות נשארים גלויים לאורך הבדיקה."],
      ["החלטה מעשית", "הדוח מסכם את הממצאים, רמת הביטחון והבקרות המומלצות לפני התחייבות עסקית."],
      ["היקף ברור", "ShadowScore מספקת תמיכה בהחלטות על בסיס המידע הזמין. ההחלטה הסופית נשארת בידי הלקוח."],
    ],
    factsTitle: "ShadowScore בקצרה",
    factsEyebrow: "פרטי החברה",
    facts: [["מוצר", "פלטפורמה לבדיקת נאותות עסקית"], ["תהליך", "עסק, זהות, ראיות, ניתוח, החלטה ודוח"], ["תוצר", "דוח מנהלים עם מקורות ופעולות מומלצות"], ["גישה", "סביבת עבודה פרטית ללקוחות רשומים"]],
    accountabilityTitle: "יש כתובת ברורה",
    accountabilityBody: "אפשר לפנות אלינו בשאלות על המוצר, על היקף הבדיקה או על התאמה לתהליך הרכש והסיכונים שלכם.",
    contact: "יצירת קשר",
  } : {
    summary: "ShadowScore brings business due diligence into one workspace. Each investigation connects business identity, sources, findings, evidence gaps, and a documented decision.",
    primary: "Start an investigation",
    secondary: "View a sample report",
    principlesTitle: "How we work",
    principlesIntro: "These principles shape the product and the way conclusions are presented.",
    cards: [
      ["Evidence before conclusions", "Each finding stays connected to the available source. Gaps and contradictions remain visible throughout the investigation."],
      ["A practical decision", "The report summarizes findings, confidence, and recommended controls before a business commitment."],
      ["A defined scope", "ShadowScore provides decision support based on available information. The customer retains the final decision."],
    ],
    factsTitle: "ShadowScore at a glance",
    factsEyebrow: "Company facts",
    facts: [["Product", "Business due diligence platform"], ["Workflow", "Business, identity, evidence, analysis, decision, report"], ["Deliverable", "Executive Report with sources and recommended actions"], ["Access", "Private workspace for registered customers"]],
    accountabilityTitle: "A clear point of contact",
    accountabilityBody: "Contact us with questions about the product, investigation scope, or fit with your procurement and risk workflow.",
    contact: "Contact ShadowScore",
  };

  return (
    <ShadowScoreLayout>
      <main className="bg-[#07111f] text-slate-100">
       <section className="border-b border-white/10 bg-[radial-gradient(circle_at_82%_8%,rgba(14,165,233,.2),transparent_30%),#07111f] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">{page.eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-.04em] sm:text-6xl">{page.title}</h1>
          <p className="mt-7 max-w-3xl text-xl leading-8 text-slate-300">{content.summary}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/intake" className="rounded-full bg-sky-400 px-6 py-3 font-bold text-slate-950 hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{content.primary}</Link>
            <Link href="/sample-report" className="rounded-full border border-white/20 px-6 py-3 font-bold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{content.secondary}</Link>
          </div>
        </div>
       </section>
       <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <section aria-labelledby="about-principles">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">{content.principlesTitle}</p>
          <h2 id="about-principles" className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{content.principlesIntro}</h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">{content.cards.map(([heading, body], index) => <article key={heading} className="rounded-3xl border border-white/10 bg-white/[.035] p-7"><span className="text-xs font-black tracking-[.18em] text-sky-300">0{index + 1}</span><h3 className="mt-4 text-xl font-bold text-white">{heading}</h3><p className="mt-4 leading-7 text-slate-400">{body}</p></article>)}</div>
        </section>
        <section aria-labelledby="about-facts" className="mt-20 grid gap-10 rounded-3xl border border-white/10 bg-[#0a1626] p-7 sm:p-10 lg:grid-cols-[.75fr_1.25fr]">
          <div><p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">{content.factsEyebrow}</p><h2 id="about-facts" className="mt-4 text-3xl font-bold">{content.factsTitle}</h2><p className="mt-5 leading-7 text-slate-400">{page.description}</p></div>
          <dl className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">{content.facts.map(([term, detail]) => <div key={term} className="bg-[#0b1727] p-5"><dt className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">{term}</dt><dd className="mt-2 font-semibold leading-6 text-slate-200">{detail}</dd></div>)}</dl>
        </section>
        <section className="mt-20 flex flex-col gap-7 rounded-3xl border border-sky-300/20 bg-sky-400/10 p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between" aria-labelledby="about-contact"><div><h2 id="about-contact" className="text-3xl font-bold">{content.accountabilityTitle}</h2><p className="mt-3 max-w-3xl leading-7 text-slate-300">{content.accountabilityBody}</p></div><Link href="/contact" className="shrink-0 rounded-full bg-white px-6 py-3 text-center font-bold text-slate-950 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{content.contact}</Link></section>
       </div>
      </main>
    </ShadowScoreLayout>
  );
}
