"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white"><section className="max-w-xl text-center"><p className="text-sm font-black uppercase tracking-[.24em] text-red-300">Something went wrong</p><h1 className="mt-4 text-4xl font-black">This page could not be loaded</h1><p className="mt-5 leading-7 text-zinc-400">Try again. Your saved Investigations and reports remain in your Account.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={reset} className="rounded-xl bg-white px-5 py-3 font-black text-black">Try again</button><Link href="/" className="rounded-xl border border-white/15 px-5 py-3 font-bold">Back to Home</Link><Link href="/contact" className="rounded-xl border border-white/15 px-5 py-3 font-bold">Contact Support</Link></div>{error.digest ? <p className="mt-8 font-mono text-xs text-zinc-600">Reference: {error.digest}</p> : null}</section></main>;
}
