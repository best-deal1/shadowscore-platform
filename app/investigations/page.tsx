import { getInvestigationRepository } from "@/lib/investigation/server";
import { InvestigationWorkspace } from "./_components/InvestigationWorkspace";

export default async function InvestigationsPage() {
  const investigations = await (await getInvestigationRepository()).list();
  return <InvestigationWorkspace initialInvestigations={investigations} />;
}
