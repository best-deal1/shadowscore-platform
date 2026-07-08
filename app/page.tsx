"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShadowScoreLayout from "./components/ShadowScoreLayout";

const scanSteps = ["Identifying target", "Classifying business", "Collecting public evidence", "Building business profile", "Generating decision"];

export default function Home() {
  const router = useRouter();
  const [target, setTarget] = useState("");

  function startScan() {
    const query = target.trim() ? `?target=${encodeURIComponent(target.trim())}&mode=website` : "";
    router.push(`/intake${query}`);
  }

  return (
    <ShadowScoreLayout>
      <section className="relative overflow-hidden px-6 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.20),transparent_42%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-200">ShadowScore Trust Intelligence</div>
            <h1 className="mt-7 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Search any business before you trust it.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">Enter a company, website, seller profile or marketplace account. ShadowScore turns public trust signals into a clear business identity, decision preview and next-step path.</p>
            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.045] p-3 shadow-2xl shadow-red-950/20 sm:flex">
              <input value={target} onChange={(event) => setTarget(event.target.value)} onKeyDown={(event) => event.key === "Enter" && startScan()} className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-black/70 px-5 text-white outline-none placeholder:text-zinc-600 focus:border-red-400/50" placeholder="Business name, domain or seller URL" />
              <button onClick={startScan} className="mt-3 min-h-14 rounded-2xl bg-red-600 px-7 text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-red-500 sm:ml-3 sm:mt-0">Search</button>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-zinc-400">
              <span className="rounded-full border border-white/10 px-4 py-2">No backend changes</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Business-first results</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Mobile-ready flow</span>
            </div>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-black/65 p-6 shadow-[0_0_80px_rgba(220,38,38,0.18)]">
            <div className="text-xs font-black uppercase tracking-[0.28em] text-red-300">Scan flow</div>
            <div className="mt-6 space-y-4">
              {scanSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-600/20 text-sm font-black text-red-100">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-white">{step}...</div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full animate-pulse rounded-full bg-gradient-to-r from-red-700 via-red-500 to-red-200" style={{ width: `${34 + index * 13}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/upgrade" className="mt-6 block rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-center text-sm font-black text-red-100 hover:bg-red-500/20">See Professional upgrade</Link>
          </div>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
