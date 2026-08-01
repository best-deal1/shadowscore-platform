"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShadowScoreLayout from "@/components/ShadowScoreLayout";
import { getCurrentSession } from "@/lib/auth";
import { getWorkspace, type ShadowScoreReport } from "@/lib/workspace";

export default function ArchiveClient() {
  const router = useRouter();
  const [reports, setReports] = useState<ShadowScoreReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { const session = getCurrentSession(); if (!session) { router.replace("/login?returnTo=%2Farchive"); return; } getWorkspace(session).then((data) => setReports(data.reports.filter((r) => r.reportStatus === "ready" && (r.paymentStatus === "paid" || r.paymentStatus === "admin_comped")))).catch(() => setError("Archive could not be loaded. Refresh the page or contact support.")).finally(() => setLoading(false)); }, [router]);
  return <ShadowScoreLayout><main className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><header className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">Account</p><h1 className="mt-2 text-4xl font-black">Archive</h1><p className="mt-3 text-zinc-400">Find completed Investigations and their Executive Reports.</p></div><Link href="/intake" className="rounded-xl bg-sky-400 px-5 py-3 font-black text-slate-950">Start Investigation</Link></header>
  <nav className="mt-8 flex gap-3 border-b border-white/10 pb-4" aria-label="Account work"><Link className="text-zinc-400 hover:text-white" href="/investigations">Investigations</Link><Link className="font-bold text-white" href="/archive" aria-current="page">Archive</Link></nav>
  {loading && <p className="mt-8" role="status">Loading Archive...</p>}{error && <p className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 p-5" role="alert">{error}</p>}{!loading && !error && reports.length === 0 && <section className="mt-8 rounded-3xl border border-white/10 p-8"><h2 className="text-2xl font-black">Archive is empty</h2><p className="mt-3 text-zinc-400">A completed Investigation appears here when its Executive Report is ready.</p></section>}
  <div className="mt-8 grid gap-4">{reports.map((report) => <article key={report.reportId} className="rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:flex sm:items-center sm:justify-between"><div><h2 className="text-xl font-black">{report.entity}</h2><p className="mt-2 text-sm text-zinc-400">Investigation reference <span className="font-mono text-white">{report.intakeId || report.reportId}</span></p><p className="mt-1 text-sm text-zinc-400">Report ready · {new Date(report.readyAt || report.createdAt).toLocaleString()}</p></div><Link href={`/reports/${report.reportId}`} className="mt-5 inline-block rounded-xl bg-white px-4 py-3 font-bold text-black sm:mt-0">View Executive Report</Link></article>)}</div></main></ShadowScoreLayout>;
}
