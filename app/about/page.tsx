"use client";

import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { useLocale } from "../../components/LocaleProvider";
import { publicPages } from "../../lib/i18n";

export default function AboutPage() {
  const { locale } = useLocale();
  const page = publicPages[locale].about;
  const cards = locale === "he" ? [
    ["המשימה שלנו", "לעזור לצוותים לקבל החלטות עסקיות מתועדות על בסיס זהות, מקורות, ראיות ומגבלות ברורות."],
    ["הפלטפורמה", "סביבת עבודה אחת מחברת קליטה, פתרון זהות, איסוף מקורות, ניתוח, ניטור ודוח מנהלים."],
    ["למי היא מיועדת", "ShadowScore משרתת אנליסטים, צוותי סיכונים ומקבלי החלטות שבודקים חברות, ספקים ושותפים."],
    ["אחריות", "כל דוח מפריד בין עובדות, הערכות, פערי מידע ובקרות מומלצות. המקורות וההיקף נשארים גלויים לבדיקה."],
  ] : [
    ["Our mission", "Help teams make documented business decisions with clear identity, sources, evidence, and limitations."],
    ["The platform", "One workspace connects intake, identity resolution, source collection, analysis, monitoring, and the Executive Report."],
    ["Who it serves", "ShadowScore supports analysts, risk teams, and decision-makers reviewing companies, suppliers, and partners."],
    ["Accountability", "Every report separates observed facts, assessment, evidence gaps, and recommended controls. Sources and scope remain available for review."],
  ];

  return (
    <ShadowScoreLayout>
      <main className="mx-auto max-w-6xl px-6 py-20">
       <section className="max-w-4xl">
        <div className="text-sm uppercase tracking-[0.28em] text-red-300">{page.eyebrow}</div>
        <h1 className="mt-4 text-5xl font-black">{page.title}</h1>
        <p className="mt-6 text-lg leading-8 text-zinc-400">{locale === "he" ? "ShadowScore היא פלטפורמת מודיעין עסקי מבוסס ראיות. היא הופכת זהות עסקית, מקורות זמינים וראיות שנמסרו לתהליך בדיקה עקבי ולדוח מנהלים." : "ShadowScore is an evidence-based business intelligence platform. It turns business identity, available sources, and submitted evidence into a consistent investigation workflow and Executive Report."}</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/intake" className="ss-button ss-button-primary">{locale === "he" ? "התחלת בדיקה" : "Start an investigation"}</Link><Link href="/sample-report" className="ss-button ss-button-secondary">{locale === "he" ? "הצגת דוח לדוגמה" : "View a sample report"}</Link></div>
       </section>
       <div className="mt-12 grid gap-5 md:grid-cols-2">{cards.map(([heading, body], index) => <section key={heading} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7"><div className="text-xs font-black tracking-[.18em] text-red-300">0{index + 1}</div><h2 className="mt-4 text-2xl font-black">{heading}</h2><p className="mt-4 leading-7 text-zinc-400">{body}</p></section>)}</div>
       <section className="mt-12 rounded-3xl border border-sky-300/20 bg-sky-400/10 p-7 sm:flex sm:items-center sm:justify-between sm:gap-8"><div><h2 className="text-2xl font-black">{locale === "he" ? "יש לכם שאלת מוצר או בדיקה?" : "Have a product or investigation question?"}</h2><p className="mt-3 max-w-2xl leading-7 text-zinc-300">{locale === "he" ? "צוות ShadowScore מנתב שאלות על בדיקות, אבטחה, פרטיות וחשבונות." : "The ShadowScore team routes questions about investigations, security, privacy, and accounts."}</p></div><Link href="/contact" className="ss-button ss-button-secondary mt-6 shrink-0 sm:mt-0">{locale === "he" ? "יצירת קשר" : "Contact us"}</Link></section>
      </main>
    </ShadowScoreLayout>
  );
}
