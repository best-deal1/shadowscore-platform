import { NextResponse } from "next/server";
import { getWorkspaceAccessToken } from "@/lib/workspace/actor.server";
import { resolveWorkspaceActor, WorkspaceAccessError } from "@/lib/workspace/actor";
import { supabaseFetch } from "@/lib/supabase";
import { getInvestigationJob } from "@/lib/platformCore/supabase";

export async function GET(_request:Request,context:RouteContext<"/api/investigations/[investigationId]">){
  const token=await getWorkspaceAccessToken();try{await resolveWorkspaceActor(token,supabaseFetch);}catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:"Authentication is required."},{status:401});throw error;}
  const {investigationId}=await context.params;const result=await getInvestigationJob(investigationId,token!);if(!result)return NextResponse.json({error:"Investigation not found."},{status:404});return NextResponse.json(result);
}
