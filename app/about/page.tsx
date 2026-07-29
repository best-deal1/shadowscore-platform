"use client";

import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { useLocale } from "../../components/LocaleProvider";
import { publicPages } from "../../lib/i18n";

export default function AboutPage() {
  const { locale } = useLocale();
  const page = publicPages[locale].about;
  const cards = locale === "he" ? [
    ["מי זו ShadowScore", "ShadowScore היא פלטפורמה עצמאית למודיעין סיכונים עסקיים מבוסס ראיות."],
    ["למי היא מיועדת", "הפלטפורמה מיועדת למוכרים דיגיטליים, צוותי סיכונים ומקבלי החלטות שבודקים עסקים ושותפים."],
    ["מה היא עושה", "ShadowScore מארגנת רשומות ציבוריות, אותות תפעוליים וראיות שנמסרו לכדי הערכה והצעדים הבאים."],
    ["היקף הפעילות", "ShadowScore מספקת תמיכה בהחלטות. היא אינה זירת מסחר, ספק תשלום, משרד עורכי דין או רשות רגולטורית."],
  ] : [
    ["Who we are", "ShadowScore is an independent platform for evidence-based business risk intelligence."],
    ["Who it is for", "The platform serves digital sellers, risk teams, and decision-makers who review businesses and partners."],
    ["What we do", "ShadowScore organizes public records, visible operational signals, and submitted evidence into an assessment and next steps."],
    ["Our scope", "ShadowScore provides decision support. It is not a marketplace, payment provider, law firm, or regulator."],
  ];

  return (
    <ShadowScoreLayout>
      <main className="mx-auto max-w-6xl px-6 py-20">
       <section className="max-w-4xl">
        <div className="text-sm uppercase tracking-[0.28em] text-red-300">{page.eyebrow}</div>
        <h1 className="mt-4 text-5xl font-black">{page.title}</h1>
        <p className="mt-6 text-lg leading-8 text-zinc-400">
          {page.description}
        </p>
       </section>
       <div className="mt-12 grid gap-5 md:grid-cols-2">{cards.map(([heading, body], index) => <section key={heading} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7"><div className="text-xs font-black tracking-[.18em] text-red-300">0{index + 1}</div><h2 className="mt-4 text-2xl font-black">{heading}</h2><p className="mt-4 leading-7 text-zinc-400">{body}</p></section>)}</div>
      </main>
    </ShadowScoreLayout>
  );
}
