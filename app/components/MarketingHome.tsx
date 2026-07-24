import Link from "next/link";
import { MarketingCta } from "./MarketingAnalytics";
import { JsonLd } from "./MarketingPage";

const useCases = [
  "Verify a supplier before paying",
  "Screen a business partner",
  "Investigate an online seller",
  "Review an investment opportunity",
  "Validate a company",
  "Support compliance and procurement",
];

const stages = [
  ["Start a case", "Enter the business or organization you want to review."],
  ["Review the case", "Use the workspace to view active cases and their next actions."],
  ["Record progress", "Keep the investigation organized as information is gathered."],
  ["Make your decision", "Use the case record to support your analyst review."],
];

export default function MarketingHome() {
  return (
    <div className="bg-[#07111f] text-slate-100">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "ShadowScore investigation workspace",
          provider: { "@type": "Organization", name: "ShadowScore" },
          description: "A workspace for organizing business due diligence cases.",
        }}
      />
      <main>
        <section className="bg-[radial-gradient(circle_at_78%_10%,rgba(14,165,233,.22),transparent_30%),#07111f] px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[.24em] text-sky-300">Investigation workspace</p>
            <h1 className="mt-6 max-w-5xl text-5xl font-black tracking-tight sm:text-7xl">Organize business due diligence cases.</h1>
            <p className="mt-7 max-w-3xl text-xl leading-8 text-slate-300">Start a case, keep active investigations in one workspace, and review the next action for each case.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <MarketingCta event="hero_cta_clicked" className="rounded-full bg-sky-400 px-7 py-4 font-bold text-slate-950 hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Start a case</MarketingCta>
              <Link href="/sample-report" className="rounded-full border border-white/20 px-7 py-4 font-bold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">View illustrative sample</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold">Business checks for the decision in front of you</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {useCases.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[.03] p-6">
                <h3 className="font-bold">{item}</h3>
                <p className="mt-3 leading-7 text-slate-300">Create a case and keep the investigation work organized for review.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-950 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">How the workspace works</p>
            <div className="mt-6 grid gap-5 md:grid-cols-4">
              {stages.map(([title, body]) => (
                <div key={title}>
                  <h2 className="text-2xl font-bold">{title}</h2>
                  <p className="mt-3 leading-7 text-slate-300">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-amber-300">Illustrative sample</p>
            <h2 className="mt-4 text-3xl font-bold">See an example report format</h2>
            <p className="mt-4 leading-7 text-slate-300">The sample report demonstrates a possible review format. It is not a live investigation or a description of workspace output.</p>
            <Link href="/sample-report" className="mt-7 inline-flex rounded-full border border-white/20 px-5 py-3 font-bold hover:bg-white/10">View illustrative sample</Link>
          </div>
        </section>

        <section className="bg-sky-300 px-6 py-20 text-slate-950">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-4xl font-black">Start organizing your next investigation.</h2>
            <MarketingCta className="mt-7 inline-flex rounded-full bg-slate-950 px-7 py-4 font-bold text-white hover:bg-slate-800">Start a case</MarketingCta>
          </div>
        </section>
      </main>
    </div>
  );
}
