import { NextResponse } from "next/server";
import { getWorkspaceAccessToken } from "@/lib/workspace/actor.server";
import { resolveWorkspaceActor, WorkspaceAccessError } from "@/lib/workspace/actor";
import { supabaseFetch } from "@/lib/supabase";
import { collectorRegistry } from "@/lib/collectorRuntime";
export async function GET(){const token=await getWorkspaceAccessToken();try{await resolveWorkspaceActor(token,supabaseFetch);}catch(error){if(error instanceof WorkspaceAccessError)return NextResponse.json({error:"Authentication is required."},{status:401});throw error;}return NextResponse.json({collectors:collectorRegistry.list()});}
