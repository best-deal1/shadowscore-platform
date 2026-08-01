import type { InvestigationRepository } from "./workflowRepository";

export class InvestigationWorkflowService {
  constructor(private readonly repository: InvestigationRepository) {}

  list() { return this.repository.list(); }
  get(investigationId: string) { return this.repository.get(investigationId); }
  start(target: string) { return this.repository.create({ target }); }
}
