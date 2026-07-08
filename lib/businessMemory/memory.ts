import { diffBusinessSnapshots, getStabilityLevel, summarizeChanges } from "./diff";
import { addSnapshotToHistory, getBusinessHistory, getPreviousSnapshot } from "./history";
import { createBusinessSnapshot } from "./snapshots";
import type { BusinessMemoryResult, BusinessSnapshotInput } from "./types";

export function rememberBusinessScan(input: BusinessSnapshotInput): BusinessMemoryResult {
  const latestSnapshot = createBusinessSnapshot(input);
  const previousSnapshot = getPreviousSnapshot(latestSnapshot.businessKey);
  const detectedChanges = previousSnapshot ? diffBusinessSnapshots(previousSnapshot, latestSnapshot) : [];
  const businessHistory = addSnapshotToHistory(latestSnapshot);
  const hasPreviousSnapshot = Boolean(previousSnapshot);

  return {
    businessHistory,
    latestSnapshot,
    previousSnapshot,
    detectedChanges,
    stabilityLevel: getStabilityLevel(detectedChanges, hasPreviousSnapshot),
    changeSummary: summarizeChanges(detectedChanges, hasPreviousSnapshot),
  };
}

export function readBusinessHistory(identityOrKey: string): ReturnType<typeof getBusinessHistory> {
  return getBusinessHistory(identityOrKey.trim().toLowerCase().replace(/\s+/g, "-"));
}
