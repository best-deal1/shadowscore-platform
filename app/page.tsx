"use client";

import { useState } from "react";

export default function Home() {
  const [storeUrl, setStoreUrl] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  const mailSubject = encodeURIComponent("ShadowScore Private Risk Audit");
  const mailBody = encodeURIComponent(
    `Hi ShadowScore,\n\nI want a private marketplace risk audit.\n\nStore URL:\n${storeUrl || "Paste store URL here"}\n\nMarketplace:\n\nMain concern:\n\n`
  );

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(127,29,29,0.22),transparent_35%)]" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative">
        <header className="max-w-7xl mx-auto px-6 py-7 flex items-center justify-between">
          <Logo />

          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#agent" className="hover:text-white">Agent</a>
            <a href="#signals" className="hover:text-white">Signals</a>
            <a href="#moat" className="hover:text-white">Moat</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </nav>
        </header>

        <section className="max-w-7xl mx-auto px-6 pt-16 pb-28 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 mb-8">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Marketplace Risk Intelligence
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
              Detect Trust Decay Before Enforcement
            </h1>

            <p className="mt-8 text-xl text-zinc-400 leading-relaxed max-w-2xl">
              ShadowScore is an early warning agent for marketplace sellers. It detects hidden risk signals before suspensions, payout holds and account reviews happen.
            </p>

            <div className="mt-10 bg-zinc-950/90 border border-zinc-800 rounded-3xl p-4 max-w-2xl shadow-2xl shadow-red-950/30">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  className="flex-1 bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-red-500"
                  placeholder="Paste eBay, Amazon, Walmart, SHEIN or TikTok Shop URL"
                />
                <button
                  onClick={() => setScanOpen(true)}
                  className="bg-red-600 hover:bg-red-500 transition rounded-2xl px-7 py-4 text-center font-black"
                >
                  Scan My Store
                </button>
              </div>
              <div className="mt-3 text-xs text-zinc-500">
                Early access scans are private and manually reviewed by ShadowScore.
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={`mailto:intel@shadowscore.io?subject=${mailSubject}&body=${mailBody}`}
                className="border border-zinc-700 hover:border-red-500 rounded-2xl px-7 py-4 font-semibold bg-zinc-950/60"
              >
                Request Private Audit
              </a>
              <a href="#agent" className="text-zinc-400 hover:text-white px-4 py-4">
                See The Agent
              </a>
            </div>
          </div>

          <RiskTerminal />
        </section>

        <section id="agent" className="border-t border-zinc-900 bg-zinc-950/90 px-6 py-24">
          <div className="max-w-7xl mx-auto">
            <Kicker text="The Real Product" />
            <h2 className="mt-5 text-4xl md:text-6xl font-black max-w-4xl">
              The Agent Builds Seller Defense Before The Account Is In Danger
            </h2>

            <div className="mt-12 grid md:grid-cols-4 gap-5">
              <Stage number="01" title="Observe" text="Reads store behavior, tracking quality, seller velocity, claims, refunds and buyer signals." />
              <Stage number="02" title="Score" text="Creates a hidden trust profile and detects marketplace exposure before visible warnings." />
              <Stage number="03" title="Warn" text="Alerts sellers before risk becomes enforcement, payout hold or seller review." />
              <Stage number="04" title="Prepare" text="Tells the seller which data to strengthen and when to protect operational continuity." />
            </div>
          </div>
        </section>

        <section id="signals" className="px-6 py-24 border-t border-zinc-900">
          <div className="max-w-7xl mx-auto">
            <Kicker text="Signal Engine" />
            <h2 className="mt-5 text-4xl md:text-5xl font-black max-w-4xl">
              Marketplace Risk Is Not One Event. It Is A Pattern.
            </h2>

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <Card title="Tracking Integrity" text="Late uploads, TBA exposure, invalid scans, carrier mismatch and weak proof of delivery." />
              <Card title="Velocity Risk" text="Sudden sales growth, category spikes, new account pressure and fulfillment instability." />
              <Card title="Trust Decay" text="Buyer sentiment, INR activity, refund drift, payout friction and support routing changes." />
              <Card title="Operational Fingerprint" text="SKU churn, source dependency, fulfillment gaps and marketplace pattern similarity." />
              <Card title="Enforcement Similarity" text="Compares current behavior to known pre-review and pre-restriction patterns." />
              <Card title="Action Layer" text="Gives sellers direct actions before damage reaches account health or payout systems." />
            </div>
          </div>
        </section>

        <section id="moat" className="px-6 py-24 bg-zinc-950 border-t border-zinc-900">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <Kicker text="Why This Is Hard To Copy" />
              <h2 className="mt-5 text-4xl md:text-5xl font-black">
                The Moat Is Not The Website. The Moat Is The Intelligence Layer.
              </h2>
              <p className="mt-7 text-zinc-400 text-lg leading-relaxed">
                A landing page can be copied. A real marketplace risk agent cannot. The defensibility comes from proprietary signal definitions, seller behavior history, outcome tracking, enforcement pattern memory and better recommendations over time.
              </p>
            </div>

            <div className="grid gap-4">
              <MoatItem title="Private Risk Taxonomy" text="Your own classification of marketplace trust decay patterns." />
              <MoatItem title="Seller Outcome Memory" text="Every scan teaches what happened next and which action helped." />
              <MoatItem title="Cross Marketplace Radar" text="Detects changes across eBay, Amazon, Walmart, SHEIN and TikTok Shop." />
              <MoatItem title="Agent Playbooks" text="The product becomes a decision engine, not another seller dashboard." />
            </div>
          </div>
        </section>

        <section className="px-6 py-20 border-t border-zinc-900 bg-black">
          <div className="max-w-7xl mx-auto text-center">
            <Kicker text="Marketplaces We Monitor" />
            <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-4">
              {["eBay", "Amazon", "Walmart", "SHEIN", "TikTok Shop"].map((item) => (
                <div key={item} className="rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-7 text-xl font-black text-zinc-300 hover:border-red-500/50 transition">
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
            href={`mailto:intel@shadowscore.io?subject=${mailSubject}&body=${mailBody}`}
            className="inline-block mt-10 bg-red-600 hover:bg-red-500 transition rounded-2xl px-10 py-5 font-black text-lg shadow-xl shadow-red-900/30"
          >
            Request Private Risk Audit
          </a>

          <div className="mt-12 text-zinc-600 text-sm">
            ShadowScore © 2026 · Marketplace Risk Intelligence
          </div>
        </section>
      </div>

      {scanOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-[32px] p-7 shadow-2xl shadow-red-950/40">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-red-400 text-sm font-bold tracking-[0.25em] uppercase">
                  ShadowScore Scan
                </div>
                <h3 className="mt-3 text-3xl font-black">Private Audit Required</h3>
              </div>
              <button onClick={() => setScanOpen(false)} className="text-zinc-500 hover:text-white">
                ✕
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-black border border-zinc-800 p-5">
              <div className="text-zinc-500 text-sm">Store URL</div>
              <div className="mt-2 text-zinc-200 break-all">
                {storeUrl || "No URL entered yet"}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Progress label="Tracking Exposure" value="78%" />
              <Progress label="Marketplace Trust Drift" value="64%" />
              <Progress label="Enforcement Similarity" value="71%" />
            </div>

            <p className="mt-6 text-zinc-400 leading-relaxed">
              Automated public scanning is limited during early access. Send the store URL and receive a private risk review.
            </p>

            <a
              href={`mailto:intel@shadowscore.io?subject=${mailSubject}&body=${mailBody}`}
              className="block mt-6 text-center bg-red-600 hover:bg-red-500 rounded-2xl px-7 py-4 font-black"
            >
              Send Store For Review
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-15 h-15">
        <div className="absolute inset-0 rounded-2xl bg-red-600/20 blur-xl" />
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-900/30">
          <div className="text-3xl font-black text-white">S</div>
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
  );
}

function RiskTerminal() {
  return (
    <div className="bg-zinc-950/95 border border-zinc-800 rounded-[32px] p-6 shadow-2xl shadow-red-950/30">
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
  );
}

function Kicker({ text }: { text: string }) {
  return <div className="text-red-400 uppercase tracking-[0.35em] text-sm font-black">{text}</div>;
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

function Stage({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-black p-7">
      <div className="text-red-500 font-black text-sm">{number}</div>
      <div className="mt-4 text-2xl font-black">{title}</div>
      <div className="mt-4 text-zinc-400 leading-relaxed">{text}</div>
    </div>
  );
}

function MoatItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-black p-6">
      <div className="text-xl font-black">{title}</div>
      <div className="mt-3 text-zinc-400">{text}</div>
    </div>
  );
}

function Progress({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-zinc-400">{label}</span>
        <span className="text-red-400 font-bold">{value}</span>
      </div>
      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
        <div className="h-full bg-red-600 rounded-full" style={{ width: value }} />
      </div>
    </div>
  );
}