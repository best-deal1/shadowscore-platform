"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ShadowScoreLayout from "./components/ShadowScoreLayout";

const scanSteps = ["Identifying target", "Classifying input", "Collecting public evidence", "Building business profile", "Generating business narrative"];
const placeholderExamples = ["https://example.com", "company.com", "support@company.com", "Best Buy", "best.deal.best.price (eBay)"];
const quickActions = ["Website", "Business", "Email", "Phone", "Marketplace Seller"];
const tryExamples = ["apple.com", "ksp.co.il", "support@stripe.com"];

export default function Home() {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % placeholderExamples.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, []);

  function startScan(nextTarget = target) {
    if (isAnalyzing) return;
    const normalizedTarget = nextTarget.trim();
    setTarget(normalizedTarget);
    setIsAnalyzing(true);
    const query = normalizedTarget ? `?target=${encodeURIComponent(normalizedTarget)}&mode=website` : "";
    window.setTimeout(() => router.push(`/intake${query}`), 1700);
  }

  return (
    <ShadowScoreLayout>
      <section className="relative min-h-[calc(100vh-96px)] overflow-hidden px-5 py-12 sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(220,38,38,0.26),transparent_34%),linear-gradient(180deg,rgba(127,29,29,0.08),transparent_48%)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-180px)] max-w-7xl flex-col items-center justify-center text-center">
          <div className="mb-5 inline-flex rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-200">
            ShadowScore Trust Intelligence
          </div>
          <h1 className="max-w-5xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            Search any business before you trust it.
          </h1>

          <div className="mt-10 w-full max-w-5xl rounded-[34px] border border-red-400/25 bg-black/75 p-4 shadow-[0_0_90px_rgba(220,38,38,0.28)] backdrop-blur-xl sm:p-6">
            <div className="text-lg font-black text-white sm:text-2xl">
              Search any business, website, email or marketplace seller.
            </div>
            <div className="mt-5 flex flex-col gap-3 rounded-[28px] border border-white/15 bg-white/[0.06] p-3 sm:flex-row">
              <input
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && startScan()}
                className="min-h-16 flex-1 rounded-2xl border border-white/10 bg-white px-5 text-xl font-black text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-red-300 focus:ring-4 focus:ring-red-500/25 sm:min-h-20 sm:px-7 sm:text-3xl"
                placeholder={placeholderExamples[placeholderIndex]}
                aria-label="Search target"
              />
              <button
                onClick={() => startScan()}
                className="min-h-16 rounded-2xl bg-red-600 px-8 text-base font-black uppercase tracking-[0.14em] text-white shadow-[0_0_34px_rgba(220,38,38,0.4)] hover:bg-red-500 sm:min-h-20"
              >
                Analyze Now
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setTarget(action === "Email" ? "support@company.com" : action === "Marketplace Seller" ? "best.deal.best.price" : action === "Website" ? "https://example.com" : "")}
                  className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-bold text-zinc-200 hover:border-red-300/50 hover:bg-red-500/15"
                >
                  {action}
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-400">
              <span className="font-bold text-zinc-200">Try:</span>
              {tryExamples.map((example) => (
                <button key={example} type="button" onClick={() => startScan(example)} className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1.5 font-bold text-red-100 hover:bg-red-500/20">
                  {example}
                </button>
              ))}
            </div>
          </div>

          {isAnalyzing && (
            <div className="mt-6 w-full max-w-3xl rounded-3xl border border-red-400/20 bg-red-500/[0.08] p-5 text-left">
              <div className="space-y-3">
                {scanSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 text-sm font-bold text-zinc-200 sm:text-base">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/15 text-emerald-200">✓</span>
                    <span className="animate-pulse" style={{ animationDelay: `${index * 120}ms` }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
