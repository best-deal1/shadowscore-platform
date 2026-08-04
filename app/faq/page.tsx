import type { Metadata } from "next";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export const metadata: Metadata = {
  title: "Frequently asked questions | ShadowScore",
  description: "Answers about ShadowScore investigations, evidence, reports, pricing, accounts, and data handling.",
  alternates: { canonical: "/faq" },
};

const groups = [
  {
    title: "Investigations and reports",
    questions: [
      ["What does ShadowScore investigate?", "ShadowScore reviews a submitted Business identity using available public sources, operational signals, and customer-provided evidence. The result is an Executive Report with findings, evidence gaps, limitations, and recommended actions."],
      ["Is the sample report live customer data?", "No. The sample uses fixed demonstration data. Its structure represents the current report experience without exposing customer information or implying a live finding."],
      ["How should I use a ShadowScore conclusion?", "Use it as documented decision support. Review the sources, confidence, missing evidence, and recommended controls before making a commercial or compliance decision."],
    ],
  },
  {
    title: "Evidence and methodology",
    questions: [
      ["Where does the evidence come from?", "Evidence can include public records, visible website and operational signals, and material submitted for the investigation. Each report records source context and distinguishes evidence from assessment."],
      ["What happens when information is missing or contradictory?", "The report records the gap or contradiction and reflects it in confidence and next actions. Missing information is not treated as confirmed misconduct."],
      ["Does ShadowScore guarantee an outcome?", "ShadowScore provides risk intelligence and decision support. Outcomes can depend on third parties, source availability, later events, and the controls chosen by the customer."],
    ],
  },
  {
    title: "Pricing, access, and support",
    questions: [
      ["How much does an investigation cost?", "The current beta Business Investigation is a one-time purchase of $9.90 USD. The scope and total are shown before checkout. Team plans are still in development."],
      ["Where can I find a purchased report?", "Sign in and open Reports from the workspace. Report access depends on completed payment and report readiness."],
      ["How is investigation data handled?", "Private workspace records are scoped to the customer organization. The Security and Privacy pages describe current data handling, access, and contact routes."],
    ],
  },
] as const;

export default function FaqPage() {
  return <ShadowScoreLayout><main className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
    <header className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.24em] text-red-300">Product help</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Frequently asked questions</h1><p className="mt-6 text-lg leading-8 text-zinc-400">Current answers about the investigation workflow, evidence, reports, purchase, and account access.</p></header>
    <div className="mt-12 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label="FAQ categories" className="self-start rounded-2xl border border-white/10 bg-white/[.03] p-5 lg:sticky lg:top-28"><p className="text-xs font-black uppercase tracking-[.2em] text-zinc-500">On this page</p><ul className="mt-4 space-y-3 text-sm font-bold">{groups.map((group, index) => <li key={group.title}><a className="text-zinc-300 hover:text-white" href={`#faq-${index + 1}`}>{group.title}</a></li>)}</ul></nav>
      <div className="space-y-12">{groups.map((group, index) => <section id={`faq-${index + 1}`} className="scroll-mt-28" key={group.title}><h2 className="text-2xl font-black">{group.title}</h2><div className="mt-5 divide-y divide-white/10 border-y border-white/10">{group.questions.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 font-bold text-white"><span>{question}</span><span aria-hidden="true" className="text-xl text-red-300 group-open:rotate-45">+</span></summary><p className="max-w-3xl pb-2 pr-10 leading-7 text-zinc-400">{answer}</p></details>)}</div></section>)}</div>
    </div>
    <section className="mt-16 rounded-3xl border border-sky-300/20 bg-sky-400/10 p-7 sm:flex sm:items-center sm:justify-between sm:gap-8"><div><h2 className="text-2xl font-black">Need an answer for your situation?</h2><p className="mt-2 text-zinc-300">Route a question to sales, support, security, or privacy.</p></div><div className="mt-6 flex flex-wrap gap-3 sm:mt-0"><Link href="/contact" className="ss-button ss-button-primary">Contact ShadowScore</Link><Link href="/intake" className="ss-button ss-button-secondary">Start an investigation</Link></div></section>
  </main></ShadowScoreLayout>;
}
