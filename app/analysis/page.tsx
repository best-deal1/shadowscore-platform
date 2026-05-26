"use client";

const signals = [
  {
    name: "Tracking Integrity",
    severity: "Elevated",
    confidence: "84%",
    finding: "Delayed label creation and weak delivery proof patterns detected.",
  },
  {
    name: "Operational Drift",
    severity: "Watchlist",
    confidence: "71%",
    finding: "Fulfillment timing and order handling show inconsistent behavior.",
  },
  {
    name: "Payout Exposure",
    severity: "Moderate",
    confidence: "66%",
    finding: "Patterns may increase probability of payout review or reserve friction.",
  },
  {
    name: "Trust Decay",
    severity: "Elevated",
    confidence: "79%",
    finding: "Refund, cancellation or tracking inconsistency may weaken account posture.",
  },
  {
    name: "Enforcement Similarity",
    severity: "Watchlist",
    confidence: "63%",
    finding: "Some activity resembles accounts that later entered marketplace review.",
  },
];

export default function AnalysisPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <a href="/intake" className="text-sm text-zinc-500 transition hover:text-white">
            ← Back to Intake
          </a>

          <a
            href="/report"
            className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-500"
          >
            Generate Intelligence Report
          </a>
        </div>

        <section className="mt-12">
          <div className="text-sm uppercase tracking-[0.34em] text-red-400">
            ShadowScore Analysis
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-tight">
            Marketplace Exposure Analysis Console
          </h1>
          <p className="mt-5 max-w-3xl leading-8 text-zinc-400">
            This console translates submitted evidence into operational exposure signals, confidence levels and recommended stabilization priorities.
          </p>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-7">
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">
              Exposure Score
            </div>
            <div className="mt-6 text-7xl font-bold">78</div>
            <div className="mt-3 text-xl text-red-300">Elevated</div>
            <p className="mt-6 leading-7 text-zinc-400">
              The account shows elevated operational exposure. The strongest signals are tracking integrity and trust posture drift.
            </p>

            <div className="mt-8 space-y-4">
              {["Tracking", "Trust", "Payout", "Operations"].map((item, index) => (
                <div key={item}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-zinc-500">{item}</span>
                    <span className="text-red-300">{["High", "Elevated", "Moderate", "Watchlist"][index]}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-800 via-red-500 to-red-300"
                      style={{ width: ["86%", "78%", "62%", "55%"][index] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-7">
            <div className="text-sm uppercase tracking-[0.28em] text-red-300">
              Signal Findings
            </div>

            <div className="mt-6 space-y-4">
              {signals.map((signal) => (
                <div key={signal.name} className="rounded-2xl border border-white/10 bg-black/45 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xl font-semibold">{signal.name}</div>
                    <div className="flex gap-2">
                      <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs text-red-200">
                        {signal.severity}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
                        {signal.confidence}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 leading-7 text-zinc-400">{signal.finding}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
