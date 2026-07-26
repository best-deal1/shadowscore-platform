import "server-only";
import { supabaseFetch } from "@/lib/supabase";
import type { InvestigationJob, InvestigationStage } from "./types";

type JobRow={investigation_job_id:string;subject_id:string;workspace_id:string|null;requested_by_user_id:string|null;investigation_type:string;status:InvestigationJob["status"];priority:number;attempt_count:number;max_attempts:number;idempotency_key:string;current_stage:string|null;created_at:string;queued_at:string;started_at:string|null;completed_at:string|null;failed_at:string|null;next_retry_at:string|null;lease_owner:string|null;lease_expires_at:string|null;sanitized_failure_code:string|null;sanitized_failure_message:string|null;metadata:Record<string,unknown>};
const mapJob=(r:JobRow):InvestigationJob=>({investigationJobId:r.investigation_job_id,subjectId:r.subject_id,workspaceId:r.workspace_id,requestedByUserId:r.requested_by_user_id,investigationType:r.investigation_type,status:r.status,priority:r.priority,attemptCount:r.attempt_count,maxAttempts:r.max_attempts,idempotencyKey:r.idempotency_key,currentStage:r.current_stage,createdAt:r.created_at,queuedAt:r.queued_at,startedAt:r.started_at,completedAt:r.completed_at,failedAt:r.failed_at,nextRetryAt:r.next_retry_at,leaseOwner:r.lease_owner,leaseExpiresAt:r.lease_expires_at,sanitizedFailureCode:r.sanitized_failure_code,sanitizedFailureMessage:r.sanitized_failure_message,metadata:r.metadata});
type StageRow={stage_id:string;investigation_job_id:string;stage_name:string;status:InvestigationStage["status"];attempt_count:number;started_at:string|null;completed_at:string|null;next_retry_at:string|null;failure_code:string|null;sanitized_failure_message:string|null;input_reference:string|null;output_reference:string|null;metadata:Record<string,unknown>};
const mapStage=(r:StageRow):InvestigationStage=>({stageId:r.stage_id,investigationJobId:r.investigation_job_id,stageName:r.stage_name,status:r.status,attemptCount:r.attempt_count,startedAt:r.started_at,completedAt:r.completed_at,nextRetryAt:r.next_retry_at,failureCode:r.failure_code,sanitizedFailureMessage:r.sanitized_failure_message,inputReference:r.input_reference,outputReference:r.output_reference,metadata:r.metadata});

export async function enqueueWebsiteInvestigation(input:{target:string;idempotencyKey:string;accessToken:string}) {
  const rows=await supabaseFetch<Array<JobRow&{created:boolean}>>("/rest/v1/rpc/enqueue_website_investigation",{method:"POST",body:JSON.stringify({p_target:input.target,p_idempotency_key:input.idempotencyKey})},input.accessToken);
  if(!rows[0])throw new Error("The investigation could not be queued."); return {job:mapJob(rows[0]),created:rows[0].created};
}
export async function getInvestigationJob(id:string,accessToken:string){const jobs=await supabaseFetch<JobRow[]>(`/rest/v1/investigation_jobs?investigation_job_id=eq.${encodeURIComponent(id)}&select=*`,{},accessToken);if(!jobs[0])return null;const stages=await supabaseFetch<StageRow[]>(`/rest/v1/investigation_stages?investigation_job_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.asc`,{},accessToken);return {job:mapJob(jobs[0]),stages:stages.map(mapStage)};}
export async function hasInvestigationEntitlement(workspaceId:string,accessToken:string){const grants=await supabaseFetch<{product_id:string}[]>(`/rest/v1/entitlement_grants?workspace_id=eq.${encodeURIComponent(workspaceId)}&scope=eq.workspace&status=eq.active&select=product_id`,{},accessToken);return grants.length>0;}

type MonthlyUsageRow={period_start:string;investigations_used:number;monitoring_executions:number;ai_usage:number;provider_spend:number;storage_usage:number};
export async function getWorkspaceMonthlyUsage(workspaceId:string,accessToken:string,at=new Date()){
  const periodStart=new Date(Date.UTC(at.getUTCFullYear(),at.getUTCMonth(),1)).toISOString();
  const rows=await supabaseFetch<MonthlyUsageRow[]>(`/rest/v1/workspace_monthly_usage?workspace_id=eq.${encodeURIComponent(workspaceId)}&period_start=eq.${encodeURIComponent(periodStart)}&select=*`,{},accessToken);
  const row=rows[0];
  return {periodStart,periodEnd:new Date(Date.UTC(at.getUTCFullYear(),at.getUTCMonth()+1,1)).toISOString(),investigationsUsed:Number(row?.investigations_used??0),investigationsRemaining:null,monitoringExecutions:Number(row?.monitoring_executions??0),aiUsage:Number(row?.ai_usage??0),providerSpend:Number(row?.provider_spend??0),storageUsage:Number(row?.storage_usage??0),monthlyTotals:{currency:"USD",cost:Number(row?.provider_spend??0)}};
}
