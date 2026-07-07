import type { TrustWatchEvaluationInput, TrustWatchNotification, TrustWatchSchedule } from "./types";
import { evaluateTrustWatchRules } from "./index";

const cadenceMs: Record<TrustWatchSchedule["cadence"], number> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

export function createTrustWatchSchedule(params: {
  id: string;
  watchlistId: string;
  cadence: TrustWatchSchedule["cadence"];
  startsAt?: string;
  enabled?: boolean;
}): TrustWatchSchedule {
  return {
    id: params.id,
    watchlistId: params.watchlistId,
    cadence: params.cadence,
    nextRunAt: params.startsAt ?? new Date().toISOString(),
    enabled: params.enabled ?? true,
  };
}

export function advanceSchedule(schedule: TrustWatchSchedule, from = schedule.nextRunAt): TrustWatchSchedule {
  return {
    ...schedule,
    nextRunAt: new Date(new Date(from).getTime() + cadenceMs[schedule.cadence]).toISOString(),
  };
}

export function runScheduledEvaluation(
  schedule: TrustWatchSchedule,
  input: TrustWatchEvaluationInput,
): { schedule: TrustWatchSchedule; notifications: TrustWatchNotification[] } {
  if (!schedule.enabled) {
    return { schedule, notifications: [] };
  }

  return {
    schedule: advanceSchedule(schedule, input.evaluatedAt),
    notifications: evaluateTrustWatchRules(input),
  };
}
