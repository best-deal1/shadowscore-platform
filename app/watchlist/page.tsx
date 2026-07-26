/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import ShadowScoreLayout from "../../components/ShadowScoreLayout";
import { getCurrentSession } from "../../lib/auth";
import { addBrowserWatchlist, listBrowserWatchlist, updateBrowserWatchlist } from "../../lib/websiteIntelligence/browserMonitoring";
import type { WebsiteWatchlistEntry } from "../../lib/websiteIntelligence/watchlist";

export default function WatchlistPage() {
  const [items, setItems] = useState<WebsiteWatchlistEntry[]>([]); const [domain, setDomain] = useState(""); const [error, setError] = useState(""); const [tenant, setTenant] = useState("");
  useEffect(() => { const session = getCurrentSession(); if (session) { setTenant(session.userId); setItems(listBrowserWatchlist(session.userId)); } }, []);
  function add(event: FormEvent) { event.preventDefault(); try { setItems(addBrowserWatchlist(tenant, domain)); setDomain(""); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add the domain."); } }
  function change(id: string, action: "pause" | "resume" | "remove") { setItems(updateBrowserWatchlist(tenant, id, action)); }
  return <ShadowScoreLayout><section className="mx-auto max-w-6xl px-6 py-16"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.3em] text-red-300">Website Intelligence</p><h1 className="mt-4 text-4xl font-black">Website Watchlist</h1><p className="mt-3 text-zinc-400">Manage the domains selected for ongoing review.</p></div><Link className="font-bold text-red-300" href="/alerts">View alerts</Link></div>
  {!tenant ? <p className="mt-10 rounded-2xl border border-white/10 p-6">Sign in to manage a website watchlist.</p> : <><form onSubmit={add} className="mt-10 flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[.035] p-5 sm:flex-row"><label className="sr-only" htmlFor="domain">Domain</label><input id="domain" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" className="min-h-12 flex-1 rounded-xl border border-white/15 bg-black px-4"/><button className="rounded-xl bg-red-600 px-6 py-3 font-black">Add domain</button></form>{error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
  <div className="mt-8 overflow-x-auto rounded-3xl border border-white/10"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-white/[.04] text-zinc-400"><tr>{["Domain","Status","Last scanned","Risk","Changes","Next scan","Actions"].map((label) => <th className="p-4" key={label}>{label}</th>)}</tr></thead><tbody>{items.map((item) => <tr className="border-t border-white/10" key={item.id}><td className="p-4 font-bold">{item.domain}</td><td>{item.status}</td><td>{item.lastScannedAt || "Not scanned"}</td><td>{item.latestRiskLevel}</td><td>{item.latestChangeCount}</td><td>{item.nextScanAt || "Not scheduled"}</td><td className="space-x-3"><button onClick={() => change(item.id, item.status === "Active" ? "pause" : "resume")} className="text-red-300">{item.status === "Active" ? "Pause" : "Resume"}</button><button onClick={() => change(item.id, "remove")} className="text-zinc-400">Remove</button></td></tr>)}</tbody></table>{items.length === 0 && <p className="p-8 text-zinc-400">Add a domain to start the watchlist.</p>}</div></>}</section></ShadowScoreLayout>;
}
