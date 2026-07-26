import { NextResponse } from "next/server";
import { getWorkspaceAccessToken } from "@/lib/workspace/actor.server";
import { resolveWorkspaceActor, WorkspaceAccessError } from "@/lib/workspace/actor";
import { supabaseFetch } from "@/lib/supabase";
import { readSubjectKnowledge, type KnowledgeView } from "./supabase";
export async function knowledgeRoute(request:Request,context:{params:Promise<{subjectId:string}>},view:KnowledgeView){
 const token=await getWorkspaceAccessToken();try{const actor=await resolveWorkspaceActor(token,supabaseFetch);const {subjectId}=await context.params;const data=await readSubjectKnowledge({view,subjectId,workspaceId:actor.organizationId,token:token!,params:new URL(request.url).searchParams});return NextResponse.json({subjectId,view,data,provenanceIncluded:true});}catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:"Authentication is required."},{status:401});throw error;}
}
