const findings = [
  "Tracking integrity drift is the strongest current exposure signal.",
  "Operational timing appears inconsistent across recent marketplace activity.",
  "Account posture should be stabilized before additional velocity growth.",
  "Evidence package should be strengthened around fulfillment and delivery proof.",
];

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <a href="/analysis" className="text-sm text-zinc-500 transition hover:text-white">
          ← Back to Analysis
        </a>

        <section className="mt-12 rounded-[36px] border border-white/10 bg-white/[0.03] p-8">
          <div className="flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.34em] text-red-400">
                ShadowScore Report
              </div>
              <h1 className="mt-5 text-5xl font-bold">
                Marketplace Exposure Summary
              </h1>
              <p className="mt-5 max-w-2xl leading-8 text-zinc-400">
                Private intelligence report generated from submitted operational evidence and marketplace context.
              </p>
            </div>

            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-6 py-4 text-center">
              <div className="text-sm text-red-200">Overall Exposure</div>
              <div className="mt-2 text-4xl font-bold">78</div>
              <div className="mt-1 text-red-300">Elevated</div>
            </div>
          </div>

          <section className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ["Risk Window", "30 days"],
              ["Primary Driver", "Tracking integrity"],
              ["Priority", "Stabilization required"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/45 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-zinc-600">{label}</div>
                <div className="mt-3 text-xl font-semibold">{value}</div>
              </div>
            ))}
          </section>

          <section className="mt-8">
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">
              Primary Findings
            </div>
            <div className="mt-5 space-y-3">
              {findings.map((finding) => (
                <div key={finding} className="rounded-2xl border border-white/10 bg-black/45 p-5 text-zinc-300">
                  {finding}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-white/10 bg-black/45 p-6">
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">
              Marketplace Interpretation
            </div>
            <p className="mt-5 leading-8 text-zinc-400">
              The submitted evidence suggests the marketplace may interpret recent account behavior as operationally inconsistent. This does not indicate a guaranteed restriction, but it does justify immediate stabilization before additional growth or further account changes.
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-white/10 bg-black/45 p-6">
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">
              Recommended Stabilization Actions
            </div>
            <ul className="mt-5 space-y-3 text-zinc-400">
              <li>Strengthen delivery proof and tracking consistency.</li>
              <li>Reduce operational volatility during the next review window.</li>
              <li>Pause high-risk listings and policy-sensitive items.</li>
              <li>Prepare evidence package before contacting marketplace support.</li>
            </ul>
          </section>
        </section>
      </div>
    </main>
  );
}
