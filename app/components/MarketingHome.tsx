import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";
import { MarketingCta } from "./MarketingAnalytics";

export default function MarketingHome() {
  return (
    <ShadowScoreLayout>
      <div className="bg-[#07111f] text-slate-100">
        <main>
        <section className="overflow-hidden bg-[radial-gradient(circle_at_78%_10%,rgba(14,165,233,.22),transparent_30%),#07111f] px-6 py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.24em] text-sky-300">
                Business due diligence for consequential decisions
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.02] tracking-[-.045em] sm:text-7xl">
                Know who is behind the business before you commit.
              </h1>
              <p className="mt-7 max-w-2xl text-xl leading-8 text-slate-300">
                Turn a company name or website into a source-backed decision record. See identity matches, material risks, evidence gaps, and the next controls to apply before you pay, onboard, partner, or invest.
              </p>
              <div className="mt-10 flex flex-wrap gap-4" aria-label="Start a due diligence review or view a sample">
                <MarketingCta
                  event="hero_cta_clicked"
                  className="rounded-full bg-sky-400 px-7 py-4 font-bold text-slate-950 hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Start free preview
                </MarketingCta>
                <Link
                  href="/sample-report"
                  className="rounded-full border border-white/20 px-7 py-4 font-bold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  View illustrative sample
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-full px-7 py-4 font-bold text-sky-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  See pricing
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300" aria-label="Purchase information">
                <li>Free preview before payment</li>
                <li>One Executive Report: $9.90</li>
                <li>Saved to your private workspace</li>
              </ul>
            </div>

            <aside className="relative" aria-labelledby="decision-preview-title">
              <div aria-hidden="true" className="absolute -inset-8 rounded-full bg-sky-400/10 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/15 bg-slate-950/90 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:p-7">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.2em] text-slate-400">Illustrative decision preview</p>
                    <h2 id="decision-preview-title" className="mt-2 text-xl font-bold text-white">Northstar Components Ltd.</h2>
                    <p className="mt-1 text-sm text-slate-400">Supplier onboarding review</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-200">Review controls</span>
                </div>
                <div className="grid grid-cols-3 gap-3 py-5 text-center">
                  <div className="rounded-2xl bg-white/[.04] p-3"><strong className="block text-lg text-white">4</strong><span className="text-xs text-slate-400">Sources</span></div>
                  <div className="rounded-2xl bg-white/[.04] p-3"><strong className="block text-lg text-white">2</strong><span className="text-xs text-slate-400">Findings</span></div>
                  <div className="rounded-2xl bg-white/[.04] p-3"><strong className="block text-lg text-white">1</strong><span className="text-xs text-slate-400">Open gap</span></div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.06] p-4">
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-200">Identity match</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">Submitted company details align across the illustrative registry and domain records.</p>
                  </div>
                  <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-4">
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-amber-200">Control before payment</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">Verify beneficiary account ownership because the available evidence does not resolve it.</p>
                  </div>
                </div>
                <p className="mt-5 text-xs leading-5 text-slate-500">Sample data for format demonstration. Findings are not from a live investigation.</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0a1626] px-6 py-10" aria-label="What the investigation delivers">
          <dl className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
            <div><dt className="text-sm font-bold text-sky-200">Input</dt><dd className="mt-2 leading-7 text-slate-300">A company name, website, or supplier identity.</dd></div>
            <div><dt className="text-sm font-bold text-sky-200">Analysis</dt><dd className="mt-2 leading-7 text-slate-300">Source comparisons, findings, confidence, and visible evidence gaps.</dd></div>
            <div><dt className="text-sm font-bold text-sky-200">Decision record</dt><dd className="mt-2 leading-7 text-slate-300">An Executive Report with traceable evidence and recommended controls.</dd></div>
          </dl>
        </section>

        <section className="bg-slate-950 px-6 py-20" aria-labelledby="workflow-heading">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">Workflow</p>
            <h2 id="workflow-heading" className="mt-4 text-3xl font-bold">
              Follow a clear evidence-to-decision workflow.
            </h2>
            <ol className="mt-8 grid gap-5 md:grid-cols-5">
              <li>
                <h3 className="text-2xl font-bold">Case</h3>
                <p className="mt-3 leading-7 text-slate-300">Open a business due diligence review for the company or counterparty.</p>
              </li>
              <li>
                <h3 className="text-2xl font-bold">Evidence</h3>
                <p className="mt-3 leading-7 text-slate-300">Review source-backed business identity, relationship, and risk evidence.</p>
              </li>
              <li>
                <h3 className="text-2xl font-bold">Findings</h3>
                <p className="mt-3 leading-7 text-slate-300">Document material findings and the evidence that supports them.</p>
              </li>
              <li>
                <h3 className="text-2xl font-bold">Decision</h3>
                <p className="mt-3 leading-7 text-slate-300">Record a decision supported by the case evidence and findings.</p>
              </li>
              <li>
                <h3 className="text-2xl font-bold">Report</h3>
                <p className="mt-3 leading-7 text-slate-300">Prepare a report for business stakeholders.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20" aria-labelledby="sample-report-heading">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-amber-300">Illustrative sample</p>
            <h2 id="sample-report-heading" className="mt-4 text-3xl font-bold">
              See an example report format.
            </h2>
            <p className="mt-4 leading-7 text-slate-300">
              The sample report demonstrates a possible review format. It does not represent a live investigation or actual ShadowScore report output.
            </p>
            <Link href="/sample-report" className="mt-7 inline-flex rounded-full border border-white/20 px-5 py-3 font-bold hover:bg-white/10">
              View illustrative sample
            </Link>
          </div>
        </section>
        </main>
      </div>
    </ShadowScoreLayout>
  );
}
