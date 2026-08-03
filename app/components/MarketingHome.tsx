import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";
import { MarketingCta } from "./MarketingAnalytics";

export default function MarketingHome() {
  return (
    <ShadowScoreLayout>
    <div className="bg-[#07111f] text-slate-100">
      <main>
        <section className="bg-[radial-gradient(circle_at_78%_10%,rgba(14,165,233,.22),transparent_30%),#07111f] px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[.24em] text-sky-300">
              Business Due Diligence &amp; Company Verification
            </p>
            <p className="mt-6 text-lg font-bold tracking-wide text-sky-100">
              Know Before You Trust™
            </p>
            <h1 className="mt-3 max-w-5xl text-5xl font-black tracking-tight sm:text-7xl">
              Make better business decisions with evidence.
            </h1>
            <p className="mt-7 max-w-3xl text-xl leading-8 text-slate-300">
              Verify companies, suppliers, partners, marketplaces, and investment opportunities using source-backed business identity, risk, relationship, and evidence intelligence.
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
              <li>Executive Report: $9.90</li>
              <li>Reports saved to your workspace</li>
            </ul>
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-950 px-6 py-20" aria-labelledby="workflow-heading">
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
