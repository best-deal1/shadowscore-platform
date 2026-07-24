import { notFound } from "next/navigation";
import { CaseNotFoundError } from "@/lib/workspace/cases";
import { requireWorkspaceActor } from "@/lib/workspace/actor.server";
import { getWorkspaceCase } from "@/lib/workspace/case.server";
import { CaseDetailsWorkspace } from "../_components/CaseDetailsWorkspace";

export const dynamic = "force-dynamic";

export default async function CaseDetailsPage({ params }: PageProps<"/cases/[caseId]">) {
  const [{ caseId }, actor] = await Promise.all([params, requireWorkspaceActor()]);
  let caseDetail;
  try {
    caseDetail = await getWorkspaceCase(actor, caseId);
  } catch (error) {
    if (error instanceof CaseNotFoundError) notFound();
    throw error;
  }
  return <CaseDetailsWorkspace caseDetail={caseDetail} ownerName={actor.name} canEdit={actor.role !== "viewer"} />;
}
