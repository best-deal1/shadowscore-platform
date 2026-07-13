import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ProviderResult } from "../providers/types";
import type { VerificationDecision } from "./model";

export type TruthDatasetExecutionEnvironment = {
  id: string;
  label: string;
  runtimeStack: string;
  independenceClass: string;
  networkBoundary: string;
  status: "represented" | "planned";
  evidence: string;
};

export type TruthDatasetCalibrationObservation = {
  id: string;
  snapshot: string;
  environmentId: string;
  target: string;
  expected: VerificationDecision;
};

export type TruthDatasetMetadata = {
  calibrationCohortVersion: string;
  independencePolicy: {
    principle: string;
    purpose: string;
    minimumIndependentExecutionStacks: number;
    minimumRepresentativeObservations: number;
  };
  independentExecutionEnvironments: TruthDatasetExecutionEnvironment[];
  calibrationObservations: TruthDatasetCalibrationObservation[];
  promotionGate: {
    readyForEngineOptimization: boolean;
    reason: string;
  };
};

export type ReferenceProviderSnapshotDocument = {
  decisionValidationCases: Array<{ label: string; snapshot: string; expected: VerificationDecision[]; targetType?: "website" | "marketplaceSeller" | "socialProfile" | "unknown" }>;
  fixtureOutputs: Record<string, { label: string; snapshot: string }>;
  integrityCases: {
    [domain: string]: { name: string; snapshot: string } | string;
    negativeMarketplace: string;
    missingDmarc: string;
  };
  truthDataset: TruthDatasetMetadata;
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
