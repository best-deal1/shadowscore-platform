"use client";

import { useMemo, useState } from "react";

type PlanProps = {
  name: string;
  price: string;
  note: string;
  text: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
};

export default function Home() {
  const [storeUrl, setStoreUrl] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  const mailSubject = encodeURIComponent("ShadowScore Private Risk Audit");
  const mailBody = encodeURIComponent(
    `Hi ShadowScore,\n\nI want a private marketplace risk audit.\n\nStore URL:\n${storeUrl || "Paste store URL here"}\n\nMarketplace:\n\nMain concern:\n\n`
  );

  const mailHref = `mailto:intel@shadowscore.io?subject=${mailSubject}&body=${mailBody}`;

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(127,29,29,0.22),transparent_36%)]" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative">
        <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-black/70 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
            <Logo />
            <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
              <a href="#agent" className="hover:text-white">Agent</a>
              <a href="#signals" className="hover:text-white">Signals</a>
              <a href="#guarantee" className="hover:text-white">Guarantee</a>
              <a href="#pricing" className="hover:text-white">Pricing</a>
            </nav>
            <a href={mailHref} className="hidden md:block bg-red-600 hover:bg-red-500 rounded-2xl px-5 py-3 font-black text-sm transition">
              Get Audit
            </a>
          </div>
        </header>

        <section className="max-w-7xl mx-auto px-5 pt-14 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge text="Marketplace Risk Intelligence" />

            <h1 className="mt-7 text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
              Know Your Risk Before The Marketplace Does
            </h1>

            <p className="mt-7 text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl">
              ShadowScore detects seller trust decay before suspensions, payout holds and account reviews happen.
            </p>

            <div className="mt-9 bg-zinc-950/90 border border-zinc-800 rounded-3xl p-4 max-w-2xl shadow-2xl shadow-red-950/30">
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
                First audit includes 30 day Risk Protection. Terms apply.
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-4">
              <a href={mailHref} className="bg-red-600 hover:bg-red-500 rounded-2xl px-7 py-4 font-black transition">
                Request Private Audit
              </a>
              <a href="#pricing" className="border border-zinc-700 hover:border-red-500 rounded-2xl px-7 py-4 font-semibold bg-zinc-950/60">
                View Pricing
              </a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 max-w-2xl">
              <MiniProof value="30 Days" label="Risk Protection" />
              <MiniProof value="$299" label="First Audit" />
              <MiniProof value="5+" label="Marketplaces" />
            </div>
          </div>

          <RiskTerminal />
        </section>

        <LiveIntelligence />

        <section id="agent" className="border-t border-zinc-900 bg-zinc-950/90 px-5 py-20">
          <div className="max-w-7xl mx-auto">
            <Kicker text="The Agent" />
            <h2 className="mt-5 text-4xl md:text-6xl font-black max-w-4xl">
              A Seller Defense Agent, Not Another Dashboard
            </h2>

            <div className="mt-12 grid md:grid-cols-4 gap-5">
              <Stage number="01" title="Observe" text="Reads tracking quality, seller velocity, claims, refunds and buyer signals." />
              <Stage number="02" title="Score" text="Creates a hidden trust profile and detects marketplace exposure." />
              <Stage number="03" title="Warn" text="Alerts before risk becomes enforcement, payout hold or seller review." />
              <Stage number="04" title="Prepare" text="Tells sellers which data to strengthen before the account is exposed." />
            </div>
          </div>
        </section>

        <section id="signals" className="px-5 py-20 border-t border-zinc-900">
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
              <Card title="Enforcement Similarity" text="Compares behavior to known pre-review and pre-restriction patterns." />
              <Card title="Action Layer" text="Direct actions before damage reaches account health or payout systems." />
            </div>
          </div>
        </section>

        <section id="guarantee" className="px-5 py-20 bg-black border-t border-zinc-900">
          <div className="max-w-7xl mx-auto rounded-[36px] border border-red-500/30 bg-red-950/10 p-8 md:p-12 shadow-2xl shadow-red-950/30">
            <Kicker text="Risk Protection Guarantee" />
            <h2 className="mt-5 text-4xl md:text-5xl font-black max-w-4xl">
              First Audit Protected For 30 Days
            </h2>
            <p className="mt-6 text-zinc-300 text-lg leading-relaxed max-w-4xl">
              If a new marketplace restriction or payout review occurs within 30 days of your first audit, and ShadowScore failed to identify elevated exposure signals, we refund the audit fee.
            </p>
            <p className="mt-4 text-zinc-500 text-sm">
              Applies to first-time audits only. Existing warnings must be disclosed. Not valid if recommended actions are ignored.
            </p>
          </div>
        </section>

        <section id="pricing" className="px-5 py-20 bg-zinc-950 border-t border-zinc-900">
          <div className="max-w-7xl mx-auto">
            <Kicker text="Pricing" />
            <h2 className="mt-5 text-4xl md:text-5xl font-black">
              Built For Sellers Who Cannot Afford To Lose The Account
            </h2>

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <Plan
                name="Risk Audit"
                price="$299"
                note="one time"
                text="Private risk review for one marketplace account."
                features={["Store URL review", "Risk signal breakdown", "30 day outlook", "Action plan", "30 day protection"]}
                cta="Request Audit"
                href={mailHref}
              />
              <Plan
                name="Pro Monitor"
                price="$499"
                note="per month"
                text="Monthly monitoring for active operators."
                features={["Weekly risk review", "Tracking exposure analysis", "Velocity watch", "Priority alerts", "Monthly action plan"]}
                cta="Start Pro"
                highlighted
                href={mailHref}
              />
              <Plan
                name="Agency"
                price="$1,500+"
                note="per month"
                text="For agencies and multi-store operators."
                features={["Multi-account coverage", "Private playbooks", "Cross-marketplace radar", "Founder access", "Custom reporting"]}
                cta="Talk To Us"
                href={mailHref}
              />
            </div>
          </div>
        </section>

        <section className="px-5 py-20 border-t border-zinc-900 bg-black">
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

        <FAQ />

        <section id="contact" className="px-5 py-24 bg-gradient-to-b from-zinc-950 to-black border-t border-zinc-900 text-center">
          <h2 className="text-4xl md:text-6xl font-black">
            Start With A Private Risk Audit
          </h2>
          <p className="mt-6 text-zinc-400 text-xl max-w-2xl mx-auto">
            Early access is open for sellers, agencies and multi-store operators.
          </p>

          <a href={mailHref} className="inline-block mt-10 bg-red-600 hover:bg-red-500 transition rounded-2xl px-10 py-5 font-black text-lg shadow-xl shadow-red-900/30">
            Request Private Risk Audit
          </a>

          <div className="mt-12 text-zinc-600 text-sm">
            ShadowScore © 2026 · Marketplace Risk Intelligence
          </div>
        </section>
      </div>

      {scanOpen && <ScanModal storeUrl={storeUrl} onClose={() => setScanOpen(false)} href={mailHref} />}
    </main>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-red-600/30 blur-xl" />
        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-zinc-700 to-black border border-red-500/60 flex items-center justify-center shadow-lg shadow-red-900/40">
          <div className="text-2xl md:text-3xl font-black text-white">S</div>
        </div>
      </div>
      <div>
        <div className="text-xl md:text-2xl font-black tracking-tight">
          Shadow<span className="text-red-500">Score</span>
        </div>
        <div className="text-[10px] md:text-xs tracking-[0.28em] text-zinc-500 uppercase">
          Risk Intelligence
        </div>
      </div>
    </div>
  );
}

