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

const WHATSAPP_AUDIT_URL = "https://call.whatsapp.com/video/Rmh08tVtcrjG5ToEGoZ71U";

export default function Home() {
  const [storeUrl, setStoreUrl] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  const mailSubject = encodeURIComponent("ShadowScore Private Risk Audit");
  const mailBody = encodeURIComponent(
    `Hi ShadowScore,\n\nI want a private marketplace risk audit.\n\nStore URL:\n${storeUrl || "Paste store URL here"}\n\nMarketplace:\n\nMain concern:\n\n`
  );

  const mailHref = `mailto:intel@shadowscore.io?subject=${mailSubject}&body=${mailBody}`;

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.26),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(127,29,29,0.22),transparent_35%)]" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="fixed inset-x-0 top-0 h-28 bg-gradient-to-b from-black via-black/80 to-transparent" />

      <div className="relative">
        <Header mailHref={mailHref} />

        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 lg:grid-cols-2 lg:pb-20 lg:pt-16">
          <div>
            <Badge text="Marketplace Risk Intelligence" />

            <h1 className="mt-7 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Know Your Risk Before The Marketplace Does
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              ShadowScore detects seller trust decay before suspensions, payout holds and account reviews happen.
            </p>

            <div className="mt-9 max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950/90 p-4 shadow-2xl shadow-red-950/30">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  className="flex-1 rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
                  placeholder="Paste eBay, Amazon, Walmart, SHEIN or TikTok Shop URL"
                />
                <button
                  onClick={() => setScanOpen(true)}
                  className="rounded-2xl bg-red-600 px-7 py-4 text-center font-black transition hover:bg-red-500 hover:shadow-[0_0_35px_rgba(220,38,38,0.45)]"
                >
                  Scan My Store
                </button>
              </div>

              <div className="mt-3 text-xs text-zinc-500">
                First audit includes 30 day Risk Protection. Early access audits are reviewed manually.
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-4">
              <a
                href={mailHref}
                className="rounded-2xl bg-red-600 px-7 py-4 font-black transition hover:bg-red-500 hover:shadow-[0_0_35px_rgba(220,38,38,0.45)]"
              >
                Request Private Audit
              </a>

              <a
                href={WHATSAPP_AUDIT_URL}
                target="_blank"
                className="rounded-2xl border border-zinc-700 bg-zinc-950/70 px-7 py-4 font-semibold transition hover:border-red-500 hover:text-white"
              >
                Talk To Risk Agent
              </a>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              <MiniProof value="30 Days" label="Risk Protection" />
              <MiniProof value="$299" label="First Audit" />
              <MiniProof value="5+" label="Marketplaces" />
            </div>
          </div>

          <RiskTerminal />
        </section>

        <LiveIntelligence />

        <section id="agent" className="border-t border-zinc-900 bg-zinc-950/90 px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <Kicker text="The Agent" />
            <h2 className="mt-5 max-w-4xl text-4xl font-black md:text-6xl">
              A Seller Defense Agent, Not Another Dashboard
            </h2>

            <div className="mt-12 grid gap-5 md:grid-cols-4">
              <Stage number="01" title="Observe" text="Reads tracking quality, seller velocity, claims, refunds and buyer signals." />
              <Stage number="02" title="Score" text="Creates a hidden trust profile and detects marketplace exposure." />
              <Stage number="03" title="Warn" text="Alerts before risk becomes enforcement, payout hold or seller review." />
              <Stage number="04" title="Prepare" text="Tells sellers which data to strengthen before the account is exposed." />
            </div>
          </div>
        </section>

        <section id="signals" className="border-t border-zinc-900 px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <Kicker text="Signal Engine" />
            <h2 className="mt-5 max-w-4xl text-4xl font-black md:text-5xl">
              Marketplace Risk Is Not One Event. It Is A Pattern.
            </h2>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <Card title="Tracking Integrity" text="Late uploads, TBA exposure, invalid scans, carrier mismatch and weak proof of delivery." icon="01" />
              <Card title="Velocity Risk" text="Sudden sales growth, category spikes, new account pressure and fulfillment instability." icon="02" />
              <Card title="Trust Decay" text="Buyer sentiment, INR activity, refund drift, payout friction and support routing changes." icon="03" />
              <Card title="Operational Fingerprint" text="SKU churn, source dependency, fulfillment gaps and marketplace pattern similarity." icon="04" />
              <Card title="Enforcement Similarity" text="Compares behavior to known pre-review and pre-restriction patterns." icon="05" />
              <Card title="Action Layer" text="Direct actions before damage reaches account health or payout systems." icon="06" />
            </div>
          </div>
        </section>

        <section id="guarantee" className="border-t border-zinc-900 bg-black px-5 py-20">
          <div className="mx-auto max-w-7xl rounded-[36px] border border-red-500/30 bg-red-950/10 p-8 shadow-2xl shadow-red-950/30 md:p-12">
            <Kicker text="Risk Protection Guarantee" />
            <h2 className="mt-5 max-w-4xl text-4xl font-black md:text-5xl">
              First Audit Protected For 30 Days
            </h2>
            <p className="mt-6 max-w-4xl text-lg leading-relaxed text-zinc-300">
              If a new marketplace restriction or payout review occurs within 30 days of your first audit, and ShadowScore failed to identify elevated exposure signals, we refund the audit fee.
            </p>
            <p className="mt-4 text-sm text-zinc-500">
              Applies to first-time audits only. Existing warnings must be disclosed. Not valid if recommended actions are ignored.
            </p>
          </div>
        </section>

        <section id="pricing" className="border-t border-zinc-900 bg-zinc-950 px-5 py-20">
          <div className="mx-auto max-w-7xl">
            <Kicker text="Pricing" />
            <h2 className="mt-5 text-4xl font-black md:text-5xl">
              Built For Sellers Who Cannot Afford To Lose The Account
            </h2>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
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

        <MarketplaceLogos />

        <FAQ />

        <section id="contact" className="border-t border-red-950/30 bg-gradient-to-b from-black to-zinc-950 px-5 py-24 text-center">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-400">
              Contact ShadowScore
            </div>

            <h2 className="text-4xl font-black text-white md:text-6xl">
              Speak With The Risk Agent
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Private early access reviews for marketplace sellers, agencies and multi-store operators.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <a
                href={WHATSAPP_AUDIT_URL}
                target="_blank"
                className="rounded-2xl bg-red-600 px-10 py-5 text-lg font-bold text-white transition hover:bg-red-500 hover:shadow-[0_0_40px_rgba(255,0,0,0.45)]"
              >
                Open WhatsApp Audit Call
              </a>

              <a
                href={mailHref}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-10 py-5 text-lg font-semibold text-zinc-300 transition hover:border-red-500/40 hover:text-white"
              >
                intel@shadowscore.io
              </a>
            </div>

            <div className="mt-12 text-sm text-zinc-600">
              ShadowScore © 2026 · Marketplace Risk Intelligence
            </div>
          </div>
        </section>
      </div>

      {scanOpen && <ScanModal storeUrl={storeUrl} onClose={() => setScanOpen(false)} href={mailHref} />}
    </main>
  );
}

