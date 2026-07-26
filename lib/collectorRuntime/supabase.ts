import "server-only";
import { supabaseFetch } from "@/lib/supabase";
export async function listCollectorExecutions(workspaceId:string,accessToken:string,executionId?:string){const filter=executionId?`&execution_id=eq.${encodeURIComponent(executionId)}`:"";return supabaseFetch<Record<string,unknown>[]>(`/rest/v1/collector_executions?workspace_id=eq.${encodeURIComponent(workspaceId)}${filter}&select=*&order=created_at.desc`,{},accessToken);}
export async function listExecutionEvents(workspaceId:string,executionId:string,accessToken:string){return supabaseFetch<Record<string,unknown>[]>(`/rest/v1/execution_events?workspace_id=eq.${encodeURIComponent(workspaceId)}&execution_id=eq.${encodeURIComponent(executionId)}&select=*&order=occurred_at.asc`,{},accessToken);}
