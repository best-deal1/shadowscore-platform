export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <section className="relative min-h-screen px-6 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(127,29,29,0.25),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-900/30">
                <div className="text-3xl font-black text-white">
                  S
                </div>
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight">
                  Shadow<span className="text-red-500">Score</span>
                </div>
                <div className="text-xs tracking-[0.35em] text-zinc-500 uppercase">
                  Risk Intelligence
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
              <a href="#signals" className="hover:text-white">Signals</a>
              <a href="#platforms" className="hover:text-white">Platforms</a>
              <a href="#contact" className="hover:text-white">Contact</a>
            </nav>
          </header>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 mb-8">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Marketplace Risk Intelligence
              </div>

              <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
                Detect Trust Decay Before Enforcement
              </h1>

              <p className="mt-8 text-xl text-zinc-400 leading-relaxed max-w-2xl">
                ShadowScore identifies hidden seller risk signals before suspensions,
                payout holds and marketplace reviews happen.
              </p>

              <div className="mt-10 bg-zinc-950/80 border border-zinc-800 rounded-3xl p-4 max-w-2xl shadow-2xl shadow-red-950/30">
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    className="flex-1 bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-red-500"
                    placeholder="Paste eBay, Amazon, Walmart or SHEIN store URL"
                  />
                  <a
                    href="mailto:intel@shadowscore.io?subject=Private ShadowScore Risk Audit"
                    className="bg-red-600 hover:bg-red-500 transition rounded-2xl px-7 py-4 text-center font-bold"
                  >
                    Scan My Store
                  </a>
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  Private audit requests are reviewed manually during early access.
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="mailto:intel@shadowscore.io"
                  className="border border-zinc-700 hover:border-red-500 rounded-2xl px-7 py-4 font-semibold bg-zinc-950/60"
                >
                  Contact ShadowScore
                </a>
                <a
                  href="#signals"
                  className="text-zinc-400 hover:text-white px-4 py-4"
                >
                  View Risk Signals
                </a>
              </div>
            </div>

            <div className="bg-zinc-950/90 border border-zinc-800 rounded-[32px] p-6 shadow-2xl shadow-red-950/30">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
                <div>
                  <div className="text-zinc-500 text-sm">Live Risk Terminal</div>
                  <div className="text-2xl font-black mt-1">ShadowScore Monitor</div>
                </div>
                <div className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  Elevated
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <Metric title="Marketplace Trust" value="72" status="Elevated Risk" color="text-red-500" />
                <Metric title="Tracking Integrity" value="61" status="Degrading" color="text-yellow-400" />
                <Metric title="Payout Stability" value="54" status="Watchlist" color="text-orange-400" />
                <Metric title="Enforcement Risk" value="HIGH" status="30 Day Window" color="text-red-400" />
              </div>

              <div className="mt-6 space-y-4">
                <Alert title="Tracking Validation Decline" text="Upload delays increased 43% during the last 7 days." />
                <Alert title="Behavioral Drift Detected" text="Current behavior resembles accounts reviewed within 30 days." />
                <Alert title="Fulfillment Exposure" text="Elevated TBA dependency and inconsistent scan quality detected." />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="signals" className="relative border-t border-zinc-900 px-6 py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-red-400 uppercase tracking-[0.35em] text-sm font-bold">
            Invisible Marketplace Signals
          </div>

          <h2 className="mt-5 text-4xl md:text-5xl font-black max-w-4xl">
            Your Marketplace Account Has A Hidden Risk Profile
          </h2>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card title="Tracking Integrity Scanner" text="Detect weak tracking, delayed uploads, TBA exposure and scan inconsistency." />
            <Card title="Trust Decay Timeline" text="Visualize account deterioration before visible marketplace enforcement." />
            <Card title="Risk Recommendations" text="Receive direct actions to stabilize fulfillment, velocity and proof quality." />
          </div>
        </div>
      </section>

      <section id="platforms" className="px-6 py-20 border-t border-zinc-900 bg-black">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-zinc-500 uppercase tracking-[0.35em] text-sm font-bold">
            Marketplaces We Monitor
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-4">
            {["eBay", "Amazon", "Walmart", "SHEIN", "TikTok Shop"].map((item) => (
              <div key={item} className="rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-6 text-xl font-black text-zinc-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="px-6 py-24 bg-gradient-to-b from-zinc-950 to-black border-t border-zinc-900 text-center">
        <h2 className="text-4xl md:text-6xl font-black">
          Know Your Risk Before The Marketplace Does
        </h2>
        <p className="mt-6 text-zinc-400 text-xl max-w-2xl mx-auto">
          Early access is open for sellers, agencies and multi-store operators.
        </p>

        <a
          href="mailto:intel@shadowscore.io?subject=ShadowScore Early Access"
          className="inline-block mt-10 bg-red-600 hover:bg-red-500 transition rounded-2xl px-10 py-5 font-black text-lg shadow-xl shadow-red-900/30"
        >
          Request Private Risk Audit
        </a>

        <div className="mt-10 text-zinc-600 text-sm">
          ShadowScore © 2026 · Marketplace Risk Intelligence
        </div>
      </section>
    </main>
  );
}

function Metric({ title, value, status, color }: { title: string; value: string; status: string; color: string }) {
  return (
    <div className="bg-black border border-zinc-800 rounded-3xl p-5">
      <div className="text-zinc-500 text-sm">{title}</div>
      <div className={`mt-3 text-4xl font-black ${color}`}>{value}</div>
      <div className="mt-2 text-sm text-zinc-400">{status}</div>
    </div>
  );
}

function Alert({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-black border border-zinc-800 rounded-2xl p-5">
      <div className="text-red-400 font-bold">{title}</div>
      <div className="mt-2 text-sm text-zinc-500">{text}</div>
    </div>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-black p-8 hover:border-red-500/50 transition">
      <div className="text-2xl font-black">{title}</div>
      <div className="mt-4 text-zinc-400 leading-relaxed">{text}</div>
    </div>
  );
}