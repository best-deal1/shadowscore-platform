import type { Metadata } from "next";
import Link from "next/link";
import { WebsiteIntelligenceReportView } from "../components/WebsiteIntelligenceReport";
import { JsonLd } from "../components/MarketingPage";
import { pageMetadata } from "../lib/seo";
import { sampleWebsiteIntelligenceReport } from "../../lib/websiteIntelligence/sampleReport";

export const metadata: Metadata = pageMetadata({ title: "Sample Website Intelligence Report | ShadowScore", description: "View a demonstration Website Intelligence report with findings, evidence sources, coverage, actions, and limitations.", path: "/sample-report" });

export default function SampleReport() {
  return <main className="min-h-screen bg-[#07111f] px-6 py-20 text-slate-100">
    <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: "Sample Website Intelligence report" }} />
    <article className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[.03] p-7 sm:p-12">
      <p className="mb-8 inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-slate-950">Demonstration data</p>
      <WebsiteIntelligenceReportView report={sampleWebsiteIntelligenceReport} />
      <Link href="/intake" className="mt-10 inline-flex rounded-full bg-sky-400 px-6 py-3 font-bold text-slate-950">Start due diligence</Link>
    </article>
  </main>;
}
