"use client";

import { useState } from "react";
import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export default function IntakePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [marketplace, setMarketplace] = useState("eBay");
  const [issue, setIssue] = useState("MC011 / Account Review");

  return (
    <ShadowScoreLayout>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back to ShadowScore</Link>
          <div className="mt-12 text-sm uppercase tracking-[0.35em] text-red-300">Internal Intelligence Intake</div>
          <h1 className="mt-6 text-5xl font-black leading-tight">Marketplace Intelligence Intake Console</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">Upload suspension notices, screenshots, tracking exports, payout holds and marketplace messages. ShadowScore turns raw evidence into a structured risk report.</p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-sm font-black">What this console produces</div>
            <p className="mt-3 leading-7 text-zinc-400">Root cause probability, appeal readiness, missing evidence, recovery complexity and risk categories without exposing the detection method.</p>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block"><div className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-500">Marketplace</div><select value={marketplace} onChange={(e) => setMarketplace(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4 outline-none">{["eBay", "Amazon", "Walmart", "Etsy", "TikTok Shop", "Shopify"].map((m) => <option key={m}>{m}</option>)}</select></label>
            <label className="block"><div className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-500">Issue Type</div><select value={issue} onChange={(e) => setIssue(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4 outline-none">{["MC011 / Account Review", "Suspicious Activity", "Payout Hold", "Managed Payments Review", "Verification Request", "VeRO / IP", "Tracking Issue"].map((m) => <option key={m}>{m}</option>)}</select></label>
          </div>
          <label className="mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10 bg-black/40 p-10 text-center hover:border-red-500/40">
            <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <div className="text-2xl font-black">Drop evidence files here</div>
            <div className="mt-3 text-zinc-500">PNG, JPG, PDF, CSV, XLSX, DOCX</div>
            <div className="mt-5 text-sm font-bold text-red-300">Click to select files</div>
          </label>
          <div className="mt-6 rounded-3xl border border-white/10 bg-black/40 p-5">
            <div className="flex justify-between"><div><div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Intake status</div><div className="mt-2 font-black">{files.length ? "Evidence received" : "Waiting for evidence"}</div></div><div className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">{files.length} files</div></div>
            <div className="mt-5 space-y-2">{files.length ? files.map((file) => <div key={file.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300">{file.name}</div>) : <div className="text-sm text-zinc-500">No evidence uploaded yet.</div>}</div>
          </div>
          <Link href="/analysis" className="mt-6 block rounded-2xl bg-red-600 px-6 py-4 text-center font-black hover:bg-red-500">Start Exposure Analysis</Link>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
