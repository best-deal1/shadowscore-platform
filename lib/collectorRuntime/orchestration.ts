import type { MonitoringSnapshot } from "../continuousMonitoring/types";
import type { ExecutionPlan, ExecutionContext, CollectorOutput, PipelineAuditEvent, PipelineCollectorResult, PipelineRunResult, ProviderHealthSnapshot } from "./types";
import { CollectorRuntime } from "./runtime";

export interface CollectorCache { get(key:string):Promise<CollectorOutput|null>; set(key:string,value:CollectorOutput,ttlMs:number):Promise<void> }
export class MemoryCollectorCache implements CollectorCache {
  private readonly values=new Map<string,{output:CollectorOutput;expiresAt:number}>();
  private readonly clock:()=>number;
  constructor(clock=()=>Date.now()){this.clock=clock;}
  async get(key:string){const hit=this.values.get(key);if(!hit)return null;if(hit.expiresAt<=this.clock()){this.values.delete(key);return null;}return structuredClone(hit.output);}
  async set(key:string,value:CollectorOutput,ttlMs:number){this.values.set(key,{output:structuredClone(value),expiresAt:this.clock()+ttlMs});}
}

export interface RateLimiter { acquire(key:string):Promise<void> }
export class SlidingWindowRateLimiter implements RateLimiter {
  private readonly calls=new Map<string,number[]>();
  private readonly limit:number;private readonly windowMs:number;private readonly clock:()=>number;private readonly sleep:(ms:number)=>Promise<void>;
  constructor(limit=10,windowMs=1_000,clock=()=>Date.now(),sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms))){this.limit=limit;this.windowMs=windowMs;this.clock=clock;this.sleep=sleep;}
  async acquire(key:string){for(;;){const now=this.clock();const recent=(this.calls.get(key)??[]).filter(value=>value>now-this.windowMs);if(recent.length<this.limit){recent.push(now);this.calls.set(key,recent);return;}await this.sleep(Math.max(1,recent[0]+this.windowMs-now));}}
}

export class ProviderHealthTracker {
  private readonly health=new Map<string,ProviderHealthSnapshot>();
  private readonly failureThreshold:number;
  constructor(failureThreshold=3){this.failureThreshold=failureThreshold;}
  started(key:string,at:string){const value=this.value(key);this.health.set(key,{...value,lastStartedAt:at});}
  succeeded(key:string,at:string){const value=this.value(key);this.health.set(key,{...value,status:"healthy",consecutiveFailures:0,successCount:value.successCount+1,lastSucceededAt:at,lastError:null});}
  failed(key:string,at:string,error:string){const value=this.value(key);const failures=value.consecutiveFailures+1;this.health.set(key,{...value,status:failures>=this.failureThreshold?"disabled":"degraded",consecutiveFailures:failures,failureCount:value.failureCount+1,lastFailedAt:at,lastError:error});}
  get(key:string){return structuredClone(this.value(key));}
  list(){return [...this.health.values()].map(value=>structuredClone(value)).sort((a,b)=>a.collectorKey.localeCompare(b.collectorKey));}
  private value(key:string):ProviderHealthSnapshot{return this.health.get(key)??{collectorKey:key,status:"healthy",consecutiveFailures:0,successCount:0,failureCount:0,lastStartedAt:null,lastSucceededAt:null,lastFailedAt:null,lastError:null};}
}

