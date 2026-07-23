"use client";

import type { Locale } from "@/lib/i18n";
import type { CasePriority, CaseQueueItemDto, CaseStatus } from "@/lib/workspace/domain";
import { workspaceCopy } from "./workspace-copy";

const statusLabels: Record<Locale, Record<CaseStatus, string>> = {
  en: { draft: "Draft", active: "Active", awaiting_input: "Awaiting input", under_review: "Under review", monitoring: "Monitoring", closed: "Closed", archived: "Archived" },
  he: { draft: "טיוטה", active: "פעיל", awaiting_input: "ממתין למידע", under_review: "בסקירה", monitoring: "בניטור", closed: "סגור", archived: "בארכיון" },
  ar: { draft: "مسودة", active: "نشطة", awaiting_input: "بانتظار معلومات", under_review: "قيد المراجعة", monitoring: "تحت المراقبة", closed: "مغلقة", archived: "مؤرشفة" },
  es: { draft: "Borrador", active: "Activo", awaiting_input: "En espera de información", under_review: "En revisión", monitoring: "En monitoreo", closed: "Cerrado", archived: "Archivado" },
  fr: { draft: "Brouillon", active: "Actif", awaiting_input: "En attente d’informations", under_review: "En revue", monitoring: "Sous surveillance", closed: "Fermé", archived: "Archivé" },
  de: { draft: "Entwurf", active: "Aktiv", awaiting_input: "Warten auf Informationen", under_review: "In Prüfung", monitoring: "In Überwachung", closed: "Geschlossen", archived: "Archiviert" },
};
const priorityLabels: Record<Locale, Record<CasePriority, string>> = {
  en: { low: "Low", normal: "Normal", high: "High", critical: "Critical" }, he: { low: "נמוכה", normal: "רגילה", high: "גבוהה", critical: "קריטית" }, ar: { low: "منخفضة", normal: "عادية", high: "مرتفعة", critical: "حرجة" }, es: { low: "Baja", normal: "Normal", high: "Alta", critical: "Crítica" }, fr: { low: "Faible", normal: "Normale", high: "Haute", critical: "Critique" }, de: { low: "Niedrig", normal: "Normal", high: "Hoch", critical: "Kritisch" },
};

function formatDate(value: string | null, locale: Locale, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function CaseQueue({ cases, locale }: { cases: readonly CaseQueueItemDto[]; locale: Locale }) {
  const copy = workspaceCopy[locale];
  return (
    <section className="case-queue" aria-labelledby="case-queue-title">
      <div className="case-queue-heading">
        <div>
          <p className="workspace-eyebrow">{copy.queueEyebrow}</p>
          <h1 id="case-queue-title">{copy.queueTitle}</h1>
          <p className="case-queue-description">{copy.queueDescription}</p>
        </div>
      </div>
      <div className="case-queue-summary"><strong>{cases.length}</strong> {copy.casesCount}</div>
      <div className="case-table-wrap">
        <table className="case-table">
          <caption className="sr-only">{copy.queueTitle}</caption>
          <thead><tr><th scope="col">{copy.case}</th><th scope="col">{copy.priority}</th><th scope="col">{copy.owner}</th><th scope="col">{copy.due}</th><th scope="col">{copy.alertsLabel}</th><th scope="col">{copy.updated}</th></tr></thead>
          <tbody>{cases.map((item) => <tr key={item.id}>
            <th scope="row"><span className="case-title">{item.title}</span><span className="case-target">{item.target}</span><span className={`case-status case-status-${item.status}`}>{statusLabels[locale][item.status]}</span></th>
            <td><span className={`case-priority case-priority-${item.priority}`}>{priorityLabels[locale][item.priority]}</span></td>
            <td>{item.ownerName ?? copy.unassigned}</td>
            <td>{formatDate(item.dueAt, locale, copy.noDueDate)}</td>
            <td>{item.openAlertCount > 0 ? <span className="case-alert-count"><span aria-hidden="true">!</span> {item.openAlertCount}</span> : "—"}</td>
            <td>{formatDate(item.updatedAt, locale, copy.noDueDate)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
