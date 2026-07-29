import ShadowScoreLayout from "@/app/components/ShadowScoreLayout";

export default function InvestigationsLoading() {
  return <ShadowScoreLayout><main className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10" aria-busy="true" aria-label="Loading investigations">
    <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
    <div className="mt-6 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]"><div className="h-[560px] animate-pulse rounded-3xl border border-white/10 bg-white/[.035]" /><div className="h-[620px] animate-pulse rounded-3xl border border-white/10 bg-white/[.035] p-7"><p className="ui-label">Retrieving investigations</p><p className="mt-2 text-sm text-zinc-400">Loading progress, evidence, decisions, and reports.</p></div></div>
  </main></ShadowScoreLayout>;
}
