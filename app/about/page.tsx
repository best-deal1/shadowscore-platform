import type { Metadata } from "next";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export const metadata: Metadata = {
  title: "About ShadowScore | Business Risk Intelligence",
  description: "Learn why ShadowScore builds source-backed business investigations and how the platform keeps evidence, uncertainty, and accountability visible.",
  alternates: { canonical: "/about" },
};

const principles = [
  ["Evidence before assertion", "Material findings stay connected to their sources. A reviewer can inspect what supports the conclusion."],
  ["Uncertainty stays visible", "Confidence, missing evidence, and limitations are presented alongside risk findings."],
  ["Action follows analysis", "Reports translate the review into practical controls and prioritized next steps."],
] as const;

export default function AboutPage() {
  return (
    <ShadowScoreLayout>
      <main className="bg-[#070b12] text-slate-100">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_75%_20%,rgba(220,38,38,.13),transparent_30%),radial-gradient(circle_at_20%_20%,rgba(56,189,248,.1),transparent_25%)] px-5 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[.22em] text-red-300">About ShadowScore</p><h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-.04em] text-white sm:text-6xl">Business decisions deserve a clear evidence record.</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">ShadowScore is an independent business risk intelligence platform. It helps buyers, operators, and risk teams review a business before payment, onboarding, partnership, or investment.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/business-due-diligence" className="ss-button ss-button-primary justify-center">Explore the platform</Link><Link href="/contact" className="ss-button justify-center border border-white/15 text-white hover:bg-white/[.06]">Contact ShadowScore</Link></div></div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-[.8fr_1.2fr]" aria-labelledby="purpose-title">
          <div><p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">Our purpose</p><h2 id="purpose-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Make due diligence easier to review and act on.</h2></div>
          <div className="space-y-6 text-lg leading-8 text-slate-300"><p>Business information often sits across registry records, websites, documents, and operational signals. ShadowScore brings the available evidence into one investigation record.</p><p>The platform distinguishes what sources support, what remains unresolved, and which control should come next. This gives another reviewer a clear path through the decision.</p></div>
        </section>

        <section className="border-y border-white/10 bg-[#0b111b] px-5 py-16 sm:px-6 sm:py-24" aria-labelledby="principles-title"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.22em] text-red-300">How we work</p><h2 id="principles-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">A consistent standard for every review.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{principles.map(([title, body], index) => <article key={title} className="rounded-2xl border border-white/10 bg-white/[.025] p-6 sm:p-7"><span className="font-mono text-sm font-bold text-sky-300">0{index + 1}</span><h3 className="mt-8 text-xl font-bold text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{body}</p></article>)}</div></div></section>

        <section className="mx-auto grid max-w-7xl gap-6 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-2"><article className="rounded-3xl border border-white/10 bg-[#0d1420] p-7 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Who we serve</p><h2 className="mt-4 text-2xl font-bold text-white">Teams responsible for a business decision.</h2><p className="mt-4 leading-7 text-slate-400">ShadowScore supports buyers, digital sellers, procurement teams, risk professionals, and decision-makers reviewing a company, supplier, partner, seller, website, or investment opportunity.</p></article><article className="rounded-3xl border border-white/10 bg-[#0d1420] p-7 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.2em] text-red-300">Our role</p><h2 className="mt-4 text-2xl font-bold text-white">Independent decision support.</h2><p className="mt-4 leading-7 text-slate-400">ShadowScore organizes available information and documents its limits. It does not provide legal advice or guarantee payment recovery, investment performance, account approval, or third-party outcomes.</p></article></section>

        <section className="px-5 pb-16 sm:px-6 sm:pb-24"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 rounded-3xl border border-sky-300/15 bg-[linear-gradient(120deg,rgba(56,189,248,.1),rgba(255,255,255,.02))] p-7 sm:p-10 lg:flex-row lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">Evaluate ShadowScore</p><h2 className="mt-3 text-3xl font-black text-white">Inspect a representative decision record.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-300">The sample report shows the structure, evidence trail, confidence, and limitations before purchase.</p></div><Link href="/sample-report" className="ss-button ss-button-primary shrink-0 justify-center">View sample report</Link></div></section>
      </main>
    </ShadowScoreLayout>
  );
}
