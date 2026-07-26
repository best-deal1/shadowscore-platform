import { NextResponse } from "next/server";
import { getWorkspaceAccessToken } from "@/lib/workspace/actor.server";
import { resolveWorkspaceActor, WorkspaceAccessError } from "@/lib/workspace/actor";
import { supabaseFetch } from "@/lib/supabase";
import { getCurrentEvidence } from "@/lib/evidenceV2/supabase";
type Context={params:Promise<{subjectId:string}>};
export async function GET(request:Request,context:Context){
 const token=await getWorkspaceAccessToken();try{await resolveWorkspaceActor(token,supabaseFetch);}catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:"Authentication is required."},{status:401});throw error;}
 const {subjectId}=await context.params;const taxonomy=new URL(request.url).searchParams.get("taxonomy")??undefined;const assertions=await getCurrentEvidence(subjectId,token!,taxonomy);return NextResponse.json({subjectId,assertions,projection:true});
}
