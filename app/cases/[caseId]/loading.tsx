import ShadowScoreLayout from "@/app/components/ShadowScoreLayout";

export default function Loading() {
  return <ShadowScoreLayout><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10" aria-busy="true" aria-live="polite"><div className="h-8 w-40 animate-pulse rounded bg-white/10" /><div className="mt-5 h-28 animate-pulse rounded-2xl bg-white/[.04]" /><div className="mt-6 h-72 animate-pulse rounded-2xl bg-white/[.04]" /><span className="sr-only">Loading case workspace</span></main></ShadowScoreLayout>;
}
