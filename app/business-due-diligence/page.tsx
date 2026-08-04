import type { Metadata } from "next";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export const metadata: Metadata = {
  title: "Business Investigation Platform | ShadowScore",
  description: "See how ShadowScore turns a business identity, available sources, and submitted evidence into a reviewable Executive Report.",
  alternates: { canonical: "/business-due-diligence" },
};

const workflow = [
  ["01", "Define the decision", "Identify the business, the planned transaction, and the questions that matter before the review begins."],
  ["02", "Resolve the identity", "Compare submitted details with available registry, domain, and business-information sources."],
  ["03", "Review the evidence", "Connect supporting records, contradictions, and missing evidence without hiding uncertainty."],
  ["04", "Act on the result", "Receive an Executive Report with a conclusion, source trail, and prioritized controls."],
] as const;

const reportContents = [
  "Executive conclusion and decision context",
  "Business identity and source coverage",
  "Material findings and evidence gaps",
  "Confidence and limitations",
  "Prioritized actions and source references",
] as const;

export default function PlatformPage() {
  return (
    <ShadowScoreLayout>
      <main className="bg-[#070b12] text-slate-100">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_78%_12%,rgba(56,189,248,.15),transparent_30%),radial-gradient(circle_at_18%_42%,rgba(220,38,38,.1),transparent_26%)] px-5 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">Business investigation platform</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-.04em] text-white sm:text-6xl">Turn business evidence into a decision you can explain.</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">ShadowScore organizes business identity, available source records, and submitted evidence into one reviewable Executive Report.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/intake" className="ss-button ss-button-primary justify-center">Start an investigation</Link>
                <Link href="/sample-report" className="ss-button justify-center border border-white/15 text-white hover:bg-white/[.06]">View a sample report</Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400" aria-label="Platform summary">
                <li><span className="mr-2 text-emerald-300" aria-hidden="true">✓</span>Review scope before payment</li>
                <li><span className="mr-2 text-emerald-300" aria-hidden="true">✓</span>Evidence stays traceable</li>
                <li><span className="mr-2 text-emerald-300" aria-hidden="true">✓</span>Limitations stay visible</li>
              </ul>
            </div>
            <aside className="rounded-3xl border border-white/10 bg-[#0d1420]/95 p-6 shadow-2xl shadow-black/30" aria-label="Investigation output preview">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">Executive Report</p><p className="mt-2 font-bold text-white">Decision record</p></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">Reviewable</span></div>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-500">Identity</dt><dd className="mt-1 font-bold">Resolved</dd></div><div><dt className="text-slate-500">Evidence</dt><dd className="mt-1 font-bold">Source linked</dd></div><div><dt className="text-slate-500">Confidence</dt><dd className="mt-1 font-bold">Explained</dd></div><div><dt className="text-slate-500">Next action</dt><dd className="mt-1 font-bold">Prioritized</dd></div></dl>
              <div className="mt-6 rounded-2xl border border-sky-300/15 bg-sky-300/[.05] p-4"><p className="text-xs font-bold text-sky-200">A useful result answers three questions</p><p className="mt-2 text-sm leading-6 text-slate-300">What the evidence supports, what remains unresolved, and what to do next.</p></div>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-24" aria-labelledby="workflow-title">
          <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">One connected workflow</p><h2 id="workflow-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">From a business question to a documented decision.</h2><p className="mt-5 text-lg leading-8 text-slate-400">Each stage preserves the context needed by the next. The workspace keeps the investigation and its report connected.</p></div>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{workflow.map(([number, title, body]) => <li key={number} className="rounded-2xl border border-white/10 bg-white/[.025] p-6"><span className="font-mono text-sm font-bold text-sky-300">{number}</span><h3 className="mt-8 text-xl font-bold text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{body}</p></li>)}</ol>
        </section>

        <section className="border-y border-white/10 bg-[#0b111b] px-5 py-16 sm:px-6 sm:py-24" aria-labelledby="deliverable-title">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div><p className="text-xs font-bold uppercase tracking-[.22em] text-red-300">The deliverable</p><h2 id="deliverable-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Know exactly what you receive.</h2><p className="mt-5 text-lg leading-8 text-slate-400">The Executive Report is a controlled decision artifact. It separates findings from confidence, limitations, and recommended action.</p><Link href="/pricing" className="mt-7 inline-flex font-bold text-sky-200 hover:text-white">Review pricing and purchase terms <span className="ml-2" aria-hidden="true">→</span></Link></div>
            <div className="rounded-3xl border border-white/10 bg-[#101925] p-6 sm:p-8"><h3 className="text-xl font-bold text-white">Every investigation report includes</h3><ul className="mt-6 grid gap-3 sm:grid-cols-2">{reportContents.map((item) => <li key={item} className="flex gap-3 rounded-xl border border-white/[.07] bg-black/10 p-4 text-sm leading-6 text-slate-300"><span className="text-emerald-300" aria-hidden="true">✓</span>{item}</li>)}</ul><p className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-slate-500">Coverage depends on the business, jurisdiction, submitted scope, and source availability. Missing information is recorded as a limitation.</p></div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-6 sm:py-24"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 rounded-3xl border border-sky-300/15 bg-[linear-gradient(120deg,rgba(56,189,248,.1),rgba(255,255,255,.02))] p-7 sm:p-10 lg:flex-row lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">Review the product</p><h2 className="mt-3 text-3xl font-black text-white">See the report before you start.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-300">Use the sample to inspect the decision structure, evidence detail, and limitations.</p></div><div className="flex flex-col gap-3 sm:flex-row"><Link href="/sample-report" className="ss-button ss-button-primary justify-center">Open sample report</Link><Link href="/methodology" className="ss-button justify-center border border-white/15 text-white hover:bg-white/[.06]">Review methodology</Link></div></div></section>
      </main>
    </ShadowScoreLayout>
  );
}
