import Link from "next/link";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";

const riskCategories = [
  ["Tracking Integrity", "TBA usage, carrier scan gaps, late tracking updates"],
  ["Payment & Payout Risk", "Payout holds, reserves, managed payments reviews"],
  ["Verification & KYC", "Identity, bank, utility bill, VAT and business checks"],
  ["Account Trust Risk", "Suspicious activity, device changes, IP/country mismatch"],
  ["Document Risk", "Supplier invoices, LOA, brand authorization, VeRO"],
  ["Operational Drift", "Velocity spikes, category risk, return and dispute patterns"],
];

export default function Home() {
  return (
    <ShadowScoreLayout>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,.22),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(127,29,29,.2),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.05fr_.95fr] lg:py-32">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">Marketplace Risk Operating System</div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">The warning email is often the last signal, not the first.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-300">ShadowScore helps marketplace sellers understand hidden trust signals, tracking risk, payout exposure, verification gaps and suspension probability before enforcement becomes visible.</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/intake" className="rounded-2xl bg-red-600 px-7 py-4 font-black hover:bg-red-500">Start Marketplace Audit</Link>
              <Link href="/analysis" className="rounded-2xl border border-white/15 px-7 py-4 font-black text-zinc-200 hover:bg-white/5">View Risk OS</Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              {["eBay", "Amazon", "Walmart"].map((m) => <div key={m} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-sm font-bold text-zinc-300">{m}</div>)}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-2xl shadow-red-950/20">
            <div className="mb-5 flex items-center justify-between">
              <div><div className="text-xs uppercase tracking-[0.35em] text-red-300">Risk Console</div><div className="mt-2 text-2xl font-black">ShadowScore 72</div></div>
              <div className="rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-200">Elevated</div>
            </div>
            <div className="space-y-4">
              {[["Tracking Integrity", 68], ["Payout Exposure", 81], ["Verification Readiness", 74], ["Account Trust", 59], ["Appeal Readiness", 77]].map(([name, score]) => (
                <div key={String(name)} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="mb-2 flex justify-between text-sm"><span className="font-bold">{name}</span><span className="text-red-300">{score}/100</span></div>
                  <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-red-500" style={{ width: `${score}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl"><div className="text-sm uppercase tracking-[0.35em] text-red-300">Root Cause Intelligence</div><h2 className="mt-4 text-4xl font-black">Most sellers do not know why the marketplace acted.</h2><p className="mt-4 text-zinc-400">MC011, payout holds and suspicious activity notices can come from different risk layers. ShadowScore separates the signal from the panic.</p></div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{riskCategories.map(([title, desc]) => <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"><div className="text-lg font-black">{title}</div><p className="mt-3 leading-7 text-zinc-400">{desc}</p></div>)}</div>
      </section>
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-12">
          <div className="text-sm uppercase tracking-[0.35em] text-red-300">First Product</div>
          <h2 className="mt-4 text-4xl font-black">ShadowScore Account Audit</h2>
          <p className="mt-4 max-w-2xl text-zinc-400">Not a promise to reinstate. A professional risk assessment that explains the likely root cause, missing evidence, appeal readiness and next action.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[["Exposure Audit", "$49", "Root cause analysis and recovery readiness"], ["Private Report", "$199", "Evidence review, risk score and appeal roadmap"], ["Monitoring", "$299/mo", "Ongoing marketplace risk and payout exposure monitoring"]].map(([name, price, desc]) => <div key={name} className="rounded-3xl border border-white/10 bg-black/40 p-6"><div className="text-xl font-black">{name}</div><div className="mt-4 text-4xl font-black text-red-400">{price}</div><p className="mt-4 text-sm leading-7 text-zinc-400">{desc}</p><Link href="/intake" className="mt-6 block rounded-2xl bg-red-600 px-5 py-3 text-center font-black hover:bg-red-500">Start</Link></div>)}
          </div>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
