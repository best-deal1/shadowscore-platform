import {
  attachPaymentIntent,
  createPreviewInvestigation,
  markGenerating,
  markReady,
  saveInvestigation,
} from "./lifecycle";
import type { Investigation, InvestigationSeed } from "./types";

/** Persistence boundary for investigation records. Replace this adapter with a database-backed implementation. */
export interface InvestigationRepository {
  list(): Promise<Investigation[]>;
  create(seed: InvestigationSeed): Promise<Investigation>;
  save(investigation: Investigation): Promise<Investigation>;
}

const seededInvestigations = [
  markReady(markGenerating(attachPaymentIntent(saveInvestigation(createPreviewInvestigation({
    investigationId: "inv-northstar", target: "Northstar Marketplace Ltd.", userId: "maya-chen", createdAt: "2026-07-20T08:30:00.000Z",
  }), "2026-07-20T08:31:00.000Z"), "pi-northstar", "2026-07-20T08:32:00.000Z"), "2026-07-20T08:33:00.000Z"), {
    verificationScore: 91,
    evidenceRefs: ["registry", "payment-network", "marketplace-history"],
    narrativeSummary: "Payment, identity, and marketplace signals need a decision.",
  }, "2026-07-20T08:34:00.000Z"),
  createPreviewInvestigation({ investigationId: "inv-harborline", target: "Harborline Components", userId: "maya-chen", createdAt: "2026-07-20T09:00:00.000Z" }),
];

class MemoryInvestigationRepository implements InvestigationRepository {
  private records = seededInvestigations;

  async list() { return [...this.records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
  async create(seed: InvestigationSeed) {
    const record = createPreviewInvestigation(seed);
    this.records = [record, ...this.records];
    return record;
  }
  async save(investigation: Investigation) {
    this.records = this.records.map((record) => record.investigationId === investigation.investigationId ? investigation : record);
    return investigation;
  }
}

export const investigationRepository: InvestigationRepository = new MemoryInvestigationRepository();
