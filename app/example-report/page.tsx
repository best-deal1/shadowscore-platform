import ShadowScoreLayout from "../../components/ShadowScoreLayout";

const factors = [
  ["Tracking Integrity", "High", "Delayed or weak delivery verification can increase manual review exposure."],
  ["Verification Readiness", "Elevated", "Business, identity and supplier evidence should be organized before appeal or review."],
  ["Payment Exposure", "Elevated", "Payment holds, reserves or payout friction can appear when marketplace trust signals degrade."],
  ["Policy Exposure", "Medium", "Brand, VeRO, authenticity and restricted product signals should be checked before scaling listings."],
];

export default function ExampleReport() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-[36px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_0_80px_rgba(220,38,38,0.12)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.30em] text-red-300">Example Report</div>
              <h1 className="mt-4 text-5xl font-black">ShadowScore Risk Intelligence Report</h1>
              <p className="mt-5 max-w-3xl leading-8 text-zinc-400">A sample view of how ShadowScore explains qualitative risk levels, confidence, top risk factors and next recommended actions. This is demo data only.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/60 p-5 text-right">
              <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Report ID</div>
              <div className="mt-2 text-xl font-black text-white">SS-2026-DEMO-001</div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {[['Risk Level','High','Estimated'],['Evidence Confidence','High','Inferred'],['Health Stage','Warning','Estimated'],['Next Action','Stabilize','Evidence first']].map(([label,value,sub]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-black/60 p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">{label}</div>
                <div className="mt-4 text-4xl font-black text-red-200">{value}</div>
                <div className="mt-2 text-sm text-zinc-500">{sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-black/55 p-7">
            <h2 className="text-2xl font-black">Why This Score?</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {factors.map(([title,severity,detail]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-4"><div className="font-bold text-white">{title}</div><div className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-200">{severity}</div></div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-zinc-500">
            Important: This sample report is an analytical assessment, not internal marketplace data and not a guarantee of future platform decisions. Heuristic or inferred metrics are shown as qualitative levels, not artificial percentages.
          </div>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
