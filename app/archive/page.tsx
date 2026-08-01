import ArchiveClient from "./ArchiveClient";
import { getInvestigationRepository } from "@/lib/investigation/server";

export default async function ArchivePage() {
  const investigations = await (await getInvestigationRepository()).list();
  return <ArchiveClient investigations={investigations.filter((investigation) => investigation.status === "ready" && investigation.reportId)} />;
}