type RunnerOptions={concurrency?:number;cache?:CollectorCache;cacheTtlMs?:number;rateLimiter?:RateLimiter;health?:ProviderHealthTracker;now?:()=>string};
export class CollectorPipelineRunner {
  private readonly runtime:CollectorRuntime;private readonly concurrency:number; private readonly cache:CollectorCache; private readonly cacheTtlMs:number; private readonly limiter:RateLimiter; readonly health:ProviderHealthTracker; private readonly now:()=>string;
  constructor(runtime:CollectorRuntime,options:RunnerOptions={}){this.runtime=runtime;this.concurrency=Math.max(1,options.concurrency??4);this.cache=options.cache??new MemoryCollectorCache();this.cacheTtlMs=options.cacheTtlMs??300_000;this.limiter=options.rateLimiter??new SlidingWindowRateLimiter();this.health=options.health??new ProviderHealthTracker();this.now=options.now??(()=>new Date().toISOString());}
  async run(input:{plan:ExecutionPlan;context:Omit<ExecutionContext,"execution">;idempotencyPrefix:string;leaseOwner:string;leaseMs?:number;cacheScope?:string}):Promise<PipelineRunResult>{
    const pipelineRunId=crypto.randomUUID(),startedAt=this.now(),auditLog:PipelineAuditEvent[]=[];const results=new Map<string,PipelineCollectorResult>();
    const audit=(type:PipelineAuditEvent["type"],collectorKey:string|null,details:Record<string,unknown>={})=>auditLog.push({eventId:crypto.randomUUID(),pipelineRunId,investigationId:input.plan.investigationId,type,occurredAt:this.now(),collectorKey,details});
    audit("pipeline_started",null,{planId:input.plan.planId,collectorCount:input.plan.collectors.length});
    let pending=[...input.plan.collectors];
    while(pending.length){const ready=pending.filter(item=>item.dependencies.every(key=>results.has(key)));if(!ready.length){for(const item of pending){results.set(item.collectorKey,{collectorKey:item.collectorKey,status:"skipped",output:null,execution:null,cached:false,error:"Dependency cycle or missing dependency."});audit("collector_skipped",item.collectorKey,{reason:"unresolved_dependency"});}break;}pending=pending.filter(item=>!ready.includes(item));
      for(let offset=0;offset<ready.length;offset+=this.concurrency)await Promise.all(ready.slice(offset,offset+this.concurrency).map(async item=>{const blocked=item.dependencies.find(key=>results.get(key)?.status!=="succeeded");if(blocked){results.set(item.collectorKey,{collectorKey:item.collectorKey,status:"skipped",output:null,execution:null,cached:false,error:`Dependency ${blocked} did not succeed.`});audit("collector_skipped",item.collectorKey,{dependency:blocked});return;}const cacheKey=[input.plan.investigationId,input.cacheScope??input.context.subject.canonicalName,input.context.subject.canonicalName,item.collectorKey,item.version].join(":");const cached=await this.cache.get(cacheKey);if(cached){results.set(item.collectorKey,{collectorKey:item.collectorKey,status:"succeeded",output:cached,execution:null,cached:true,error:null});audit("collector_completed",item.collectorKey,{cached:true});return;}await this.limiter.acquire(item.collectorKey);const at=this.now();this.health.started(item.collectorKey,at);audit("collector_started",item.collectorKey);
        try{const result=await this.runtime.execute({collectorKey:item.collectorKey,version:item.version,idempotencyKey:`${input.idempotencyPrefix}:${item.collectorKey}:${item.version}`,leaseOwner:input.leaseOwner,leaseMs:input.leaseMs??60_000,context:input.context});if(!result.output)throw new Error("Collector execution completed without reusable output.");await this.cache.set(cacheKey,result.output,this.cacheTtlMs);this.health.succeeded(item.collectorKey,this.now());results.set(item.collectorKey,{collectorKey:item.collectorKey,status:"succeeded",output:result.output,execution:result.execution,cached:false,error:null});audit("collector_completed",item.collectorKey,{executionId:result.execution.executionId,cached:false});}catch(error){const message=error instanceof Error?error.message:"Collector failed.";this.health.failed(item.collectorKey,this.now(),message);results.set(item.collectorKey,{collectorKey:item.collectorKey,status:"failed",output:null,execution:null,cached:false,error:message});audit("collector_failed",item.collectorKey,{error:message});}}));}
    const collectors=input.plan.collectors.map(item=>results.get(item.collectorKey)!);const succeeded=collectors.filter(item=>item.status==="succeeded").length;const status=succeeded===collectors.length?"completed":succeeded?"partial":"failed";audit("pipeline_completed",null,{status,succeeded,total:collectors.length});return {pipelineRunId,investigationId:input.plan.investigationId,startedAt,completedAt:this.now(),status,collectors,auditLog};
  }
}

export function snapshotFromPipeline(input:{run:PipelineRunResult;monitoredEntityId:string;previousTrustScore:number;capturedAt?:string}):MonitoringSnapshot {
  const values:MonitoringSnapshot["values"]={};let trustScore=input.previousTrustScore;
  for(const result of input.run.collectors){if(result.status==="failed"){values.provider_failure={provider:result.collectorKey,error:result.error};continue;}for(const observation of result.output?.observations??[]){const category=observation.metadata.alertCategory;if(typeof category==="string"&&["identity","website","dns","ssl","email_authentication","security_headers","whois","sec_filing","regulatory_event","marketplace_status","trust_score"].includes(category))values[category as keyof typeof values]=observation.value;if(category==="trust_score"&&typeof observation.value==="number")trustScore=observation.value;}}
  return {id:`snapshot-${input.run.pipelineRunId}`,monitoredEntityId:input.monitoredEntityId,trustScore,capturedAt:input.capturedAt??input.run.completedAt,values};
}
