export type InvestigationTimelineItem = {
  title: string;
  description: string;
  evidenceSource: string;
  status: string;
  timestamp?: string;
  risk?: boolean;
};

function formatTimestamp(value?: string) {
  if (!value) return "Recorded during investigation";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(date);
}

export default function InvestigationTimeline({ items, title = "Investigation timeline", className = "" }: { items: InvestigationTimelineItem[]; title?: string; className?: string }) {
  return (
    <section aria-label={title} className={`timeline-surface ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="ui-label">Evidence trail</div>
          <h2 className="mt-2 text-xl font-bold text-white">{title}</h2>
        </div>
        <span className="audit-status">{items.length} records</span>
      </div>
      <ol className="timeline-list mt-5">
        {items.map((item, index) => (
          <li key={`${item.title}-${index}`} className="timeline-item">
            <div className={`timeline-marker ${item.risk ? "timeline-marker-risk" : ""}`} aria-hidden="true" />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="evidence-value text-sm text-white">{item.title}</div>
                <p className="mt-1 text-sm leading-6 text-zinc-400">{item.description}</p>
              </div>
              <span className={item.risk ? "risk-status" : "audit-status"}>{item.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span>{formatTimestamp(item.timestamp)}</span>
              <span>Source: {item.evidenceSource}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
