import { redirect } from "next/navigation";

export default async function InvestigationDetailsPage({ params }: PageProps<"/investigations/[investigationId]">) {
  const { investigationId } = await params;
  redirect(`/cases/${encodeURIComponent(investigationId)}`);
}
