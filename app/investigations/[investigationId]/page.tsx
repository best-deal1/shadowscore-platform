import { notFound } from "next/navigation";
import { investigationDetailService } from "@/lib/investigation";
import { InvestigationDetailsWorkspace } from "../_components/InvestigationDetailsWorkspace";

export default async function InvestigationDetailsPage({ params }: { params: Promise<{ investigationId: string }> }) {
  const { investigationId } = await params;
  const detail = await investigationDetailService.get(investigationId);
  if (!detail) notFound();
  return <InvestigationDetailsWorkspace detail={detail} />;
}
