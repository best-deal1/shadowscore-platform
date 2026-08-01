import Link from "next/link";
import { getInvestigationRepository } from "@/lib/investigation/server";

export default async function ReportsPage() {
  const investigations = await (await getInvestigationRepository()).list();
  const reports = investigations.filter((item) => item.status === "ready" && item.reportId);

  return <section className="workspace-page" aria-labelledby="reports-title">
    <header className="workspace-page-heading"><div><p className="workspace-eyebrow">Reports</p><h1 id="reports-title">Executive reports</h1><p>Open completed reports from your organization.</p></div><Link className="workspace-primary-button" href="/intake">New investigation</Link></header>
    {reports.length ? <div className="workspace-record-list">{reports.map((item) => <article key={item.investigationId}><div><p className="workspace-record-meta">Completed {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(item.updatedAt))}</p><h2>{item.target}</h2><p>Investigation {item.investigationId}</p></div><Link href={`/reports/${item.reportId}`}>Open report</Link></article>)}</div> : <div className="workspace-empty-state"><span aria-hidden="true">▤</span><h2>No reports yet</h2><p>Completed investigation reports will appear here.</p><Link href="/workspace">View investigations</Link></div>}
  </section>;
}
