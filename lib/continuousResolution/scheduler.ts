import type { ContinuousResolutionEngine } from "./runtime";
import type { ResolutionJob } from "./types";

export class ResolutionScheduler {
  private readonly jobs: ResolutionJob[] = [];
  private readonly accepted = new Set<string>();
  private readonly engine: ContinuousResolutionEngine;
  activeWorkers = 0;
  constructor(engine: ContinuousResolutionEngine) { this.engine = engine; }
  enqueue(job: Omit<ResolutionJob,"jobId"|"attempts"|"status"|"error">) {
    const existing=this.jobs.find(item=>item.idempotencyKey===job.idempotencyKey);if(existing)return structuredClone(existing);
    const created:ResolutionJob={...structuredClone(job),jobId:`job-${this.jobs.length+1}`,attempts:0,status:"queued",error:null};this.jobs.push(created);return structuredClone(created);
  }
  async drain(limit=25) { const selected=this.jobs.filter(job=>job.status==="queued").slice(0,limit);this.activeWorkers++;
    try { for(const job of selected){job.status="running";job.attempts++;try{if(!this.accepted.has(job.idempotencyKey)){await this.process(job);this.accepted.add(job.idempotencyKey);}job.status="completed";job.error=null;}catch(error){job.error=error instanceof Error?error.message:String(error);job.status=job.attempts<job.maxAttempts?"queued":"failed";}} } finally {this.activeWorkers--;}
    return selected.map(job => structuredClone(job));
  }
  snapshot(){return this.jobs.map(job => structuredClone(job));}
  get backlog(){return this.jobs.filter(job=>job.status==="queued"||job.status==="running").length;}
  private async process(job:ResolutionJob){if(job.reason==="new_observation"||job.reason==="source_update"){if(!job.observation)throw new Error("Observation job payload is required.");this.engine.addObservation(job.observation,job.entityId);}else if(job.reason==="policy_change"){if(!job.policy)throw new Error("Policy job payload is required.");this.engine.changePolicy(job.policy,job.workspaceId,new Date(0).toISOString());}else if(job.reason==="evidence_expiration"){if(!job.observation)throw new Error("Evidence expiration payload is required.");this.engine.expireEvidence(job.observation.observationId,new Date(0).toISOString());}else if(job.entityId){this.engine.projection(job.entityId);}}
}
