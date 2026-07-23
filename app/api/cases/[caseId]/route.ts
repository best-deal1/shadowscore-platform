import { requireWorkspaceActor, WorkspaceHttpError } from "@/lib/workspace/server/auth";
import { getCase, updateCase } from "@/lib/workspace/server/service";
function failure(error:unknown){const e=error instanceof WorkspaceHttpError?error:new WorkspaceHttpError(500,"workspace_error");return Response.json({error:{code:e.code}}, {status:e.status});}
export async function GET(request:Request,{params}:{params:Promise<{caseId:string}>}){try{return Response.json({case:await getCase(await requireWorkspaceActor(request),(await params).caseId)});}catch(error){return failure(error);}}
export async function PATCH(request:Request,{params}:{params:Promise<{caseId:string}>}){try{const body=await request.json().catch(()=>null);if(!body||typeof body!=="object")throw new WorkspaceHttpError(400,"validation_error");return Response.json(await updateCase(await requireWorkspaceActor(request),(await params).caseId,body,request.headers.get("idempotency-key")));}catch(error){return failure(error);}}
