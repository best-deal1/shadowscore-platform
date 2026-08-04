import Link from "next/link";
import { calculateRiskTrend, orderTimeline } from "@/lib/continuousMonitoring/service";
import type { MonitoredEntity, MonitoringAlert, MonitoringSnapshot } from "@/lib/continuousMonitoring/types";

const labels = { active:"Active",paused:"Paused",attention_required:"Attention Required",archived:"Archived" } as const;
const trendLabels = { improving:"Improving",stable:"Stable",declining:"Declining" } as const;
const date = (value:string|null) => value ? new Intl.DateTimeFormat("en",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZone:"UTC"}).format(new Date(value)) : "Not scanned";
export function MonitoringDashboard({entities,snapshots,alerts}:{entities:MonitoredEntity[];snapshots:MonitoringSnapshot[];alerts:MonitoringAlert[]}) {
  const open = alerts.filter(a=>!a.resolved), critical=open.filter(a=>a.severity==="critical");
  const successful=entities.map(e=>e.lastSuccessfulCycleAt).filter((v):v is string=>Boolean(v)).sort().at(-1) ?? null;
  return <div className="monitoring-page">
    <header className="monitoring-heading"><div><p className="workspace-eyebrow">Continuous intelligence</p><h1>Monitoring</h1><p>Track material changes across companies, providers, and trust scores.</p></div><Link href="/intake">Add monitor</Link></header>
    <section className="monitoring-stats" aria-label="Monitoring health">
      <article><span>Overall health</span><strong>{critical.length ? "Attention required" : "Healthy"}</strong></article><article><span>Active monitors</span><strong>{entities.filter(e=>e.status==="active"||e.status==="attention_required").length}</strong></article><article><span>Critical alerts</span><strong>{critical.length}</strong></article><article><span>Last successful cycle</span><strong>{date(successful)}</strong></article>
    </section>
    <section aria-labelledby="monitors-title"><div className="monitoring-section-title"><div><h2 id="monitors-title">Monitored entities</h2><p>{entities.length} companies under review</p></div></div><div className="monitoring-grid">{entities.map(entity=>{
      const entityAlerts=open.filter(a=>a.monitoredEntityId===entity.id); const trend=calculateRiskTrend(snapshots.filter(s=>s.monitoredEntityId===entity.id));
      return <article className="monitor-card" key={entity.id}><div className="monitor-card-top"><div><h3>{entity.company}</h3><p>{entity.target}</p></div><span className={`monitor-status status-${entity.status}`}>{labels[entity.status]}</span></div><div className="score-row"><div><span>Trust score</span><strong>{entity.currentTrustScore}</strong><small>/100</small></div><span className={`trend trend-${trend}`}>{trendLabels[trend]}</span></div><dl><div><dt>Last scan</dt><dd>{date(entity.lastScanAt)}</dd></div><div><dt>New alerts</dt><dd>{entityAlerts.length}</dd></div><div><dt>Schedule</dt><dd>{entity.frequency}</dd></div></dl><Link href={`/workspace/monitoring/${entity.id}`}>View timeline <span aria-hidden="true">→</span></Link></article>})}</div></section>
    <section className="alert-panel" aria-labelledby="alerts-title"><div className="monitoring-section-title"><div><h2 id="alerts-title">Latest alerts</h2><p>Changes that may affect a business decision</p></div><span className="monitor-filter-label">All severity levels</span></div><div className="alert-list">{orderTimeline(alerts).map(alert=><article key={alert.id}><span className={`severity severity-${alert.severity}`}>{alert.severity}</span><div><h3>{alert.title}</h3><p>{alert.company} · {alert.provider} · {alert.description}</p></div><time dateTime={alert.detectedAt}>{date(alert.detectedAt)}</time><span className={alert.resolved?"resolved":"open"}>{alert.resolved?"Resolved":"Open"}</span></article>)}</div></section>
  </div>;
}

