"use client";

import Link from "next/link";
import { useState } from "react";
import type { CaseQueueItemDto } from "@/lib/workspace/domain";
import { useProductFeedback } from "@/components/ProductFeedback";

export function ArchiveWorkspace({ initialInvestigations, canManage }: { initialInvestigations: readonly CaseQueueItemDto[]; canManage: boolean }) {
  const [investigations, setInvestigations] = useState(() => initialInvestigations.filter((item) => item.status === "archived"));
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { notify } = useProductFeedback();

  async function update(item: CaseQueueItemDto, action: "restore" | "delete") {
    if (action === "delete" && !window.confirm(`Delete ${item.title}? This action cannot be undone.`)) return;
    setPendingId(item.id);
    try {
      const response = await fetch(`/api/workspace/investigations/${encodeURIComponent(item.id)}`, action === "delete" ? { method: "DELETE" } : { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "closed", version: item.version }) });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || `The investigation could not be ${action === "delete" ? "deleted" : "restored"}.`);
      setInvestigations((current) => current.filter((candidate) => candidate.id !== item.id));
      notify(`${item.title} was ${action === "delete" ? "deleted" : "restored to Investigations"}.`, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "The investigation could not be updated. Try again.", "error");
    } finally {
      setPendingId(null);
    }
  }

  return <section className="workspace-page" aria-labelledby="archive-title">
    <header className="workspace-page-heading"><div><p className="workspace-eyebrow">History</p><h1 id="archive-title">Archive</h1><p>Restore past investigations or permanently remove records you no longer need.</p></div><Link className="workspace-primary-button" href="/workspace">Back to workspace</Link></header>
    {investigations.length ? <div className="workspace-record-list">{investigations.map((item) => <article key={item.id}><div><p className="workspace-record-meta">Archived {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(item.updatedAt))}</p><h2>{item.title}</h2><p>Investigation {item.id}</p></div><div className="archive-actions"><Link href={`/cases/${item.id}`}>Open investigation</Link>{canManage ? <><button type="button" disabled={pendingId === item.id} onClick={() => void update(item, "restore")}>{pendingId === item.id ? "Updating" : "Restore"}</button><button className="archive-delete" type="button" disabled={pendingId === item.id} onClick={() => void update(item, "delete")}>Delete</button></> : null}</div></article>)}</div> : <div className="workspace-empty-state"><span aria-hidden="true">↺</span><h2>Archive is empty</h2><p>Investigations you archive will appear here. Reports remain available in your workspace.</p><Link href="/workspace">View investigations</Link></div>}
  </section>;
}
