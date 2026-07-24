import Link from "next/link";
import { MarketingCta } from "./MarketingAnalytics";

export default function MarketingHome() {
  return (
    <div className="bg-[#07111f] text-slate-100">
      <main>
        <section className="bg-[radial-gradient(circle_at_78%_10%,rgba(14,165,233,.22),transparent_30%),#07111f] px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[.24em] text-sky-300">
              Investigation workspace
            </p>
            <h1 className="mt-6 max-w-5xl text-5xl font-black tracking-tight sm:text-7xl">
              Organize business due diligence cases.
            </h1>
            <p className="mt-7 max-w-3xl text-xl leading-8 text-slate-300">
              Start a case, keep active investigations in one workspace, and review the next action for each case.
            </p>
            <div className="mt-10 flex flex-wrap gap-4" aria-label="Start a case or view a sample">
              <MarketingCta
                event="hero_cta_clicked"
                className="rounded-full bg-sky-400 px-7 py-4 font-bold text-slate-950 hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Start a case
              </MarketingCta>
              <Link
                href="/sample-report"
                className="rounded-full border border-white/20 px-7 py-4 font-bold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                View illustrative sample
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-950 px-6 py-20" aria-labelledby="workflow-heading">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">Workflow</p>
            <h2 id="workflow-heading" className="mt-4 text-3xl font-bold">
              Keep each investigation ready for review.
            </h2>
            <ol className="mt-8 grid gap-5 md:grid-cols-4">
              <li>
                <h3 className="text-2xl font-bold">Start a case</h3>
                <p className="mt-3 leading-7 text-slate-300">Enter the business or organization you want to review.</p>
              </li>
              <li>
                <h3 className="text-2xl font-bold">Review the case</h3>
                <p className="mt-3 leading-7 text-slate-300">View active cases and their next actions in one workspace.</p>
              </li>
              <li>
                <h3 className="text-2xl font-bold">Record progress</h3>
                <p className="mt-3 leading-7 text-slate-300">Keep investigation notes and progress organized as information is gathered.</p>
              </li>
              <li>
                <h3 className="text-2xl font-bold">Make your decision</h3>
                <p className="mt-3 leading-7 text-slate-300">Use the case record to support your analyst review.</p>
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
              The sample report demonstrates a possible review format. It is not a live investigation or a description of workspace output.
            </p>
            <Link href="/sample-report" className="mt-7 inline-flex rounded-full border border-white/20 px-5 py-3 font-bold hover:bg-white/10">
              View illustrative sample
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-8 text-sm text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span>ShadowScore</span>
          <Link href="/methodology" className="font-semibold text-slate-200 hover:text-white">
            Methodology
          </Link>
        </div>
      </footer>
    </div>
  );
}
