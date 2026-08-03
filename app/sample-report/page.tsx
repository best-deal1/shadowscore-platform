import type { Metadata } from "next";
import Link from "next/link";
import { WebsiteIntelligenceReportView } from "../components/WebsiteIntelligenceReport";
import { WebsiteIntelligenceDashboard } from "../components/WebsiteIntelligenceDashboard";
import { JsonLd } from "../components/MarketingPage";
import { pageMetadata } from "../lib/seo";
import { sampleWebsiteIntelligenceReport } from "../../lib/websiteIntelligence/sampleReport";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export const metadata: Metadata = pageMetadata({
  title: "Sample Executive Report | ShadowScore",
  description: "Review an illustrative ShadowScore decision record with an executive conclusion, findings, source evidence, recommended controls, coverage, and limitations.",
  path: "/sample-report",
});

const reportSections = [
  ["decision-brief", "Decision brief"],
  ["report-dashboard", "Report dashboard"],
  ["evidence-detail", "Evidence detail"],
  ["report-value", "What you receive"],
] as const;

export default function SampleReport() {
  return (
    <ShadowScoreLayout>
      <main className="min-h-screen bg-[#07111f] text-slate-100">
        <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: "Illustrative ShadowScore Executive Report" }} />

        <header className="border-b border-white/10 bg-[radial-gradient(circle_at_80%_15%,rgba(14,165,233,.18),transparent_32%),#07111f] px-5 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_20rem] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">Illustrative Executive Report</p>
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200">Demonstration data</span>
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-.035em] sm:text-6xl">See the decision record before you buy.</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">This sample shows how ShadowScore turns collected evidence into a documented conclusion, practical controls, and a source trail that another reviewer can inspect.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5 text-sm">
              <p className="font-bold text-white">Sample scope</p>
              <p className="mt-2 leading-6 text-slate-400">Website intelligence for example.com. Findings are illustrative and use fixed demonstration data rather than a live investigation.</p>
            </div>
          </div>
        </header>

        <nav aria-label="Report sections" className="sticky top-0 z-20 border-b border-white/10 bg-[#07111f]/95 px-5 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto py-4 text-sm font-bold text-slate-300">
            {reportSections.map(([id, label]) => <a key={id} href={`#${id}`} className="shrink-0 hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">{label}</a>)}
          </div>
        </nav>

        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
          <section id="decision-brief" aria-labelledby="decision-brief-heading" className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1727] shadow-2xl shadow-black/20">
            <div className="grid lg:grid-cols-[1fr_21rem]">
              <div className="p-6 sm:p-9">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">Decision brief</p>
                <h2 id="decision-brief-heading" className="mt-4 text-3xl font-black sm:text-4xl">Proceed after one website control is reviewed.</h2>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">The website responded over HTTPS. One recommended browser security header was not published, and reputation evidence was unavailable. Ask the website team to review the header and complete the missing reputation check before relying on the website assessment.</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-slate-400">Evidence coverage</p><p className="mt-2 text-2xl font-black">67%</p><p className="mt-1 text-xs text-slate-500">2 of 3 modules</p></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-slate-400">Recorded findings</p><p className="mt-2 text-2xl font-black">2</p><p className="mt-1 text-xs text-slate-500">Low and informational</p></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-slate-400">Required controls</p><p className="mt-2 text-2xl font-black">1</p><p className="mt-1 text-xs text-slate-500">Before reliance</p></div>
                </div>
              </div>
              <aside aria-label="Decision record details" className="border-t border-white/10 bg-slate-950/60 p-6 sm:p-8 lg:border-l lg:border-t-0">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">Report identity</p>
                <dl className="mt-6 space-y-5 text-sm">
                  <div><dt className="text-slate-500">Subject</dt><dd className="mt-1 font-bold text-white">example.com</dd></div>
                  <div><dt className="text-slate-500">Review type</dt><dd className="mt-1 font-bold text-white">Website intelligence</dd></div>
                  <div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-bold text-amber-200">Partial evidence</dd></div>
                  <div><dt className="text-slate-500">Evidence observed</dt><dd className="mt-1 font-bold text-white">July 25, 2026</dd></div>
                  <div><dt className="text-slate-500">Report contract</dt><dd className="mt-1 font-bold text-white">website-intelligence-report-v1</dd></div>
                </dl>
              </aside>
            </div>
          </section>

          <section aria-labelledby="evidence-chain-heading" className="py-14">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Why this is more useful than search</p>
              <h2 id="evidence-chain-heading" className="mt-4 text-3xl font-black">A reviewable chain from source to action.</h2>
              <p className="mt-4 leading-7 text-slate-300">Search results provide pages to interpret. ShadowScore organizes supported checks into one record. Each conclusion keeps its source, observation time, confidence, business impact, and evidence limits together.</p>
            </div>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              <li className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><span className="text-xs font-bold text-sky-300">01 · OBSERVATION</span><h3 className="mt-3 text-lg font-bold">HTTPS response headers</h3><p className="mt-2 text-sm leading-6 text-slate-400">The content security policy header was not published when the sample evidence was recorded.</p></li>
              <li className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><span className="text-xs font-bold text-sky-300">02 · FINDING</span><h3 className="mt-3 text-lg font-bold">Browser protection gap</h3><p className="mt-2 text-sm leading-6 text-slate-400">The missing header can make browser protections less consistent for visitors.</p></li>
              <li className="rounded-2xl border border-amber-300/20 bg-amber-300/[.06] p-6"><span className="text-xs font-bold text-amber-200">03 · CONTROL</span><h3 className="mt-3 text-lg font-bold">Request a technical review</h3><p className="mt-2 text-sm leading-6 text-slate-300">Ask the website team to assess and configure the header before relying on the website review.</p></li>
            </ol>
          </section>

          <article id="report-dashboard" aria-label="Illustrative report dashboard" className="scroll-mt-24 rounded-[2rem] border border-white/10 bg-white/[.03] p-6 sm:p-10">
            <WebsiteIntelligenceDashboard report={sampleWebsiteIntelligenceReport} />
          </article>

          <article id="evidence-detail" aria-label="Illustrative evidence detail" className="mt-8 scroll-mt-24 rounded-[2rem] border border-white/10 bg-white/[.03] p-6 sm:p-10">
            <WebsiteIntelligenceReportView report={sampleWebsiteIntelligenceReport} />
          </article>

          <section id="report-value" aria-labelledby="report-value-heading" className="scroll-mt-24 py-14 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">What the $9.90 report provides</p>
                <h2 id="report-value-heading" className="mt-4 text-3xl font-black">A consistent record for the decision you need to make.</h2>
                <p className="mt-5 leading-7 text-slate-300">Use the free preview to check the subject and available coverage. Purchase one Executive Report for $9.90 when you need the findings, supporting evidence, limitations, and controls saved together in your private workspace.</p>
                <p className="mt-4 text-sm leading-6 text-slate-400">Use ShadowScore as business-review support alongside appropriate legal, financial, and security advice.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#0b1727] p-6 sm:p-8">
                <h3 className="text-lg font-bold">Included in the decision record</h3>
                <ul className="mt-5 space-y-4 text-sm text-slate-300">
                  <li className="flex gap-3"><span aria-hidden="true" className="text-emerald-300">✓</span><span>Executive conclusion and evidence coverage</span></li>
                  <li className="flex gap-3"><span aria-hidden="true" className="text-emerald-300">✓</span><span>Material findings with business impact</span></li>
                  <li className="flex gap-3"><span aria-hidden="true" className="text-emerald-300">✓</span><span>Source observations and collection dates</span></li>
                  <li className="flex gap-3"><span aria-hidden="true" className="text-emerald-300">✓</span><span>Recommended controls and visible evidence gaps</span></li>
                  <li className="flex gap-3"><span aria-hidden="true" className="text-emerald-300">✓</span><span>A saved report in your private workspace</span></li>
                </ul>
              </div>
            </div>
          </section>

          <section aria-labelledby="sample-cta-heading" className="rounded-[2rem] border border-sky-300/20 bg-sky-300/[.08] p-7 text-center sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-200">Your next decision</p>
            <h2 id="sample-cta-heading" className="mt-4 text-3xl font-black">Check a company before you commit.</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">Start with a free preview. Review the subject and available coverage before choosing the $9.90 Executive Report.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/intake" className="rounded-full bg-sky-400 px-7 py-4 font-bold text-slate-950 hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Start free preview</Link>
              <Link href="/methodology" className="rounded-full border border-white/20 px-7 py-4 font-bold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Review methodology</Link>
            </div>
          </section>
        </div>
      </main>
    </ShadowScoreLayout>
  );
}
