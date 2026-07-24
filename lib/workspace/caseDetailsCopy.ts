import type { Locale } from "@/lib/i18n";

const en = {
  caseWorkspace: "Case workspace",
  investigationCase: "Investigation case",
  owner: "Owner",
  unassigned: "Unassigned",
  dueDate: "Due date",
  noDueDate: "No due date",
  lastUpdated: "Last updated",
  caseReference: "Case reference",
  investigationType: "Investigation type",
  businessDueDiligence: "Business due diligence",
  caseSections: "Case sections",
  tabs: { overview: "Overview", timeline: "Timeline", evidence: "Evidence", findings: "Findings", decision: "Decision", report: "Report" },
  activityHistory: "Activity history",
  timeline: "Timeline",
  timelineDescription: "Recorded case activity, newest first.",
  filterTimelineEvents: "Filter timeline events",
  filters: { all: "All", case: "Case", evidence: "Evidence", finding: "Findings", analyst: "Analyst", decision: "Decision", monitoring: "Monitoring", report: "Reports" },
  loadingTimeline: "Loading timeline",
  timelineUnavailable: "Timeline unavailable",
  timelineRetryHelp: "Try loading the activity history again.",
  retry: "Retry",
  noActivity: "No activity recorded",
  noActivityHelp: "Activity for this filter will appear here when it is recorded.",
  eventType: "Event type",
  relatedRecords: "Related records",
  viewRelatedRecord: "View related record",
  loadOlderActivity: "Load older activity",
  sectionPending: "This section is being prepared.",
  sectionPendingHelp: "Use the timeline to review recorded activity for this case.",
};

export type CaseDetailsCopy = typeof en;

// English is the configured product locale. The per-locale catalog keeps this
// workspace on the same localization boundary as the rest of the application.
export const caseDetailsCopy: Record<Locale, CaseDetailsCopy> = {
  en,
  he: en,
  ar: en,
  es: en,
  fr: en,
  de: en,
};
