import { requireWorkspaceActor, WorkspaceHttpError } from "@/lib/workspace/server/auth";
import { createCase, listCases } from "@/lib/workspace/server/service";
function failure(error:unknown){const e=error instanceof WorkspaceHttpError?error:new WorkspaceHttpError(500,"workspace_error");return Response.json({error:{code:e.code}}, {status:e.status});}
export async function GET(request:Request){try{return Response.json(await listCases(await requireWorkspaceActor(request),new URL(request.url).searchParams));}catch(error){return failure(error);}}
export async function POST(request:Request){try{const body=await request.json().catch(()=>null);if(!body||typeof body!=="object")throw new WorkspaceHttpError(400,"validation_error");const result=await createCase(await requireWorkspaceActor(request),body,request.headers.get("idempotency-key"));return Response.json(result,{status:201});}catch(error){return failure(error);}}
