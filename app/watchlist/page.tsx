/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { getCurrentSession } from "../../lib/auth";
import type { WebsiteWatchlistEntry } from "../../lib/websiteIntelligence/watchlist";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The watchlist request failed.");
  return body;
}
export default function WatchlistPage() {
  const [items, setItems] = useState<WebsiteWatchlistEntry[]>([]);
  const [domain, setDomain] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const signedIn = Boolean(getCurrentSession()); setAuthenticated(signedIn);
    if (!signedIn) { setLoading(false); return; }
    api<{items: WebsiteWatchlistEntry[]}>("/api/website-watchlist").then(({ items }) => setItems(items)).catch((cause) => setError(cause.message)).finally(() => setLoading(false));
  }, []);
  async function add(event: FormEvent) {
    event.preventDefault(); setPending("add"); setError("");
    try { const { item } = await api<{item: WebsiteWatchlistEntry}>("/api/website-watchlist", { method: "POST", body: JSON.stringify({ domain }) }); setItems((current) => [item, ...current]); setDomain(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add the domain."); }
    finally { setPending(""); }
  }
  async function change(item: WebsiteWatchlistEntry, action: "pause" | "resume" | "remove") {
    setPending(item.id); setError("");
    try {
      if (action === "remove") { await api(`/api/website-watchlist/${encodeURIComponent(item.id)}`, { method: "DELETE" }); setItems((current) => current.filter(({ id }) => id !== item.id)); }
      else { const status = action === "pause" ? "Paused" : "Active"; await api(`/api/website-watchlist/${encodeURIComponent(item.id)}`, { method: "PATCH", body: JSON.stringify({ status }) }); setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status } : entry)); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update the domain."); }
    finally { setPending(""); }
  }
  return <ShadowScoreLayout><section className="mx-auto max-w-6xl px-6 py-16"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.3em] text-red-300">Website Intelligence</p><h1 className="mt-4 text-4xl font-black">Website Watchlist</h1><p className="mt-3 text-zinc-400">Manage the domains selected for ongoing review.</p></div><Link className="font-bold text-red-300" href="/alerts">View alerts</Link></div>
  {!authenticated && !loading ? <p className="mt-10 rounded-2xl border border-white/10 p-6">Sign in to manage a website watchlist.</p> : <><form onSubmit={add} className="mt-10 flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[.035] p-5 sm:flex-row"><label className="sr-only" htmlFor="domain">Domain</label><input id="domain" disabled={Boolean(pending)} value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" className="min-h-12 flex-1 rounded-xl border border-white/15 bg-black px-4"/><button type="submit" disabled={Boolean(pending)} className="rounded-xl bg-red-600 px-6 py-3 font-black disabled:opacity-50">{pending === "add" ? "Adding..." : "Add domain"}</button></form>{error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
  {loading ? <p className="mt-8 rounded-2xl border border-white/10 p-8 text-zinc-400">Loading watchlist...</p> : <div className="mt-8 overflow-x-auto rounded-3xl border border-white/10"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-white/[.04] text-zinc-400"><tr>{["Domain","Status","Last scanned","Risk","Changes","Next scan","Actions"].map((label) => <th className="p-4" key={label}>{label}</th>)}</tr></thead><tbody>{items.map((item) => <tr className="border-t border-white/10" key={item.id}><td className="p-4 font-bold">{item.domain}</td><td>{item.status}</td><td>{item.lastScannedAt || "Not scanned"}</td><td>{item.latestRiskLevel}</td><td>{item.latestChangeCount}</td><td>{item.nextScanAt || "Not scheduled"}</td><td className="space-x-3"><button type="submit" disabled={Boolean(pending)} onClick={() => change(item, item.status === "Active" ? "pause" : "resume")} className="text-red-300 disabled:opacity-50">{item.status === "Active" ? "Pause" : "Resume"}</button><button type="submit" disabled={Boolean(pending)} onClick={() => change(item, "remove")} className="text-zinc-400 disabled:opacity-50">Remove</button></td></tr>)}</tbody></table>{items.length === 0 && <p className="p-8 text-zinc-400">Add a domain to start the watchlist.</p>}</div>}</>}</section></ShadowScoreLayout>;
}
