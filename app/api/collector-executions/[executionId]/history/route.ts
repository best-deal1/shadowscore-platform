import { NextResponse } from "next/server";
import { getWorkspaceAccessToken } from "@/lib/workspace/actor.server";
import { resolveWorkspaceActor, WorkspaceAccessError } from "@/lib/workspace/actor";
import { supabaseFetch } from "@/lib/supabase";
import { listExecutionEvents } from "@/lib/collectorRuntime/supabase";
type Context={params:Promise<{executionId:string}>};
export async function GET(_request:Request,context:Context){const token=await getWorkspaceAccessToken();let actor;try{actor=await resolveWorkspaceActor(token,supabaseFetch);}catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:"Authentication is required."},{status:401});throw error;}const {executionId}=await context.params;return NextResponse.json({executionId,events:await listExecutionEvents(actor.organizationId,executionId,token!)});}
