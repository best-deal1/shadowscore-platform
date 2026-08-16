export type InvestigationDeletionResult = {
  id: string;
  ok: boolean;
  error: string | null;
  status: number;
  retryable: boolean;
};

type DeleteResponse = Pick<Response, "ok" | "status" | "json">;

export async function deleteWorkspaceInvestigations(
  ids: readonly string[],
  request: (id: string) => Promise<DeleteResponse> = async (id) => fetch(`/api/workspace/investigations/${encodeURIComponent(id)}`, { method: "DELETE" }),
): Promise<InvestigationDeletionResult[]> {
  return Promise.all(ids.map(async (id) => {
    try {
      const response = await request(id);
      if (response.ok) return { id, ok: true, error: null, status: response.status, retryable: false };

      const body = await response.json().catch(() => null) as { error?: unknown; message?: unknown } | null;
      const detail = typeof body?.error === "string" ? body.error : typeof body?.message === "string" ? body.message : null;
      const accessFailure = response.status === 401 || response.status === 403;
      const terminalFailure = accessFailure || response.status === 404;
      return {
        id,
        ok: false,
        error: detail || (accessFailure ? "You do not have permission to delete this investigation." : "The investigation could not be deleted."),
        status: response.status,
        retryable: !terminalFailure,
      };
    } catch (error) {
      return {
        id,
        ok: false,
        error: error instanceof Error ? error.message : "The investigation could not be deleted.",
        status: 0,
        retryable: true,
      };
    }
  }));
}

export function summarizeDeletionFailures(results: readonly InvestigationDeletionResult[]) {
  const failures = results.filter((result) => !result.ok && result.status !== 404);
  if (!failures.length) return null;
  const details = failures.map((result) => `${result.id}: ${result.error}`).join(" ");
  const retryableIds = failures.filter((result) => result.retryable).map((result) => result.id);
  return { ids: failures.map((result) => result.id), retryableIds, details, canRetry: retryableIds.length > 0 };
}

export function intersectVisibleSelection(selectedIds: Iterable<string>, visibleDeletableIds: ReadonlySet<string>) {
  return [...selectedIds].filter((id) => visibleDeletableIds.has(id));
}

export function getVisibleSelectionState(selectedVisibleCount: number, visibleCount: number) {
  const checked = visibleCount > 0 && selectedVisibleCount === visibleCount;
  return { checked, mixed: selectedVisibleCount > 0 && !checked };
}

export function toggleInvestigationSelection(selectedIds: Iterable<string>, id: string) {
  const next = new Set(selectedIds);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}

export function toggleVisibleSelection(selectedIds: Iterable<string>, visibleDeletableIds: ReadonlySet<string>) {
  const next = new Set(selectedIds);
  const allVisibleSelected = visibleDeletableIds.size > 0 && [...visibleDeletableIds].every((id) => next.has(id));
  for (const id of visibleDeletableIds) {
    if (allVisibleSelected) next.delete(id); else next.add(id);
  }
  return next;
}

export function reconcileDeletionResults(results: readonly InvestigationDeletionResult[]) {
  const removedIds = results.filter((result) => result.ok || result.status === 404).map((result) => result.id);
  const failure = summarizeDeletionFailures(results);
  return {
    removedIds,
    failedIds: failure?.retryableIds ?? [],
    error: failure?.details ?? null,
    canRetry: failure?.canRetry ?? false,
    shouldRefresh: failure === null,
  };
}
