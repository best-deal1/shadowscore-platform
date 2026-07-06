import type { WorkspaceData } from "./workspace";

export const emptyWorkspace: WorkspaceData = { reports: [], intakes: [], entities: [], acceptances: [], paymentIntents: [] };
const memoryWorkspaces = new Map<string, WorkspaceData>();

export function cloneWorkspace(data: WorkspaceData): WorkspaceData {
  return JSON.parse(JSON.stringify(data)) as WorkspaceData;
}

export function getMutableMemoryWorkspace(userId: string) {
  const existing = memoryWorkspaces.get(userId) || emptyWorkspace;
  const copy = cloneWorkspace(existing);
  memoryWorkspaces.set(userId, copy);
  return copy;
}
