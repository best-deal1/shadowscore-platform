"use client";

import { useState } from "react";

export default function IntakePage() {
  const [files, setFiles] = useState<File[]>([]);
  const progress = files.length === 0 ? 0 : Math.min(100, 35 + files.length * 15);

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(220,38,38,0.16),transparent_42%)]" />

      <header className="relative z-10 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="text-sm text-zinc-500 hover:text-white">← Back to ShadowScore</a>
          <div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">
            Marketplace Risk Intelligence
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[.95fr_1.05fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.45em] text-red-300">ShadowScore Intake</div>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight">Marketplace Intelligence Intake Console</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              Upload marketplace emails, screenshots, tracking exports, payout notices and operational evidence for private exposure analysis.
            </p>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <div className="font-bold">What this console produces</div>
              <p className="mt-4 leading-7 text-zinc-400">
                A structured intelligence report showing where marketplace exposure may already be building, without exposing the detection method.
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/[0.06] p-6">
              <div className="font-bold text-red-200">Evidence security</div>
              <p className="mt-3 leading-7 text-zinc-400">
                All uploaded evidence is reviewed manually by our risk intelligence team and deleted after analysis.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-black/55 p-6 shadow-[0_0_60px_rgba(120,0,20,0.16)] backdrop-blur-xl">
            <div className="grid gap-5 md:grid-cols-2">
              <label>
                <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Marketplace</div>
                <select className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white">
                  <option>eBay</option>
                  <option>Amazon</option>
                  <option>Walmart</option>
                  <option>Etsy</option>
                  <option>TikTok Shop</option>
                </select>
              </label>
              <label>
                <div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Store URL or seller name</div>
                <input className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white" placeholder="https://..." />
              </label>
            </div>

            <label className="mt-6 grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02] p-16 text-center hover:border-red-500/40">
              <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-2xl font-extrabold">Drop evidence files here</div>
              <div className="mt-3 text-zinc-500">PNG, JPG, CSV, PDF, DOCX, XLSX</div>
              <div className="mt-5 text-sm font-bold text-red-300">Click to select files</div>
            </label>

            <div className="mt-6 rounded-2xl border border-white/10 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">Intake progress</div>
                  <div className="mt-2 font-bold">{files.length ? "Evidence loaded" : "Waiting for evidence"}</div>
                </div>
                <div className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">
                  {files.length} files
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-gradient-to-r from-red-800 via-red-500 to-red-300 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <a href="/analysis" className="mt-6 block rounded-2xl bg-red-600 px-7 py-5 text-center text-sm font-black uppercase tracking-[0.16em] shadow-[0_0_28px_rgba(220,38,38,0.28)] hover:bg-red-500">
              Start Analysis
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
