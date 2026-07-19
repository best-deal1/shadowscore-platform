"use client";

import { useLocale } from "../../components/LocaleProvider";
export type AuditMetadataProps = {
  createdAt?: string;
  completedAt?: string;
  engineVersion?: string;
  policyVersion?: string;
  sources?: string[];
  compact?: boolean;
};

function formatTimestamp(
  value: string | undefined,
  locale: string,
  notRecorded: string,
) {
  if (!value) return notRecorded;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export default function AuditMetadata({
  createdAt,
  completedAt,
  engineVersion,
  policyVersion = "Trust Policy v1.0",
  sources = [],
  compact = false,
}: AuditMetadataProps) {
  const { locale, t } = useLocale();
  const items = [
    [t.audit.started, formatTimestamp(createdAt, locale, t.audit.notRecorded)],
    [
      t.audit.completed,
      formatTimestamp(completedAt, locale, t.audit.notRecorded),
    ],
    [t.audit.engine, engineVersion || t.audit.notRecorded],
    [t.audit.policy, policyVersion],
    [
      t.audit.provenance,
      sources.length ? sources.join(" · ") : t.audit.notRecorded,
    ],
  ];

  return (
    <section
      aria-label={t.audit.record}
      className={`audit-surface ${compact ? "p-4" : "p-5"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="ui-label">{t.audit.record}</div>
        <span className="audit-status">{t.audit.recorded}</span>
      </div>
      <dl
        className={`mt-4 grid gap-3 ${compact ? "sm:grid-cols-2 xl:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-5"}`}
      >
        {items.map(([label, value]) => (
          <div key={label} className="audit-field">
            <dt className="ui-label">{label}</dt>
            <dd className="evidence-value mt-2 break-words text-sm text-zinc-100">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
