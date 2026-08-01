"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { CaseQueueItemDto } from "@/lib/workspace/domain";

type Filter = "all" | "active" | "completed" | "monitoring" | "high" | "favorites";

const demoCases: readonly CaseQueueItemDto[] = [
  { id: "INV-1048", title: "Northstar Components", target: "northstar-components.com", status: "active", priority: "critical", ownerName: "Maya Chen", dueAt: null, updatedAt: "2026-07-30T09:42:00Z", openAlertCount: 3 },
  { id: "INV-1045", title: "Meridian Freight Group", target: "meridianfreight.com", status: "under_review", priority: "high", ownerName: "Daniel Ortiz", dueAt: null, updatedAt: "2026-07-30T08:15:00Z", openAlertCount: 1 },
  { id: "INV-1042", title: "Aperture Medical Supply", target: "aperturemedical.co", status: "monitoring", priority: "normal", ownerName: "Maya Chen", dueAt: null, updatedAt: "2026-07-29T16:30:00Z", openAlertCount: 2 },
  { id: "INV-1039", title: "Cedar & Stone Retail", target: "cedarstone.com", status: "closed", priority: "low", ownerName: "Jon Bell", dueAt: null, updatedAt: "2026-07-28T13:05:00Z", openAlertCount: 0 },
  { id: "INV-1034", title: "Vectorline Technologies", target: "vectorline.io", status: "closed", priority: "high", ownerName: "Daniel Ortiz", dueAt: null, updatedAt: "2026-07-26T10:20:00Z", openAlertCount: 0 },
];

const filterLabels: Record<Filter, string> = { all: "All", active: "Active", completed: "Completed", monitoring: "Monitoring", high: "High risk", favorites: "Favorites" };
const statusLabels = { draft: "Draft", active: "Investigating", awaiting_input: "Awaiting input", under_review: "Under review", monitoring: "Monitoring", closed: "Completed", archived: "Archived" } as const;

function formatUpdated(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(value));
}

function investigationType(index: number) {
  return ["Business due diligence", "Supplier review", "Partner screening"][index % 3];
}

