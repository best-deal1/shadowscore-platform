"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShadowScoreLayout from "../components/ShadowScoreLayout";
import { getCurrentSession, getCurrentUser } from "../../lib/auth";
import { getWorkspace, type ShadowScoreEntity } from "../../lib/workspace";

function statusClass(status: ShadowScoreEntity["status"]) {
  if (status === "High Risk") return "border-red-400/30 bg-red-500/10 text-red-100";
  if (status === "Needs Evidence") return "border-yellow-400/30 bg-yellow-500/10 text-yellow-100";
  if (status === "Stable") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  return "border-sky-400/30 bg-sky-500/10 text-sky-100";
}

export default function MonitoringPage() {
  const router = useRouter();
  const [entities, setEntities] = useState<ShadowScoreEntity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    const session = getCurrentSession();
    if (!user || !session) {
      router.push("/login");
      return;
    }
    getWorkspace(session).then((workspace) => setEntities(workspace.entities)).finally(() => setLoaded(true));
  }, [router]);

  return (
    <ShadowScoreLayout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.32em] text-red-300">Monitoring</div>
            <h1 className="mt-4 text-5xl font-black tracking-tight">Watchlist monitoring</h1>
            <p className="mt-4 max-w-3xl text-zinc-400">Review every saved business, marketplace, payment provider, website and supplier from your workspace. Add entities from the dashboard and return here for a focused monitoring view.</p>
          </div>
          <Link href="/workspace" className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-500">Manage watchlist</Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="text-xs uppercase tracking-[0.24em] text-zinc-600">Watched</div><div className="mt-3 text-4xl font-black">{entities.length}</div></div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="text-xs uppercase tracking-[0.24em] text-zinc-600">Needs Evidence</div><div className="mt-3 text-4xl font-black">{entities.filter((entity) => entity.status === "Needs Evidence").length}</div></div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="text-xs uppercase tracking-[0.24em] text-zinc-600">High Risk</div><div className="mt-3 text-4xl font-black">{entities.filter((entity) => entity.status === "High Risk").length}</div></div>
        </div>

        <div className="mt-8 rounded-[34px] border border-white/10 bg-black/55 p-6">
          {!loaded && <div className="text-zinc-400">Loading monitored businesses...</div>}
          {loaded && entities.length === 0 && <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="text-xl font-black">No monitored businesses yet</div><p className="mt-2 text-zinc-500">Use the dashboard watchlist form to add your first business. This is an empty state, not placeholder data.</p></div>}
          <div className="grid gap-4 md:grid-cols-2">
            {entities.map((entity) => <div key={entity.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="flex items-start justify-between gap-4"><div><div className="text-xl font-black">{entity.name}</div><div className="mt-1 text-sm text-zinc-500">{entity.type}</div></div><span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(entity.status)}`}>{entity.status}</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-yellow-300 to-red-500" style={{ width: `${entity.lastScore}%` }} /></div><div className="mt-3 text-sm text-zinc-400">Risk index: <span className="font-black text-white">{entity.lastScore}/100</span></div></div>)}
          </div>
        </div>
      </section>
    </ShadowScoreLayout>
  );
}
