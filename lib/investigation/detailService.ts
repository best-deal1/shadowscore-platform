import { buildInvestigationDetail } from "./detail";
import { investigationRepository, type InvestigationRepository } from "./workflowRepository";

/** Read boundary for the Investigation Details workspace. Replace the repository adapter when persistent case data is available. */
export class InvestigationDetailService {
  constructor(private readonly repository: InvestigationRepository = investigationRepository) {}

  async get(investigationId: string) {
    const investigations = await this.repository.list();
    const investigation = investigations.find((item) => item.investigationId === investigationId);
    return investigation ? buildInvestigationDetail(investigation) : null;
  }
}

export const investigationDetailService = new InvestigationDetailService();
