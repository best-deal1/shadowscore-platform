import type { CaseQueueItemDto } from "./domain";

/** Temporary server-owned fixture. Replace with an authorized repository query in M1. */
export const placeholderCaseQueue: readonly CaseQueueItemDto[] = [
  { id: "case_01JY8V7ZPQ9B", title: "Northstar Components onboarding", target: "Northstar Components Ltd.", status: "under_review", priority: "high", ownerName: "Maya Chen", dueAt: "2026-07-25T17:00:00.000Z", updatedAt: "2026-07-23T10:14:00.000Z", openAlertCount: 2 },
  { id: "case_01JY8VTQ8B8D", title: "Harborline seller verification", target: "Harborline Trading", status: "awaiting_input", priority: "normal", ownerName: "Jordan Lee", dueAt: "2026-07-28T17:00:00.000Z", updatedAt: "2026-07-23T08:42:00.000Z", openAlertCount: 0 },
  { id: "case_01JY8WCBPX2M", title: "Atlas Freight renewal", target: "Atlas Freight GmbH", status: "monitoring", priority: "low", ownerName: "Maya Chen", dueAt: null, updatedAt: "2026-07-22T15:20:00.000Z", openAlertCount: 1 },
  { id: "case_01JY8WXYE61R", title: "Cedar Pay partner review", target: "Cedar Pay Inc.", status: "active", priority: "critical", ownerName: null, dueAt: "2026-07-24T12:00:00.000Z", updatedAt: "2026-07-22T13:05:00.000Z", openAlertCount: 3 },
];
