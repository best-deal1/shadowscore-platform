import Link from "next/link";
import ShadowScoreLayout from "@/app/components/ShadowScoreLayout";

export default function NotFound() {
  return <ShadowScoreLayout><main className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><section className="rounded-2xl border border-white/10 bg-white/[.035] p-6"><p className="ui-label">Case workspace</p><h1 className="mt-2 text-3xl font-black text-white">Case not found</h1><p className="mt-3 text-sm text-zinc-400">This case is unavailable in your workspace.</p><Link href="/workspace" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-sky-500 px-4 text-sm font-bold text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200">Return to workspace</Link></section></main></ShadowScoreLayout>;
}
