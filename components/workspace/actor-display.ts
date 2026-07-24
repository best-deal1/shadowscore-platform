export function workspaceActorDisplayName(actor: { name: string; email: string }) {
  return actor.name || actor.email;
}
