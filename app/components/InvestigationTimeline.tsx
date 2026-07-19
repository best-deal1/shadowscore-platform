"use client";

import { useLocale } from "../../components/LocaleProvider";
export type InvestigationTimelineItem = {
  title: string;
  description: string;
  evidenceSource: string;
  status: string;
  timestamp?: string;
  risk?: boolean;
};

function formatTimestamp(
  value: string | undefined,
  locale: string,
  during: string,
) {
  if (!value) return during;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(date);
}

export default function InvestigationTimeline({
  items,
  title,
  className = "",
}: {
  items: InvestigationTimelineItem[];
  title?: string;
  className?: string;
}) {
  const { locale, t } = useLocale();
  const timelineTitle = title || t.audit.timeline;
  return (
    <section
      aria-label={timelineTitle}
      className={`timeline-surface ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="ui-label">{t.audit.evidenceTrail}</div>
          <h2 className="mt-2 text-xl font-bold text-white">{timelineTitle}</h2>
        </div>
        <span className="audit-status">
          {items.length} {t.audit.records}
        </span>
      </div>
      <ol className="timeline-list mt-5">
        {items.map((item, index) => (
          <li key={`${item.title}-${index}`} className="timeline-item">
            <div
              className={`timeline-marker ${item.risk ? "timeline-marker-risk" : ""}`}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="evidence-value text-sm text-white">
                  {item.title}
                </div>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {item.description}
                </p>
              </div>
              <span className={item.risk ? "risk-status" : "audit-status"}>
                {item.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span>
                {formatTimestamp(item.timestamp, locale, t.audit.during)}
              </span>
              <span>
                {t.audit.source}: {item.evidenceSource}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
