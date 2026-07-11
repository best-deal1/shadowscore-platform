import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ProviderResult } from "../providers/types";
import type { VerificationDecision } from "./model";

export type ReferenceProviderSnapshotDocument = {
  decisionValidationCases: Array<{ label: string; snapshot: string; expected: VerificationDecision[]; targetType?: "website" | "marketplaceSeller" | "socialProfile" | "unknown" }>;
  fixtureOutputs: Record<string, { label: string; snapshot: string }>;
  integrityCases: {
    [domain: string]: { name: string; snapshot: string } | string;
    negativeMarketplace: string;
    missingDmarc: string;
  };
  snapshots: Record<string, ProviderResult[]>;
};

let cached: ReferenceProviderSnapshotDocument | undefined;

export function loadReferenceProviderSnapshots(): ReferenceProviderSnapshotDocument {
  cached ??= JSON.parse(readFileSync(join(process.cwd(), "lib/decisionEngine/referenceProviderSnapshots.json"), "utf8")) as ReferenceProviderSnapshotDocument;
  return cached;
}

export function referenceProviderSnapshot(id: string): ProviderResult[] {
  const snapshot = loadReferenceProviderSnapshots().snapshots[id];
  if (!snapshot) throw new Error(`Missing reference provider snapshot: ${id}`);
  return structuredClone(snapshot);
}
