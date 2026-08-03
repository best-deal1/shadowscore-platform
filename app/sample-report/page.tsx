import type { Metadata } from "next";
import Link from "next/link";
import { WebsiteIntelligenceReportView } from "../components/WebsiteIntelligenceReport";
import { WebsiteIntelligenceDashboard } from "../components/WebsiteIntelligenceDashboard";
import { JsonLd } from "../components/MarketingPage";
import { pageMetadata } from "../lib/seo";
import { sampleWebsiteIntelligenceReport } from "../../lib/websiteIntelligence/sampleReport";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export const metadata: Metadata = pageMetadata({
  title: "Sample Business Investigation Report | ShadowScore",
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
      <main className="sample-report min-h-screen bg-[#07111f] text-slate-100">
        <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: "Illustrative ShadowScore Business Investigation report" }} />

        <header className="border-b border-white/10 bg-[radial-gradient(circle_at_80%_15%,rgba(14,165,233,.18),transparent_32%),#07111f] px-5 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_20rem] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-[.22em] text-red-300">Business Investigation report</p>
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200">Demonstration data</span>
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-.035em] sm:text-6xl">See the decision record before you buy.</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">This sample shows how ShadowScore turns collected evidence into a documented conclusion, practical controls, and a source trail that another reviewer can inspect.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5 text-sm">
              <p className="font-bold text-white">Investigation scope</p>
              <p className="mt-2 leading-6 text-slate-400">Website Intelligence checks for example.com within one Business Investigation. Findings use fixed demonstration data rather than a live investigation.</p>
            </div>
          </div>
        </header>

        <nav aria-label="Report sections" className="sticky top-0 z-20 border-b border-white/10 bg-[#07111f]/95 px-5 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto py-4 text-sm font-bold text-slate-300">
            {reportSections.map(([id, label]) => <a key={id} href={`#${id}`} className="shrink-0 hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-300">{label}</a>)}
          </div>
        </nav>

        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
          <section id="decision-brief" aria-labelledby="decision-brief-heading" className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1727] shadow-2xl shadow-black/20">
            <div className="grid lg:grid-cols-[1fr_21rem]">
              <div className="p-6 sm:p-9">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">Recommended decision</p>
                <h2 id="decision-brief-heading" className="mt-4 text-3xl font-black sm:text-4xl">Proceed after one website control is reviewed.</h2>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">The website responded over HTTPS. One recommended browser security header was not published, and reputation evidence was unavailable. Ask the website team to review the header and complete the missing reputation check before relying on the website assessment.</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-slate-400">Evidence coverage</p><p className="mt-2 text-2xl font-black">67%</p><p className="mt-1 text-xs text-slate-500">2 of 3 modules</p></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-slate-400">Risk level</p><p className="mt-2 text-2xl font-black">Low</p><p className="mt-1 text-xs text-slate-500">One control before reliance</p></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-slate-400">Decision confidence</p><p className="mt-2 text-2xl font-black">Moderate</p><p className="mt-1 text-xs text-slate-500">Partial source coverage</p></div>
                </div>
              </div>
              <aside aria-label="Decision record details" className="border-t border-white/10 bg-slate-950/60 p-6 sm:p-8 lg:border-l lg:border-t-0">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">Report identity</p>
                <dl className="mt-6 space-y-5 text-sm">
                  <div><dt className="text-slate-500">Subject</dt><dd className="mt-1 font-bold text-white">example.com</dd></div>
                  <div><dt className="text-slate-500">Report reference</dt><dd className="mt-1 font-mono font-bold text-white">SS-SAMPLE-2026-001</dd></div>
                  <div><dt className="text-slate-500">Investigation scope</dt><dd className="mt-1 font-bold text-white">Website Intelligence</dd></div>
                  <div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-bold text-amber-200">Partial evidence</dd></div>
                  <div><dt className="text-slate-500">Generated</dt><dd className="mt-1 font-bold text-white"><time dateTime="2026-07-25T10:00:00Z">July 25, 2026, 10:00 UTC</time></dd></div>
                  <div><dt className="text-slate-500">Methodology version</dt><dd className="mt-1 font-bold text-white">Business Investigation 1.0</dd></div>
                </dl>
              </aside>
            </div>
          </section>

          <section aria-labelledby="evidence-chain-heading" className="py-14">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-red-300">Why this is more useful than search</p>
              <h2 id="evidence-chain-heading" className="mt-4 text-3xl font-black">A reviewable chain from source to action.</h2>
              <p className="mt-4 leading-7 text-slate-300">Search results provide pages to interpret. ShadowScore organizes supported checks into one record. Each conclusion keeps its source, observation time, confidence, business impact, and evidence limits together.</p>
            </div>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              <li className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><span className="text-xs font-bold text-red-300">01 · OBSERVATION</span><h3 className="mt-3 text-lg font-bold">HTTPS response headers</h3><p className="mt-2 text-sm leading-6 text-slate-400">The content security policy header was not published when the sample evidence was recorded.</p></li>
              <li className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><span className="text-xs font-bold text-red-300">02 · FINDING</span><h3 className="mt-3 text-lg font-bold">Key finding: Browser protection gap</h3><p className="mt-2 text-sm leading-6 text-slate-400">The missing header can make browser protections less consistent for visitors.</p></li>
              <li className="rounded-2xl border border-amber-300/20 bg-amber-300/[.06] p-6"><span className="text-xs font-bold text-amber-200">03 · CONTROL</span><h3 className="mt-3 text-lg font-bold">Request a technical review</h3><p className="mt-2 text-sm leading-6 text-slate-300">Ask the website team to assess and configure the header before relying on the website review.</p></li>
            </ol>
          </section>

          <article id="report-dashboard" aria-label="Illustrative report dashboard" className="scroll-mt-24 rounded-[2rem] border border-white/10 bg-white/[.03] p-6 sm:p-10">
            <WebsiteIntelligenceDashboard report={sampleWebsiteIntelligenceReport} />
          </article>

          <article id="evidence-detail" aria-label="Illustrative evidence detail" className="mt-8 scroll-mt-24 rounded-[2rem] border border-white/10 bg-white/[.03] p-6 sm:p-10">
            <header className="mb-8 border-b border-white/10 pb-6">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-red-300">Contradictions and missing evidence</p>
              <h2 className="mt-3 text-2xl font-black">Recommended action and source appendix</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">The detail below keeps unavailable reputation evidence visible beside the observed website record and recommended control.</p>
            </header>
            <WebsiteIntelligenceReportView report={sampleWebsiteIntelligenceReport} />
          </article>

          <section id="report-value" aria-labelledby="report-value-heading" className="sample-report-commercial scroll-mt-24 py-14 sm:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-red-300">Current self-service entry offer</p>
              <h2 id="report-value-heading" className="mt-4 text-3xl font-black">One Business Investigation, documented for review.</h2>
              <p className="mt-5 leading-7 text-slate-300">The $9.90 one-time offer is the current self-service path for one Business Investigation. It produces the same report structure shown on this page and saves the completed record in your private workspace.</p>
            </div>
            <div className="mt-9 grid gap-5 lg:grid-cols-2">
              <article className="rounded-3xl border border-white/10 bg-[#0b1727] p-6 sm:p-8">
                <h3 className="text-lg font-bold">Included</h3>
                <ul className="mt-5 space-y-4 text-sm text-slate-300">
                  {[
                    "A decision brief with confidence and evidence coverage",
                    "Material findings, unresolved questions, and recommended controls",
                    "Source observations, provider status, and collection times",
                    "A report retained in the purchasing account workspace",
                  ].map((item) => <li className="flex gap-3" key={item}><span aria-hidden="true" className="text-emerald-300">✓</span><span>{item}</span></li>)}
                </ul>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/[.03] p-6 sm:p-8">
                <h3 className="text-lg font-bold">Service boundaries</h3>
                <dl className="mt-5 space-y-5 text-sm">
                  <div><dt className="font-bold text-white">Expected delivery</dt><dd className="mt-1 leading-6 text-slate-400">The current checkout states that reports are usually ready within two minutes. Provider delays or unavailable evidence can affect completion.</dd></div>
                  <div><dt className="font-bold text-white">Access and retention</dt><dd className="mt-1 leading-6 text-slate-400">Access is limited to the purchasing account. The report remains in that workspace until the customer permanently deletes the retained record.</dd></div>
                  <div><dt className="font-bold text-white">Evidence limits</dt><dd className="mt-1 leading-6 text-slate-400">Coverage depends on the submitted subject, available public sources, configured providers, and customer evidence. An unavailable provider is recorded as a gap, not treated as a clear result.</dd></div>
                  <div><dt className="font-bold text-white">Not included</dt><dd className="mt-1 leading-6 text-slate-400">The report is decision support. It is not legal, financial, compliance, or security advice, and it does not guarantee a business outcome.</dd></div>
                </dl>
              </article>
            </div>
            <aside className="mt-5 rounded-3xl border border-white/10 bg-white/[.03] p-6 sm:p-8" aria-labelledby="enterprise-path-heading">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">Enterprise evaluation</p>
              <h3 id="enterprise-path-heading" className="mt-3 text-2xl font-black">Evaluate a governed review path with sales.</h3>
              <p className="mt-3 max-w-4xl leading-7 text-slate-300">Contact sales when procurement, finance, compliance, or security needs to assess source coverage, access controls, retention requirements, review volume, or an organization-level workflow. ShadowScore will confirm supported requirements before any commercial commitment.</p>
              <Link href="/contact" className="mt-6 inline-flex rounded-full border border-white/20 px-6 py-3 font-bold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Contact sales</Link>
            </aside>
          </section>

          <section aria-labelledby="sample-cta-heading" className="sample-report-cta rounded-[2rem] border border-red-300/20 bg-red-300/[.08] p-7 text-center sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-red-200">Your next decision</p>
            <h2 id="sample-cta-heading" className="mt-4 text-3xl font-black">Check a company before you commit.</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">Start with a free preview. Confirm the subject and available scope before ordering one Business Investigation.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/intake" className="rounded-full bg-red-500 px-7 py-4 font-bold text-slate-950 hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Start free preview</Link>
              <Link href="/methodology" className="rounded-full border border-white/20 px-7 py-4 font-bold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Review methodology</Link>
            </div>
          </section>
        </div>
      </main>
    </ShadowScoreLayout>
  );
}
