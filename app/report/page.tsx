import ShadowScoreLayout from "@/components/ShadowScoreLayout";

export default function ReportPage() {
  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-12">
          <div className="text-sm uppercase tracking-[0.35em] text-red-300">Private Intelligence Report</div>
          <h1 className="mt-4 text-5xl font-black">ShadowScore Account Audit</h1>
          <p className="mt-5 text-zinc-400">This is a sample report format designed for sellers under review, restriction, payout hold or verification pressure.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">{[["Overall Exposure", "Elevated"], ["Primary Root Cause", "Tracking Integrity"], ["Recovery Readiness", "Medium-High"]].map(([k, v]) => <div key={k} className="rounded-3xl border border-white/10 bg-black/40 p-6"><div className="text-xs uppercase tracking-[0.25em] text-zinc-500">{k}</div><div className="mt-3 text-2xl font-black text-red-300">{v}</div></div>)}</div>
          <div className="mt-10 space-y-6">{[["Executive Summary", "The account shows elevated exposure linked primarily to tracking integrity and delivery verification gaps. Evidence package should focus only on proof of delivery and buyer confirmation."], ["Evidence Assessment", "Delivery photos, delivery maps and buyer feedback increase confidence. Artificial or third-party tracking reconstruction should be avoided."], ["Recommended Appeal Strategy", "Reply directly to the Trust & Safety request. Attach one consolidated document. Do not introduce unrelated supplier or brand topics unless requested."], ["Missing Evidence", "Any order without buyer feedback should include delivery screenshot, photo, address/map evidence and order ID cross-reference."]].map(([title, body]) => <div key={title} className="rounded-3xl border border-white/10 bg-black/40 p-6"><h2 className="text-2xl font-black">{title}</h2><p className="mt-3 leading-8 text-zinc-400">{body}</p></div>)}</div>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