function RiskTerminal() {
  return (
    <div className="bg-zinc-950/95 border border-zinc-800 rounded-[32px] p-5 md:p-6 shadow-2xl shadow-red-950/30">
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

function LiveIntelligence() {
  const stats = [
    ["12,842", "Stores Scanned", "+18.6% today"],
    ["2,471", "High Risk Detected", "+23.4% today"],
    ["1,358", "Alerts Sent", "+21.7% today"],
    ["972", "Sellers Protected", "+19.2% today"],
    ["5,683", "Payouts Protected", "+16.8% today"],
    ["$3.27M", "Revenue Protected", "+22.1% today"],
  ];

  return (
    <section className="px-5 pb-20">
      <div className="max-w-7xl mx-auto rounded-[32px] border border-zinc-800 bg-zinc-950/80 p-5 md:p-6 shadow-2xl shadow-red-950/20">
        <div className="text-center">
          <Kicker text="ShadowScore Live Intelligence" />
          <div className="mt-2 text-zinc-500 text-sm">Network metrics shown for early access demonstration</div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-6 gap-4">
          {stats.map(([value, label, delta]) => (
            <div key={label} className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div className="text-2xl md:text-3xl font-black">{value}</div>
              <div className="mt-2 text-sm text-zinc-400">{label}</div>
              <div className="mt-3 text-xs text-green-400">{delta}</div>
              <div className="mt-4 h-10 rounded-xl bg-[linear-gradient(90deg,transparent,rgba(220,38,38,0.35),transparent)]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScanModal({ storeUrl, onClose, href }: { storeUrl: string; onClose: () => void; href: string }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-[32px] p-7 shadow-2xl shadow-red-950/40">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-red-400 text-sm font-black tracking-[0.25em] uppercase">ShadowScore Scan</div>
            <h3 className="mt-3 text-3xl font-black">Private Audit Required</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="mt-6 rounded-2xl bg-black border border-zinc-800 p-5">
          <div className="text-zinc-500 text-sm">Store URL</div>
          <div className="mt-2 text-zinc-200 break-all">{storeUrl || "No URL entered yet"}</div>
        </div>

        <div className="mt-6 space-y-3">
          <Progress label="Tracking Exposure" value="78%" />
          <Progress label="Marketplace Trust Drift" value="64%" />
          <Progress label="Enforcement Similarity" value="71%" />
        </div>

        <p className="mt-6 text-zinc-400 leading-relaxed">
          Automated public scanning is limited during early access. Send the store URL and receive a private risk review.
        </p>

        <a href={href} className="block mt-6 text-center bg-red-600 hover:bg-red-500 rounded-2xl px-7 py-4 font-black">
          Send Store For Review
        </a>
      </div>
    </div>
  );
}

function FAQ() {
  return (
    <section className="px-5 py-20 bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-5xl mx-auto">
        <Kicker text="FAQ" />
        <div className="mt-8 grid gap-4">
          <FAQItem q="Is ShadowScore a reinstatement service?" a="No. ShadowScore is built to detect risk before enforcement. If you already received MC011 or a major restriction, you may already be late." />
          <FAQItem q="Do you need my password?" a="No. The first audit can start with a store URL, screenshots and exports. No marketplace password is required." />
          <FAQItem q="Is the 30 day protection available forever?" a="No. It applies only to the first paid audit. Future scans do not include the first audit guarantee." />
          <FAQItem q="Which sellers is this for?" a="High-volume sellers, dropshippers, agencies, Walmart sellers, eBay sellers, Amazon sellers and operators who cannot afford sudden restrictions." />
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-black p-6">
      <div className="text-xl font-black">{q}</div>
      <div className="mt-3 text-zinc-400 leading-relaxed">{a}</div>
    </div>
  );
}

function MiniProof({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="text-xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      {text}
    </div>
  );
}

function Kicker({ text }: { text: string }) {
  return <div className="text-red-400 uppercase tracking-[0.35em] text-sm font-black">{text}</div>;
}

function Metric({ title, value, status, color }: { title: string; value: string; status: string; color: string }) {
  return (
    <div className="bg-black border border-zinc-800 rounded-3xl p-4 md:p-5">
      <div className="text-zinc-500 text-sm">{title}</div>
      <div className={`mt-3 text-3xl md:text-4xl font-black ${color}`}>{value}</div>
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

function Plan({ name, price, note, text, features, cta, href, highlighted = false }: PlanProps) {
  return (
    <div className={`rounded-[32px] border p-8 ${highlighted ? "border-red-500 bg-red-950/20 shadow-2xl shadow-red-950/30" : "border-zinc-800 bg-black"}`}>
      <div className="text-2xl font-black">{name}</div>
      <div className="mt-6 flex items-end gap-2">
        <div className="text-5xl font-black">{price}</div>
        <div className="text-zinc-500 mb-2">{note}</div>
      </div>
      <p className="mt-5 text-zinc-400 leading-relaxed">{text}</p>
      <div className="mt-7 space-y-3">
        {features.map((f) => (
          <div key={f} className="text-zinc-300">✓ {f}</div>
        ))}
      </div>
      <a href={href} className={`block mt-8 text-center rounded-2xl px-6 py-4 font-black ${highlighted ? "bg-red-600 hover:bg-red-500" : "border border-zinc-700 hover:border-red-500"}`}>
        {cta}
      </a>
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