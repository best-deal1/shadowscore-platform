import { NextResponse } from "next/server";
import { getWorkspaceAccessToken } from "@/lib/workspace/actor.server";
import { resolveWorkspaceActor, WorkspaceAccessError } from "@/lib/workspace/actor";
import { supabaseFetch } from "@/lib/supabase";
import { enqueueWebsiteInvestigation, hasInvestigationEntitlement } from "@/lib/platformCore/supabase";
import { InvalidSubjectIdentifierError, normalizeDomain } from "@/lib/platformCore";

export async function POST(request:Request){
  const token=await getWorkspaceAccessToken(); let actor;
  try{actor=await resolveWorkspaceActor(token,supabaseFetch);}catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:"Authentication is required."},{status:401});throw error;}
  const body=await request.json().catch(()=>null) as {target?:unknown;subjectType?:unknown}|null;
  if(body?.subjectType!==undefined&&!['domain','website'].includes(String(body.subjectType)))return NextResponse.json({error:"Phase 1 accepts domain and website investigations."},{status:422});
  let target:string; try{target=normalizeDomain(typeof body?.target==="string"?body.target:"");}catch(error){if(error instanceof InvalidSubjectIdentifierError)return NextResponse.json({error:error.message},{status:422});throw error;}
  if(!await hasInvestigationEntitlement(actor.organizationId,token!))return NextResponse.json({error:"An active investigation entitlement is required."},{status:403});
  const supplied=request.headers.get("idempotency-key")?.trim(); const idempotencyKey=supplied||`${actor.organizationId}:website:${target}`;
  const result=await enqueueWebsiteInvestigation({target,idempotencyKey,accessToken:token!});
  return NextResponse.json({job:result.job,statusUrl:`/api/investigations/${result.job.investigationJobId}`},{status:result.created?202:200});
}
