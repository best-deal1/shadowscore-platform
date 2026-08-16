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
      return {
        id,
        ok: false,
        error: detail || (accessFailure ? "You do not have permission to delete this investigation." : "The investigation could not be deleted."),
        status: response.status,
        retryable: !accessFailure,
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
  const failures = results.filter((result) => !result.ok);
  if (!failures.length) return null;
  const details = failures.map((result) => `${result.id}: ${result.error}`).join(" ");
  const canRetry = failures.every((result) => result.retryable);
  return { ids: failures.map((result) => result.id), details, canRetry };
}

export function intersectVisibleSelection(selectedIds: Iterable<string>, visibleDeletableIds: ReadonlySet<string>) {
  return [...selectedIds].filter((id) => visibleDeletableIds.has(id));
}

export function reconcileDeletionResults(results: readonly InvestigationDeletionResult[]) {
  const successfulIds = results.filter((result) => result.ok).map((result) => result.id);
  const failure = summarizeDeletionFailures(results);
  return {
    successfulIds,
    failedIds: failure?.ids ?? [],
    error: failure?.details ?? null,
    canRetry: failure?.canRetry ?? false,
    shouldRefresh: failure === null,
  };
}
