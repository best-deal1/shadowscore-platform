import type { BusinessHistory, BusinessSnapshot } from "./types";

const histories = new Map<string, BusinessSnapshot[]>();

export function getBusinessHistory(businessKey: string): BusinessHistory {
  return {
    businessKey,
    snapshots: [...(histories.get(businessKey) ?? [])],
  };
}

export function getPreviousSnapshot(businessKey: string): BusinessSnapshot | undefined {
  const snapshots = histories.get(businessKey) ?? [];
  return snapshots.at(-1);
}

export function addSnapshotToHistory(snapshot: BusinessSnapshot): BusinessHistory {
  const snapshots = histories.get(snapshot.businessKey) ?? [];
  snapshots.push(snapshot);
  histories.set(snapshot.businessKey, snapshots);
  return getBusinessHistory(snapshot.businessKey);
}

export function getAllBusinessHistories(): BusinessHistory[] {
  return [...histories.keys()].sort().map(getBusinessHistory);
}

export function clearBusinessMemory(): void {
  histories.clear();
}

export const exampleBusinessHistories: BusinessHistory[] = Array.from({ length: 10 }, (_, index) => {
  const number = index + 1;
  const businessKey = `example-business-${number}.com`;

  return {
    businessKey,
    snapshots: [
      {
        id: `${businessKey}:scan-1`,
        businessKey,
        scanId: "scan-1",
        identity: {
          name: `Example Business ${number}`,
          domain: businessKey,
          emails: [`hello@${businessKey}`],
          phones: [`+155500010${number}`],
        },
        entities: [
          { type: "Business", value: `Example Business ${number}` },
          { type: "Domain", value: businessKey },
          { type: "Email", value: `hello@${businessKey}` },
        ],
        relationships: [{ type: "OWNS", from: `Example Business ${number}`, to: businessKey }],
        evidence: [{ label: "Initial public record", value: "matched", source: "example-provider-a" }],
        decision: { decision: "Limited public evidence", confidence: "Medium" },
        timestamp: `2026-01-${String(number).padStart(2, "0")}T00:00:00.000Z`,
      },
      {
        id: `${businessKey}:scan-2`,
        businessKey,
        scanId: "scan-2",
        identity: {
          name: `Example Business ${number}`,
          domain: businessKey,
          emails: [`support@${businessKey}`],
          phones: [`+155500020${number}`],
        },
        entities: [
          { type: "Business", value: `Example Business ${number}` },
          { type: "Domain", value: businessKey },
          { type: "Email", value: `support@${businessKey}` },
        ],
        relationships: [{ type: "OWNS", from: `Example Holdings ${number}`, to: businessKey }],
        evidence: [{ label: "Updated public record", value: "matched", source: "example-provider-b" }],
        decision: { decision: number % 2 === 0 ? "Strong public evidence" : "Conflicting evidence detected", confidence: number % 2 === 0 ? "High" : "Low" },
        timestamp: `2026-02-${String(number).padStart(2, "0")}T00:00:00.000Z`,
      },
    ],
  };
});
