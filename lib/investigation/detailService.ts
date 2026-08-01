import { buildInvestigationDetail } from "./detail";
import type { InvestigationRepository } from "./workflowRepository";

/** Read boundary for the Investigation Details workspace. Replace the repository adapter when persistent case data is available. */
export class InvestigationDetailService {
  constructor(private readonly repository: InvestigationRepository) {}

  async get(investigationId: string) {
    const investigation = await this.repository.get(investigationId);
    return investigation ? buildInvestigationDetail(investigation) : null;
  }
}
