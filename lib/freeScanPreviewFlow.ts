export type PreviewCompletionStatus = "idle" | "loading" | "ready" | "failed";

export type PreviewReadyEvent = {
  type?: string;
  status?: string;
  ready?: boolean;
};

export type PreviewApiResponse = {
  status?: string;
  executedAt?: string;
  providers?: unknown[];
  decisionPreview?: unknown;
  reportReadyEvent?: PreviewReadyEvent;
  error?: string;
};

export function isPreviewReadyResponse(payload: PreviewApiResponse | null | undefined) {
  if (!payload || typeof payload !== "object") return false;

  const readyEvent = payload.reportReadyEvent;
  const eventReady = readyEvent?.type === "free-preview-ready" || readyEvent?.status === "ready" || readyEvent?.ready === true;

  return payload.status === "ready" || eventReady || Boolean(payload.executedAt && Array.isArray(payload.providers) && payload.decisionPreview);
}

export function nextPreviewStatus(payload: PreviewApiResponse | null | undefined, fallback: PreviewCompletionStatus = "failed"): PreviewCompletionStatus {
  return isPreviewReadyResponse(payload) ? "ready" : fallback;
}

export async function readPreviewJson(response: Pick<Response, "json" | "ok">): Promise<PreviewApiResponse> {
  const payload = (await response.json()) as PreviewApiResponse;

  if (!response.ok) {
    throw new Error(payload.error || "Unable to run investigation checks.");
  }

  if (!isPreviewReadyResponse(payload)) {
    throw new Error("Investigation checks finished, but the preview-ready event was missing from the API response.");
  }

  return payload;
}
