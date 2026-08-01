import Link from "next/link";
import { getInvestigationRepository } from "@/lib/investigation/server";

export default async function ArchivePage() {
  const investigations = await (await getInvestigationRepository()).list();
  const archived = investigations.filter((item) => item.status === "archived");
  return <section className="workspace-page" aria-labelledby="archive-title">
    <header className="workspace-page-heading"><div><p className="workspace-eyebrow">History</p><h1 id="archive-title">Archive</h1><p>Review investigations that your organization has archived.</p></div><Link className="workspace-primary-button" href="/workspace">Back to workspace</Link></header>
    {archived.length ? <div className="workspace-record-list">{archived.map((item) => <article key={item.investigationId}><div><p className="workspace-record-meta">Archived {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(item.updatedAt))}</p><h2>{item.target}</h2><p>Investigation {item.investigationId}</p></div><Link href={`/cases/${item.investigationId}`}>Open investigation</Link></article>)}</div> : <div className="workspace-empty-state"><span aria-hidden="true">↺</span><h2>Archive is empty</h2><p>Archived investigations will appear here. Completed reports remain available under Reports.</p><Link href="/reports">View reports</Link></div>}
  </section>;
}
