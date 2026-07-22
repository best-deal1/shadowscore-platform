import { investigationWorkflowService } from "@/lib/investigation/workflowService";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const target = typeof body.target === "string" ? body.target.trim() : "";

  if (!target) {
    return Response.json({ error: "A target is required." }, { status: 400 });
  }

  const investigation = await investigationWorkflowService.start(target);
  return Response.json(investigation, { status: 201 });
}
