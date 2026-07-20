import { attachPaymentIntent, markGenerating, markReady, saveInvestigation } from "./lifecycle";
import { investigationRepository, type InvestigationRepository } from "./workflowRepository";
import type { Investigation } from "./types";

export class InvestigationWorkflowService {
  constructor(private readonly repository: InvestigationRepository = investigationRepository) {}

  list() { return this.repository.list(); }
  start(target: string, userId = "maya-chen") {
    return this.repository.create({ target: target.trim(), userId });
  }
  async advance(investigation: Investigation) {
    if (investigation.status === "preview") return this.repository.save(saveInvestigation(investigation));
    if (investigation.status === "saved") return this.repository.save(attachPaymentIntent(investigation, `pi-${investigation.investigationId}`));
    if (investigation.status === "payment_pending") return this.repository.save(markGenerating(investigation));
    if (investigation.status === "generating") return this.repository.save(markReady(investigation, {
      verificationScore: 78,
      evidenceRefs: ["identity-record", "domain-record"],
      narrativeSummary: "Evidence collection is complete and ready for analyst review.",
    }));
    return investigation;
  }
}

export const investigationWorkflowService = new InvestigationWorkflowService();
