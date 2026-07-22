import { investigationWorkflowService } from "@/lib/investigation/workflowService";

export async function POST(_request: Request, context: RouteContext<"/api/investigations/[investigationId]">) {
  const { investigationId } = await context.params;
  const investigation = (await investigationWorkflowService.list()).find((item) => item.investigationId === investigationId);

  if (!investigation) {
    return Response.json({ error: "Investigation not found." }, { status: 404 });
  }

  return Response.json(await investigationWorkflowService.advance(investigation));
}
