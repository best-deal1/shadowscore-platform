export default function ShadowScoreLanding() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-zinc-900"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 mb-6">
            Marketplace Risk Intelligence
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight max-w-5xl">
            Detect Marketplace Risk Before Enforcement
          </h1>

          <p className="mt-8 text-zinc-400 text-xl max-w-3xl leading-relaxed">
            ShadowScore identifies hidden marketplace trust degradation signals before suspensions, payout holds and seller reviews happen.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <button className="bg-red-600 hover:bg-red-500 transition px-8 py-4 rounded-2xl text-lg font-semibold shadow-2xl shadow-red-600/20">
              Scan My Store
            </button>

            <button className="border border-zinc-700 hover:border-zinc-500 transition px-8 py-4 rounded-2xl text-lg font-semibold bg-zinc-900/50">
              Join Early Access
            </button>
          </div>

          <div className="mt-20 grid md:grid-cols-4 gap-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
              <div className="text-zinc-500 text-sm">Marketplace Trust Score</div>
              <div className="mt-4 text-5xl font-black text-red-500">72</div>
              <div className="mt-2 text-red-300">Elevated Risk</div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
              <div className="text-zinc-500 text-sm">Tracking Integrity</div>
              <div className="mt-4 text-5xl font-black text-yellow-400">61</div>
              <div className="mt-2 text-yellow-300">Degrading</div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
              <div className="text-zinc-500 text-sm">Enforcement Probability</div>
              <div className="mt-4 text-5xl font-black text-red-400">HIGH</div>
              <div className="mt-2 text-red-300">Within 30 Days</div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
              <div className="text-zinc-500 text-sm">Risk Signals</div>
              <div className="mt-4 text-lg font-semibold leading-8 text-zinc-300">
                TBA Exposure<br />
                Velocity Spike<br />
                Late Tracking Uploads
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <div className="text-red-400 font-semibold uppercase tracking-widest text-sm">
              Invisible Marketplace Signals
            </div>

            <h2 className="mt-5 text-4xl md:text-5xl font-black leading-tight">
              Your Marketplace Account Has A Hidden Risk Score
            </h2>

            <p className="mt-8 text-zinc-400 text-lg leading-relaxed">
              Marketplaces silently evaluate seller behavior every day using hidden trust systems and behavioral scoring.
            </p>

            <div className="mt-10 space-y-5 text-zinc-300">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                <div>Tracking quality degradation</div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-yellow-400 rounded-full mt-2"></div>
                <div>Velocity and fulfillment anomalies</div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                <div>Payout and operational trust deterioration</div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-yellow-400 rounded-full mt-2"></div>
                <div>Behavioral patterns linked to enforcement</div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-[32px] p-8 shadow-2xl shadow-red-900/10">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
              <div>
                <div className="text-zinc-500 text-sm">Live Threat Feed</div>
                <div className="text-2xl font-bold mt-2">ShadowScore Monitor</div>
              </div>

              <div className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                Elevated Risk
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <div className="bg-black rounded-2xl border border-zinc-800 p-5">
                <div className="text-red-400 font-semibold">Tracking Validation Decline</div>
                <div className="text-zinc-500 mt-2 text-sm">
                  Upload delays increased 43% during the last 7 days.
                </div>
              </div>

              <div className="bg-black rounded-2xl border border-zinc-800 p-5">
                <div className="text-yellow-300 font-semibold">Behavioral Drift Detected</div>
                <div className="text-zinc-500 mt-2 text-sm">
                  Marketplace behavior resembles accounts reviewed within 30 days.
                </div>
              </div>

              <div className="bg-black rounded-2xl border border-zinc-800 p-5">
                <div className="text-red-400 font-semibold">Fulfillment Exposure</div>
                <div className="text-zinc-500 mt-2 text-sm">
                  Elevated TBA dependency and inconsistent scan quality detected.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}