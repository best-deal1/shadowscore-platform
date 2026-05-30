import ShadowScoreLayout from "@/components/ShadowScoreLayout";

const rows = [
  ["MC011", "eBay", "High", "Tracking / Supplier / Verification"],
  ["Suspicious Activity", "eBay", "High", "Account trust and access behavior"],
  ["Payout Hold", "eBay / Amazon", "Elevated", "Payment risk and delivery verification"],
  ["Verification Request", "Amazon / eBay", "Medium", "Identity, bank, VAT, utility bill"],
  ["Missing Invoices", "eBay / Walmart", "Medium", "Supplier documentation risk"],
  ["TBA Tracking", "eBay", "High", "Carrier visibility gap"],
];

export default function RadarPage() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-sm uppercase tracking-[0.35em] text-red-300">Community Pain Radar</div>
        <h1 className="mt-4 text-5xl font-black">Marketplace Risk Signals From The Field</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">A live intelligence layer for public seller pain signals gathered from communities, support forums and marketplace discussions.</p>
        <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10">
          <table className="w-full border-collapse text-left">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.25em] text-zinc-500"><tr><th className="p-5">Signal</th><th className="p-5">Marketplace</th><th className="p-5">Severity</th><th className="p-5">Interpretation</th></tr></thead>
            <tbody>{rows.map(([signal, market, severity, interp]) => <tr key={signal} className="border-t border-white/10 bg-black/30"><td className="p-5 font-black">{signal}</td><td className="p-5 text-zinc-300">{market}</td><td className="p-5 text-red-300">{severity}</td><td className="p-5 text-zinc-400">{interp}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
