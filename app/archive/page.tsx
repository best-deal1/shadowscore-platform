import { requireWorkspaceActor } from "@/lib/workspace/actor.server";
import { listWorkspaceQueue } from "@/lib/workspace/queue.server";
import { ArchiveWorkspace } from "./ArchiveWorkspace";

export default async function ArchivePage() {
  const actor = await requireWorkspaceActor();
  const queue = await listWorkspaceQueue(actor);
  return <ArchiveWorkspace initialInvestigations={queue.cases} canManage={actor.role !== "viewer"} />;
}
