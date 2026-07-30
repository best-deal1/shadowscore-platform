import type { Metadata } from "next";
import Link from "next/link";
import { WebsiteIntelligenceReportView } from "../components/WebsiteIntelligenceReport";
import { WebsiteIntelligenceDashboard } from "../components/WebsiteIntelligenceDashboard";
import { JsonLd } from "../components/MarketingPage";
import { pageMetadata } from "../lib/seo";
import { sampleWebsiteIntelligenceReport } from "../../lib/websiteIntelligence/sampleReport";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export const metadata: Metadata = pageMetadata({ title: "Sample Website Intelligence Report | ShadowScore", description: "View a demonstration Website Intelligence report with findings, evidence sources, coverage, actions, and limitations.", path: "/sample-report" });

export default function SampleReport() {
  return <ShadowScoreLayout><main className="min-h-screen bg-[#07111f] px-6 py-14 text-slate-100">
    <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: "Sample Website Intelligence report" }} />
    <div className="mx-auto mb-8 max-w-5xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Sample report</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">See how an investigation becomes a report</h1><p className="mt-4 max-w-3xl text-lg leading-7 text-slate-300">Review the summary first, then explore the findings, evidence, coverage, and limitations. This example uses demonstration data.</p></div>
    <article className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[.03] p-7 sm:p-12">
      <p className="mb-8 inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-slate-950">Demonstration data</p>
      <WebsiteIntelligenceDashboard report={sampleWebsiteIntelligenceReport} />
      <div className="my-10 border-t border-white/10" />
      <WebsiteIntelligenceReportView report={sampleWebsiteIntelligenceReport} />
      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-8"><Link href="/intake" className="inline-flex rounded-full bg-sky-400 px-6 py-3 font-bold text-slate-950">Start an Investigation</Link><Link href="/pricing" className="font-bold text-slate-200 underline decoration-slate-500 underline-offset-4">See the $9.90 report price</Link></div>
    </article>
  </main></ShadowScoreLayout>;
}
