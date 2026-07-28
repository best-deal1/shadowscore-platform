import type { EvidenceRepository, Json } from "../evidenceV2/types";
import type { Subject, SubjectIdentifier } from "../platformCore/types";

export type CollectorHealth = "healthy" | "degraded" | "disabled";
export type ExecutionStatus = "pending" | "queued" | "running" | "succeeded" | "failed" | "retried" | "completed" | "cancelled";
export type RetryPolicy = { maxAttempts:number; baseDelayMs:number; maxDelayMs:number };
export type CollectorDefinition = { collectorKey:string; version:string; capability:string; supportedSubjectTypes:string[]; supportedIdentifierTypes:string[]; requiredProviders:string[]; requiredEntitlements:string[]; pricingCategory:string; timeoutMs:number; retryPolicy:RetryPolicy; priority:number; dependencies:string[]; healthStatus:CollectorHealth };
export type CollectorObservation = { observationId:string; observationType:string; observationKey:string; value:Json; observedAt:string; validFrom:string; validTo?:string|null; metadata:Record<string,Json> };
export type CollectorOutput = { observations:CollectorObservation[]; metrics:Record<string,number>; warnings:string[]; errors:string[]; executionCost:{amount:number;currency:string} };
export type CancellationToken = { readonly cancelled:boolean; throwIfCancelled():void };
export type RuntimeLogger = { info(message:string,fields?:Record<string,unknown>):void; warn(message:string,fields?:Record<string,unknown>):void; error(message:string,fields?:Record<string,unknown>):void };
export type RuntimeMetrics = { increment(name:string,value?:number):void; timing(name:string,milliseconds:number):void };
export type ExecutionContext = Readonly<{ subject:Subject; identifiers:readonly SubjectIdentifier[]; workspace:Readonly<{workspaceId:string}>; investigation:Readonly<{investigationId:string}>; execution:Readonly<{executionId:string;attempt:number}>; pricing:Readonly<{currency:string;category:string}>; permissions:readonly string[]; cancellationToken:CancellationToken; logger:RuntimeLogger; metrics:RuntimeMetrics; evidenceRepository:EvidenceRepository }>;
export interface Collector { readonly definition:CollectorDefinition; validate(context:ExecutionContext):Promise<void>; collect(context:ExecutionContext):Promise<CollectorOutput> }
export type ExecutionPlanItem = { collectorKey:string; version:string; priority:number; dependencies:string[] };
export type ExecutionPlan = { planId:string; investigationId:string; collectors:ExecutionPlanItem[]; createdAt:string };
export type ExecutionEvent = { eventId:string; executionId:string; status:ExecutionStatus; occurredAt:string; attempt:number; details:Record<string,unknown> };
export type CollectorExecution = { executionId:string; investigationId:string; collectorKey:string; collectorVersion:string; idempotencyKey:string; status:ExecutionStatus; attemptCount:number; leaseOwner:string|null; leaseExpiresAt:string|null; createdAt:string; completedAt:string|null };
export interface ExecutionRepository { create(value:CollectorExecution):Promise<{execution:CollectorExecution;created:boolean}>; get(executionId:string):Promise<CollectorExecution|null>; save(execution:CollectorExecution):Promise<void>; appendEvent(event:ExecutionEvent):Promise<void>; history(executionId:string):Promise<ExecutionEvent[]> }

export type ProviderHealthSnapshot = { collectorKey:string; status:CollectorHealth; consecutiveFailures:number; successCount:number; failureCount:number; lastStartedAt:string|null; lastSucceededAt:string|null; lastFailedAt:string|null; lastError:string|null };
export type PipelineCollectorResult = { collectorKey:string; status:"succeeded"|"failed"|"skipped"; output:CollectorOutput|null; execution:CollectorExecution|null; cached:boolean; error:string|null };
export type PipelineAuditEvent = { eventId:string; pipelineRunId:string; investigationId:string; type:"pipeline_started"|"collector_started"|"collector_completed"|"collector_failed"|"collector_skipped"|"pipeline_completed"; occurredAt:string; collectorKey:string|null; details:Record<string,unknown> };
export type PipelineRunResult = { pipelineRunId:string; investigationId:string; startedAt:string; completedAt:string; status:"completed"|"partial"|"failed"; collectors:PipelineCollectorResult[]; auditLog:PipelineAuditEvent[] };
