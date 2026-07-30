import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export default function NotFound() {
  return <ShadowScoreLayout><main className="mx-auto flex min-h-[65vh] max-w-3xl flex-col justify-center px-6 py-20 text-center"><p className="text-sm font-black uppercase tracking-[.24em] text-red-300">404</p><h1 className="mt-4 text-5xl font-black">Page not found</h1><p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-zinc-400">The address may be outdated. Return home or start a new Investigation.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/" className="rounded-xl bg-white px-5 py-3 font-black text-black">Back to Home</Link><Link href="/intake" className="rounded-xl border border-white/15 px-5 py-3 font-bold text-white">Start Investigation</Link></div></main></ShadowScoreLayout>;
}