function Header({ mailHref }: { mailHref: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-red-950/40 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <a href="#contact" className="flex items-center gap-3 transition hover:scale-[1.02]">
          <LogoMark />
          <div>
            <div className="text-xl font-black tracking-tight text-white md:text-3xl">
              Shadow<span className="text-red-500">Score</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-500 md:text-[11px] md:tracking-[0.35em]">
              Risk Intelligence
            </div>
          </div>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a href="#signals" className="hover:text-white">Signals</a>
          <a href="#agent" className="hover:text-white">Agent</a>
          <a href="#guarantee" className="hover:text-white">Guarantee</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="#contact" className="hover:text-white">Contact</a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={WHATSAPP_AUDIT_URL}
            target="_blank"
            className="hidden rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-white transition hover:border-red-500 md:block"
          >
            WhatsApp
          </a>
          <a
            href={mailHref}
            className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.45)] md:px-6"
          >
            Get Audit
          </a>
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-2xl bg-red-600/30 blur-xl" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/60 bg-gradient-to-br from-zinc-800 to-black shadow-lg shadow-red-900/40 md:h-14 md:w-14">
        <div className="text-2xl font-black text-white md:text-3xl">S</div>
      </div>
    </div>
  );
}

function RiskTerminal() {
  return (
    <div className="rounded-[32px] border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-red-950/30 md:p-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <div className="text-sm text-zinc-500">Live Risk Terminal</div>
          <div className="mt-1 text-2xl font-black">ShadowScore Monitor</div>
        </div>
        <div className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          Elevated
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
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
      <div className="mx-auto max-w-7xl rounded-[32px] border border-zinc-800 bg-zinc-950/80 p-5 shadow-2xl shadow-red-950/20 md:p-6">
        <div className="text-center">
          <Kicker text="ShadowScore Live Intelligence" />
          <div className="mt-2 text-sm text-zinc-500">Network metrics shown for early access demonstration</div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-6">
          {stats.map(([value, label, delta]) => (
            <div key={label} className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div className="text-2xl font-black md:text-3xl">{value}</div>
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

function MarketplaceLogos() {
  const platforms = [
    { name: "eBay", style: "text-white" },
    { name: "Amazon", style: "text-white" },
    { name: "Walmart", style: "text-white" },
    { name: "SHEIN", style: "text-white tracking-[0.18em]" },
    { name: "TikTok Shop", style: "text-white" },
  ];

  return (
    <section className="border-t border-zinc-900 bg-black px-5 py-20">
      <div className="mx-auto max-w-7xl text-center">
        <Kicker text="Marketplaces We Monitor" />

        <div className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-5">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="group rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-black p-8 text-center transition hover:border-red-500/30 hover:shadow-[0_0_40px_rgba(255,0,0,0.15)]"
            >
              <div className={`text-2xl font-black tracking-tight transition group-hover:text-red-400 md:text-3xl ${platform.style}`}>
                {platform.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScanModal({ storeUrl, onClose, href }: { storeUrl: string; onClose: () => void; href: string }) {
  const scanSteps = useMemo(
    () => [
      "Reading marketplace signals",
      "Checking tracking exposure",
      "Analyzing velocity drift",
      "Comparing enforcement similarity",
      "Preparing private audit request",
    ],
    []
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[32px] border border-zinc-800 bg-zinc-950 p-7 shadow-2xl shadow-red-950/40">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.25em] text-red-400">ShadowScore Scan</div>
            <h3 className="mt-3 text-3xl font-black">Private Audit Required</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
          <div className="text-sm text-zinc-500">Store URL</div>
          <div className="mt-2 break-all text-zinc-200">{storeUrl || "No URL entered yet"}</div>
        </div>

        <div className="mt-6 space-y-3">
          {scanSteps.map((step) => (
            <div key={step} className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              {step}
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <Progress label="Tracking Exposure" value="78%" />
          <Progress label="Marketplace Trust Drift" value="64%" />
          <Progress label="Enforcement Similarity" value="71%" />
        </div>

        <p className="mt-6 leading-relaxed text-zinc-400">
          Automated public scanning is limited during early access. Send the store URL and receive a private risk review.
        </p>

        <a href={href} className="mt-6 block rounded-2xl bg-red-600 px-7 py-4 text-center font-black hover:bg-red-500">
          Send Store For Review
        </a>
      </div>
    </div>
  );
}

function FAQ() {
  return (
    <section className="border-t border-zinc-900 bg-zinc-950 px-5 py-20">
      <div className="mx-auto max-w-5xl">
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
      <div className="mt-3 leading-relaxed text-zinc-400">{a}</div>
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
      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
      {text}
    </div>
  );
}

function Kicker({ text }: { text: string }) {
  return <div className="text-sm font-black uppercase tracking-[0.35em] text-red-400">{text}</div>;
}

function Metric({ title, value, status, color }: { title: string; value: string; status: string; color: string }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-black p-4 md:p-5">
      <div className="text-sm text-zinc-500">{title}</div>
      <div className={`mt-3 text-3xl font-black md:text-4xl ${color}`}>{value}</div>
      <div className="mt-2 text-sm text-zinc-400">{status}</div>
    </div>
  );
}

function Alert({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-5">
      <div className="font-bold text-red-400">{title}</div>
      <div className="mt-2 text-sm text-zinc-500">{text}</div>
    </div>
  );
}

function Card({ title, text, icon }: { title: string; text: string; icon: string }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-black p-8 transition hover:border-red-500/50">
      <div className="text-sm font-black text-red-500">{icon}</div>
      <div className="mt-4 text-2xl font-black">{title}</div>
      <div className="mt-4 leading-relaxed text-zinc-400">{text}</div>
    </div>
  );
}

function Stage({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-black p-7">
      <div className="text-sm font-black text-red-500">{number}</div>
      <div className="mt-4 text-2xl font-black">{title}</div>
      <div className="mt-4 leading-relaxed text-zinc-400">{text}</div>
    </div>
  );
}

function Plan({ name, price, note, text, features, cta, href, highlighted = false }: PlanProps) {
  return (
    <div className={`rounded-[32px] border p-8 ${highlighted ? "border-red-500 bg-red-950/20 shadow-2xl shadow-red-950/30" : "border-zinc-800 bg-black"}`}>
      <div className="text-2xl font-black">{name}</div>
      <div className="mt-6 flex items-end gap-2">
        <div className="text-5xl font-black">{price}</div>
        <div className="mb-2 text-zinc-500">{note}</div>
      </div>
      <p className="mt-5 leading-relaxed text-zinc-400">{text}</p>
      <div className="mt-7 space-y-3">
        {features.map((f) => (
          <div key={f} className="text-zinc-300">✓ {f}</div>
        ))}
      </div>
      <a href={href} className={`mt-8 block rounded-2xl px-6 py-4 text-center font-black ${highlighted ? "bg-red-600 hover:bg-red-500" : "border border-zinc-700 hover:border-red-500"}`}>
        {cta}
      </a>
    </div>
  );
}

function Progress({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="font-bold text-red-400">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
        <div className="h-full rounded-full bg-red-600" style={{ width: value }} />
      </div>
    </div>
  );
}
