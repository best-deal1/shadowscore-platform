"use client";

import { useMemo, useState } from "react";

type EvidenceFile = {
  name: string;
  size: number;
  type: string;
  status: "Ready";
};

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IntakePage() {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [storeUrl, setStoreUrl] = useState("");
  const [marketplace, setMarketplace] = useState("eBay");

  const readiness = useMemo(() => {
    if (!files.length) return "Waiting for evidence";
    if (files.length < 3) return "Partial evidence received";
    return "Evidence package ready";
  }, [files.length]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;

    const incoming = Array.from(fileList).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || "Unknown",
      status: "Ready" as const,
    }));

    setFiles((current) => [...current, ...incoming]);
  }

  function removeFile(name: string) {
    setFiles((current) => current.filter((file) => file.name !== name));
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <a href="/" className="text-sm text-zinc-500 transition hover:text-white">
            ← Back to ShadowScore
          </a>

          <div className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs text-red-200">
            Private Intelligence Intake
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
          Private access environment. This console is intended for approved reviews only. Detection logic, scoring weights and correlation methods are not exposed publicly.
        </div>

        <section className="mt-12 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="text-sm uppercase tracking-[0.34em] text-red-400">
              ShadowScore Intake
            </div>

            <h1 className="mt-6 text-5xl font-bold leading-tight md:text-6xl">
              Marketplace Intelligence Intake Console
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Upload operational evidence, screenshots, tracking exports and marketplace notices for private exposure analysis.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white">
                What this console produces
              </div>
              <p className="mt-3 leading-7 text-zinc-400">
                A structured intelligence report showing where marketplace exposure may already be building, without exposing the detection method.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_60px_rgba(220,38,38,0.08)]">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <div className="mb-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Marketplace
                </div>
                <select
                  value={marketplace}
                  onChange={(event) => setMarketplace(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-400"
                >
                  <option>eBay</option>
                  <option>Amazon</option>
                  <option>Walmart</option>
                  <option>Etsy</option>
                  <option>TikTok Shop</option>
                  <option>SHEIN</option>
                </select>
              </label>

              <label className="block">
                <div className="mb-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Store URL or seller name
                </div>
                <input
                  value={storeUrl}
                  onChange={(event) => setStoreUrl(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-zinc-700 focus:border-red-400"
                />
              </label>
            </div>

            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(event.dataTransfer.files);
              }}
              className="mt-6 block cursor-pointer rounded-3xl border-2 border-dashed border-white/10 bg-black/40 p-14 text-center transition hover:border-red-400/40 hover:bg-red-500/5"
            >
              <input
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.csv,.pdf,.xlsx,.xls"
                className="hidden"
                onChange={(event) => addFiles(event.target.files)}
              />

              <div className="text-2xl font-semibold">Drop evidence files here</div>
              <div className="mt-3 text-zinc-500">PNG, JPG, CSV, PDF, XLSX</div>
              <div className="mt-5 text-sm text-red-300">Click to select files</div>
            </label>

            <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/45 p-4">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-zinc-600">
                  Intake status
                </div>
                <div className="mt-2 font-semibold text-white">{readiness}</div>
              </div>

              <div className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                {files.length} files
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.28em] text-red-300">
                  Evidence Queue
                </div>
                <h2 className="mt-3 text-2xl font-bold">Submitted Signals</h2>
              </div>

              <a
                href="/analysis"
                className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Start Exposure Analysis
              </a>
            </div>

            <div className="mt-6 space-y-3">
              {files.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/45 p-6 text-zinc-500">
                  No evidence uploaded yet.
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/45 p-4"
                  >
                    <div>
                      <div className="font-medium text-white">{file.name}</div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {formatSize(file.size)} • {file.type}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                        {file.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(file.name)}
                        className="text-sm text-zinc-500 transition hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm uppercase tracking-[0.28em] text-red-300">
                Accepted Evidence
              </div>
              <ul className="mt-5 space-y-3 text-zinc-400">
                <li>Seller Hub screenshots</li>
                <li>Tracking exports</li>
                <li>Account health notices</li>
                <li>Payout screenshots</li>
                <li>Policy warnings</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm uppercase tracking-[0.28em] text-red-300">
                Detection Targets
              </div>
              <ul className="mt-5 space-y-3 text-zinc-400">
                <li>Tracking integrity drift</li>
                <li>Payout exposure</li>
                <li>Operational instability</li>
                <li>Trust decay</li>
                <li>Behavioral anomalies</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
