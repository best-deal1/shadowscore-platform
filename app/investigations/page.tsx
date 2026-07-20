import { investigationWorkflowService } from "@/lib/investigation/workflowService";
import { InvestigationWorkspace } from "./_components/InvestigationWorkspace";

export default async function InvestigationsPage() {
  const investigations = await investigationWorkflowService.list();
  return <InvestigationWorkspace initialInvestigations={investigations} />;
}
