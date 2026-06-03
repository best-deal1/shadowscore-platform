"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LEADS_KEY = "shadowscore_leads_v1";

type Lead = {
  id: string;
  createdAt: string;
  marketplace?: string;
  store?: string;
  caseType?: string;
  score?: number;
  scoreLabel?: string;
  clickedWhatsApp?: boolean;
  files?: { name: string; size: number; type: string }[];
  findings?: { title: string; severity: string; points: number }[];
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(LEADS_KEY) || "[]");
    setLeads(data);
  }, []);

  const clearLeads = () => {
    localStorage.removeItem(LEADS_KEY);
    setLeads([]);
  };

  const exportCsv = () => {
    const header = ["createdAt", "marketplace", "store", "caseType", "score", "scoreLabel", "clickedWhatsApp", "files", "findings"];
    const rows = leads.map((lead) => [
      lead.createdAt,
      lead.marketplace || "",
      lead.store || "",
      lead.caseType || "",
      String(lead.score ?? ""),
      lead.scoreLabel || "",
      lead.clickedWhatsApp ? "yes" : "no",
      (lead.files || []).map((file) => file.name).join(" | "),
      (lead.findings || []).map((finding) => `${finding.severity}: ${finding.title}`).join(" | "),
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "shadowscore-leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back to ShadowScore</Link>
            <h1 className="mt-5 text-4xl font-black">ShadowScore Leads</h1>
            <p className="mt-3 max-w-3xl text-zinc-400">
              Local lead dashboard for scans created on this browser. For production, connect this flow to Supabase, Firebase or a backend API.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportCsv} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold hover:border-red-400/30">Export CSV</button>
            <button onClick={clearLeads} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500">Clear</button>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {leads.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-zinc-400">
              No scans saved yet. Go to the Intake page, upload evidence and run an assessment.
            </div>
          )}

          {leads.map((lead) => (
            <div key={lead.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="grid gap-4 md:grid-cols-[1fr_120px_160px]">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-red-300">{lead.marketplace || "Marketplace"} · {lead.caseType || "Case"}</div>
                  <div className="mt-3 text-2xl font-bold">{lead.store || "No store provided"}</div>
                  <div className="mt-2 text-sm text-zinc-500">{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ""}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Score</div>
                  <div className="mt-2 text-4xl font-black text-red-300">{lead.score ?? "--"}</div>
                  <div className="mt-1 text-xs text-zinc-500">{lead.scoreLabel}</div>
                </div>
                <div>
                  <div className={`rounded-full border px-4 py-2 text-center text-sm font-bold ${lead.clickedWhatsApp ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-yellow-400/30 bg-yellow-500/10 text-yellow-100"}`}>
                    {lead.clickedWhatsApp ? "WhatsApp Clicked" : "Scan Only"}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <div className="mb-3 text-sm font-bold text-zinc-300">Files</div>
                  <div className="space-y-2 text-sm text-zinc-500">
                    {(lead.files || []).map((file) => <div key={file.name}>• {file.name}</div>)}
                  </div>
                </div>
                <div>
                  <div className="mb-3 text-sm font-bold text-zinc-300">Findings</div>
                  <div className="space-y-2 text-sm text-zinc-500">
                    {(lead.findings || []).map((finding) => <div key={finding.title}>• {finding.severity}: {finding.title}</div>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
