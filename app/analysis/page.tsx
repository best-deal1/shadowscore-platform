import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

const causes = [
  ["Tracking Integrity", 71, "TBA usage, late tracking updates, missing carrier scan evidence"],
  ["Verification / KYC", 14, "Business or identity documentation may require review"],
  ["Payment Risk", 9, "Payout hold or managed payments review correlation"],
  ["Supplier Documentation", 6, "Invoice, LOA or authenticity questions less likely in this sample"],
];

const timeline = [["Day -30", "Hidden trust signal appears"], ["Day -21", "Tracking anomalies accumulate"], ["Day -14", "Payout review risk increases"], ["Day -7", "Account review probability rises"], ["Day 0", "Warning email becomes visible"]];

export default function AnalysisPage() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="text-sm uppercase tracking-[0.35em] text-red-300">Risk Operating System</div><h1 className="mt-4 text-5xl font-black">Marketplace Exposure Analysis</h1><p className="mt-4 max-w-2xl text-zinc-400">A structured view of the likely root cause, risk categories and recovery readiness.</p></div><Link href="/report" className="rounded-2xl bg-red-600 px-6 py-4 font-black hover:bg-red-500">Generate Report</Link></div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8"><div className="text-xs uppercase tracking-[0.35em] text-zinc-500">Overall ShadowScore</div><div className="mt-5 text-7xl font-black text-red-400">72</div><div className="mt-3 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-center font-black text-orange-200">Elevated Review Exposure</div><div className="mt-8 space-y-4">{["Delivery Confidence 92%", "Appeal Readiness 77%", "Recovery Complexity Medium"].map((x) => <div key={x} className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm font-bold text-zinc-300">{x}</div>)}</div></div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8"><div className="text-xs uppercase tracking-[0.35em] text-zinc-500">Root Cause Engine</div><h2 className="mt-3 text-3xl font-black">Most Likely Causes</h2><div className="mt-6 space-y-5">{causes.map(([name, pct, desc]) => <div key={String(name)} className="rounded-3xl border border-white/10 bg-black/40 p-5"><div className="flex justify-between gap-4"><div><div className="font-black">{name}</div><div className="mt-2 text-sm text-zinc-500">{desc}</div></div><div className="text-2xl font-black text-red-300">{pct}%</div></div><div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-red-500" style={{ width: `${pct}%` }} /></div></div>)}</div></div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8"><div className="text-xs uppercase tracking-[0.35em] text-zinc-500">Trust Timeline</div><h2 className="mt-3 text-3xl font-black">The review did not start today.</h2><div className="mt-6 space-y-4">{timeline.map(([day, event]) => <div key={day} className="flex gap-4 rounded-2xl border border-white/10 bg-black/40 p-4"><div className="w-24 font-black text-red-300">{day}</div><div className="text-zinc-300">{event}</div></div>)}</div></div><div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8"><div className="text-xs uppercase tracking-[0.35em] text-zinc-500">Recommended Actions</div><h2 className="mt-3 text-3xl font-black">Appeal Readiness Checklist</h2><div className="mt-6 space-y-3 text-zinc-300">{["Submit proof of delivery package", "Include buyer feedback where available", "Do not add artificial tracking data", "Keep the appeal focused on requested evidence", "Avoid unrelated supplier or brand explanations unless requested"].map((x) => <div key={x} className="rounded-2xl border border-white/10 bg-black/40 p-4">✓ {x}</div>)}</div></div></div>
      </section>
    </ShadowScoreLayout>
  );
}