export function InvestigationWorkspace({ cases, locale }: { cases: readonly CaseQueueItemDto[]; locale: Locale }) {
  const investigations = cases.length ? cases : demoCases;
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState(() => new Set([investigations[0]?.id]));

  const visible = useMemo(() => investigations.filter((item) => {
    const matchesSearch = `${item.title} ${item.target} ${item.id}`.toLowerCase().includes(query.trim().toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "active") return ["draft", "active", "awaiting_input", "under_review"].includes(item.status);
    if (filter === "completed") return ["closed", "archived"].includes(item.status);
    if (filter === "monitoring") return item.status === "monitoring";
    if (filter === "high") return ["high", "critical"].includes(item.priority);
    if (filter === "favorites") return favorites.has(item.id);
    return true;
  }), [favorites, filter, investigations, query]);

  const activeCount = investigations.filter((item) => ["draft", "active", "awaiting_input", "under_review"].includes(item.status)).length;
  const completed = investigations.filter((item) => ["closed", "archived"].includes(item.status));
  const monitoring = investigations.filter((item) => item.status === "monitoring");
  const alertCount = investigations.reduce((total, item) => total + item.openAlertCount, 0);

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="investigation-workspace">
      <header className="iw-hero">
        <div><p className="workspace-eyebrow">Intelligence workspace</p><h1>Investigations</h1><p>Review active work, reports, monitored businesses, and alerts from one place.</p></div>
        <Link className="iw-primary" href="/intake">New investigation <span aria-hidden="true">+</span></Link>
      </header>

      <section className="iw-metrics" aria-label="Workspace summary">
        <article><span className="iw-metric-icon iw-blue" aria-hidden="true">◌</span><div><strong>{activeCount}</strong><span>Active investigations</span></div></article>
        <article><span className="iw-metric-icon iw-green" aria-hidden="true">✓</span><div><strong>{completed.length}</strong><span>Completed reports</span></div></article>
        <article><span className="iw-metric-icon iw-purple" aria-hidden="true">◎</span><div><strong>{monitoring.length}</strong><span>Under monitoring</span></div></article>
        <article><span className="iw-metric-icon iw-red" aria-hidden="true">!</span><div><strong>{alertCount}</strong><span>Open alerts</span></div></article>
      </section>

      <section className="iw-panel" aria-labelledby="active-investigations-title">
        <div className="iw-section-heading"><div><h2 id="active-investigations-title">Active investigations</h2><p>Current reviews and their latest status.</p></div><span>{visible.length} shown</span></div>
        <div className="iw-tools">
          <label className="iw-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search investigations</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search businesses or investigation ID" /></label>
          <div className="iw-filters" aria-label="Filter investigations">{(Object.keys(filterLabels) as Filter[]).map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>{filterLabels[item]}</button>)}</div>
        </div>
        {visible.length ? <div className="iw-card-grid">{visible.map((item, index) => {
          const reportReady = ["closed", "archived", "monitoring"].includes(item.status);
          return <article className="iw-card" key={item.id}>
            <div className="iw-card-top"><div className="iw-company-mark" aria-hidden="true">{item.title.slice(0, 2).toUpperCase()}</div><button type="button" className="iw-favorite" aria-label={`${favorites.has(item.id) ? "Remove" : "Add"} ${item.title} ${favorites.has(item.id) ? "from" : "to"} favorites`} aria-pressed={favorites.has(item.id)} onClick={() => toggleFavorite(item.id)}>{favorites.has(item.id) ? "★" : "☆"}</button></div>
            <h3>{item.title}</h3><p className="iw-case-id">{item.id} · {investigationType(index)}</p>
            <div className="iw-badges"><span className={`iw-status iw-status-${item.status}`}>{statusLabels[item.status]}</span><span className={`iw-risk iw-risk-${item.priority}`}>{item.priority} risk</span></div>
            <dl><div><dt>Last updated</dt><dd>{formatUpdated(item.updatedAt, locale)}</dd></div><div><dt>Report</dt><dd>{reportReady ? "Available" : "Pending"}</dd></div></dl>
            <div className="iw-progress" aria-label={reportReady ? "Investigation complete" : "Investigation in progress"}><span style={{ width: reportReady ? "100%" : item.status === "under_review" ? "78%" : "46%" }} /></div>
            <div className="iw-card-actions"><Link href={reportReady ? `/reports/${item.id}` : `/cases/${item.id}`}>{reportReady ? "View report" : "Resume investigation"}</Link>{!reportReady && item.status !== "monitoring" ? <Link className="iw-text-action" href="/workspace/monitoring">Start monitoring</Link> : null}</div>
          </article>;
        })}</div> : <div className="iw-empty"><strong>No investigations found</strong><p>Try a different search or filter.</p></div>}
      </section>

      <div className="iw-lower-grid">
        <section className="iw-panel" aria-labelledby="recent-reports-title"><div className="iw-section-heading"><div><h2 id="recent-reports-title">Recently completed reports</h2><p>Reports ready for review and sharing.</p></div><Link href="/reports">View all</Link></div><div className="iw-list">{completed.slice(0, 3).map((item) => <article key={item.id}><span className="iw-list-icon" aria-hidden="true">▤</span><div><h3>{item.title}</h3><p>{item.id} · Completed {formatUpdated(item.updatedAt, locale)}</p></div><Link href={`/reports/${item.id}`}>View report</Link></article>)}{!completed.length && <p className="iw-muted">Completed reports will appear here.</p>}</div></section>
        <section className="iw-panel" aria-labelledby="alerts-title"><div className="iw-section-heading"><div><h2 id="alerts-title">Alerts</h2><p>Changes that require review.</p></div><Link href="/alerts">View all</Link></div><div className="iw-list">{investigations.filter((item) => item.openAlertCount).slice(0, 3).map((item) => <article key={item.id}><span className="iw-list-icon iw-alert-icon" aria-hidden="true">!</span><div><h3>{item.title}</h3><p>{item.openAlertCount} open {item.openAlertCount === 1 ? "alert" : "alerts"} · Risk profile updated</p></div><Link href={`/cases/${item.id}`}>Review</Link></article>)}</div></section>
      </div>

      <div className="iw-lower-grid iw-last-row">
        <section className="iw-compact-panel" aria-labelledby="saved-title"><div><p className="workspace-eyebrow">Saved businesses</p><h2 id="saved-title">Your priority list</h2><p>{favorites.size} saved {favorites.size === 1 ? "business" : "businesses"} for quick access.</p></div><button type="button" onClick={() => setFilter("favorites")}>Open favorites</button></section>
        <section className="iw-compact-panel" aria-labelledby="history-title"><div><p className="workspace-eyebrow">Investigation history</p><h2 id="history-title">Recent activity</h2><p>{investigations.length} investigations recorded in this workspace.</p></div><Link href="/archive">View history</Link></section>
      </div>
    </div>
  );
}
