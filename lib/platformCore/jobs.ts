import type { InvestigationJob, InvestigationStage, JobStatus } from "./types";

const transitions:Record<JobStatus,readonly JobStatus[]>={queued:["running","cancelled"],running:["completed","waiting_retry","failed","cancelled"],waiting_retry:["running","failed","cancelled"],completed:[],failed:[],cancelled:[]};
export class InvalidJobTransitionError extends Error {}
export function transitionJob(job:InvestigationJob,status:JobStatus,at=new Date()):InvestigationJob {
  if (!transitions[job.status].includes(status)) throw new InvalidJobTransitionError(`Invalid investigation transition: ${job.status} to ${status}.`);
  const iso=at.toISOString(); return {...job,status,startedAt:status==="running"?(job.startedAt??iso):job.startedAt,completedAt:status==="completed"?iso:job.completedAt,failedAt:status==="failed"?iso:job.failedAt,nextRetryAt:status==="waiting_retry"?job.nextRetryAt:null,leaseOwner:["completed","failed","cancelled","waiting_retry"].includes(status)?null:job.leaseOwner,leaseExpiresAt:["completed","failed","cancelled","waiting_retry"].includes(status)?null:job.leaseExpiresAt};
}
export function retryDelayMs(attempt:number){return Math.min(60*60_000,30_000*2**Math.max(0,attempt-1));}
export const WEBSITE_STAGES=["subject_resolution","provider_planning","evidence_collection","normalization","decision","report_generation","history_persistence","alert_generation","watchlist_update"] as const;
export function createStages(jobId:string,at=new Date()):InvestigationStage[]{return WEBSITE_STAGES.map(stageName=>({stageId:crypto.randomUUID(),investigationJobId:jobId,stageName,status:stageName==="subject_resolution"?"completed":"pending",attemptCount:stageName==="subject_resolution"?1:0,startedAt:stageName==="subject_resolution"?at.toISOString():null,completedAt:stageName==="subject_resolution"?at.toISOString():null,nextRetryAt:null,failureCode:null,sanitizedFailureMessage:null,inputReference:null,outputReference:null,metadata:{}}));}
