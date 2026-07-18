import Link from "next/link";
import PaymentButtons from "../components/PaymentButtons";
import ShadowScoreLayout from "../components/ShadowScoreLayout";

const unlocks = [
  "Downloadable Professional Report for $9.90 per completed investigation",
  "Unlimited saved scan history in your workspace",
  "Full downloadable reports after successful payment",
  "Business identity summaries, decision reasons and recommended actions",
  "Monitoring watchlist for businesses, marketplaces, suppliers and payment providers",
  "Saved reports, business history and account-level workspace organization",
];

export default function UpgradePage() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[.95fr_1.05fr] lg:items-start">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.32em] text-red-300">Plans</div>
            <h1 className="mt-5 text-5xl font-black tracking-tight">Upgrade from preview to operating intelligence.</h1>
            <p className="mt-5 text-lg leading-8 text-zinc-400">Start with a free preview, then unlock a downloadable Professional Report for $9.90 when the evidence is useful. Free users can run previews; paid users can save, organize, monitor and open full reports.</p>
          </div>
          <div className="rounded-[34px] border border-red-400/25 bg-red-500/[0.07] p-7">
            <div className="text-sm font-black uppercase tracking-[0.22em] text-red-200">What becomes available after payment</div>
            <div className="mt-6 space-y-3">
              {unlocks.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/45 p-4 text-sm font-bold text-zinc-100">✓ {item}</div>)}
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <PaymentButtons planName="Downloadable Professional Report" price="$9.90" buttonLabel="Upgrade - $9.90" />
              <Link href="/intake" className="rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-black text-white hover:border-red-400/30">Run a scan first</Link>
            </div>
          </div>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
