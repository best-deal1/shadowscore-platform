"use client";

import Link from "next/link";
import { metricProvenance, qualitativeFromScore } from "../../lib/metricDisplay";

const rows = [
  ["Tracking Health", 62, "Elevated"],
  ["Delivery Trust", 84, "Stable"],
  ["Payout Stability", 58, "Watchlist"],
  ["Operational Consistency", 71, "Moderate"],
  ["Marketplace Exposure", 67, "Elevated"],
] as const;

export default function RadarPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:76px_76px]" />
      <header className="relative z-10 border-b border-white/10 bg-black/85 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl justify-between">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back to ShadowScore</Link>
          <Link href="/intake" className="text-sm font-bold text-red-300 hover:text-red-200">Start Audit</Link>
        </div>
      </header>
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-14">
        <div className="text-xs uppercase tracking-[0.45em] text-red-300">Trust Radar</div>
        <h1 className="mt-6 text-5xl font-extrabold">The Signals Sellers Never See</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">ShadowScore gives visibility into operational signals that may increase marketplace enforcement exposure. These radar levels are inferred and intentionally shown without false numeric precision.</p>
        <div className="mt-10 rounded-[32px] border border-white/10 bg-black/55 p-8 shadow-[0_0_60px_rgba(120,0,20,0.16)]">
          <div className="space-y-6">
            {rows.map(([name, score, status]) => (
              <div key={name}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-zinc-300">{name}</span>
                  <span className="font-bold text-white">{qualitativeFromScore(score)} · {status}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-red-700 via-red-500 to-red-300" style={{ width: `${score}%` }} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">{metricProvenance("inferred")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
