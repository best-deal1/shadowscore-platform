import "server-only";
import { createHash } from "node:crypto";
import { investigateLive, createCanonicalPaidProviders } from "./investigationCollection";
import type { InvestigationGraph } from "./investigationEngine/types";

type Job = { investigation_job_id:string; canonical_investigation_id:string; payment_intent_id:string; subject_id:string; workspace_id:string; requested_by_user_id:string; attempt_count:number; lease_owner?:string };
type Row = Record<string, unknown>;
const runId = (investigationId:string,providerId:string,seed:unknown,depth:number) => createHash("sha256").update(`${investigationId}:${providerId}:${JSON.stringify(seed)}:${depth}`).digest("hex");
export function canonicalConfidence(graph:InvestigationGraph, providerStatuses:string[]) {
  const completed=providerStatuses.filter((status)=>status==="completed").length,total=providerStatuses.length;
  const coverage=total?Math.round(completed/total*100):0;
  const reliability=graph.evidence.length?Math.min(100,Math.round(graph.evidence.reduce((sum,item)=>sum+item.source.reliability,0)/graph.evidence.length)):0;
  const identity=graph.entities.length?Math.min(100,Math.round(graph.entities.reduce((sum,item)=>sum+item.confidence,0)/graph.entities.length)):0;
  const unresolvedGaps=providerStatuses.filter((status)=>status!=="completed").length+graph.entities.filter((item)=>item.resolution==="unresolved"||item.resolution==="conflicting").length;
  return { coverage,sourceReliability:reliability,identityConfidence:identity,unresolvedGaps,decisionConfidence:Math.min(graph.decision.confidence,coverage,reliability||100,identity||100) };
}
export async function executeCanonicalPaidInvestigation(baseUrl:string,serviceKey:string,job:Job){
 const call=async(path:string,init:RequestInit={})=>{const response=await fetch(`${baseUrl}${path}`,{...init,headers:{apikey:serviceKey,authorization:`Bearer ${serviceKey}`,"content-type":"application/json",...init.headers}});if(!response.ok)throw new Error(`Canonical persistence failed with ${response.status}.`);return response.status===204?null:response.json();};
 const investigationId=job.canonical_investigation_id;
 const runs=await call(`/rest/v1/canonical_investigation_runs?investigation_id=eq.${encodeURIComponent(investigationId)}&select=seed,graph,status`) as Row[];
 if(!runs[0])throw new Error("Canonical investigation is unavailable.");
 if(runs[0].status==="ready"||runs[0].status==="partial")return {investigationId,reused:true};
 await call(`/rest/v1/canonical_investigation_runs?investigation_id=eq.${encodeURIComponent(investigationId)}`,{method:"PATCH",body:JSON.stringify({status:"running",started_at:new Date().toISOString(),updated_at:new Date().toISOString()})});
 const seed=runs[0].seed as {kind:"domain"|"company";value:string};
 const output=await investigateLive(seed,{providers:createCanonicalPaidProviders(),logger:console,onProgress:async({run,evidence})=>{
   await call("/rest/v1/canonical_provider_runs?on_conflict=provider_run_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates"},body:JSON.stringify({provider_run_id:runId(investigationId,run.providerId,run.seed,run.depth),investigation_id:investigationId,provider_id:run.providerId,seed:run.seed,depth:run.depth,status:run.status,attempts:run.attempts,evidence_count:run.evidenceCount,failure_message:run.error||null,updated_at:new Date().toISOString()})});
   if(evidence.length)await call("/rest/v1/canonical_evidence_assertions?on_conflict=investigation_id,evidence_id",{method:"POST",headers:{Prefer:"resolution=ignore-duplicates"},body:JSON.stringify(evidence.map(item=>({investigation_id:investigationId,evidence_id:item.evidenceId,assertion:item,source_id:item.source.sourceId,source_url:item.source.sourceUrl||null,retrieved_at:item.source.retrievedAt,observed_value:item.value,source_reliability:item.source.reliability})))});
 }});
 const confidence=canonicalConfidence(output.graph,output.providerRuns.map(item=>item.status));
 const useful=output.graph.evidence.length>0,status=useful&&output.providerRuns.some(item=>item.status!=="completed")?"partial":useful?"ready":"failed";
 await call(`/rest/v1/canonical_investigation_runs?investigation_id=eq.${encodeURIComponent(investigationId)}`,{method:"PATCH",body:JSON.stringify({status,graph:output.graph,confidence_projection:confidence,provider_summary:{runs:output.providerRuns,limits:output.limits,spentUsd:output.spentUsd},completed_at:new Date().toISOString(),updated_at:new Date().toISOString()})});
 if(!useful)throw new Error("No live evidence was collected.");
 const risk={proceed:20,proceed_with_conditions:45,investigate:70,stop:90}[output.graph.decision.outcome];
 await call(`/rest/v1/reports?payment_intent_id=eq.${job.payment_intent_id}`,{method:"PATCH",body:JSON.stringify({risk_score:risk,confidence_score:confidence.decisionConfidence,stage:risk>=70?"Critical":risk>=45?"Warning":"Healthy",source:"canonical_paid_investigation",risk_engine_version:output.graph.engineVersion,provider_versions:Object.fromEntries(output.providerRuns.map(item=>[item.providerId,"canonical-adapter-v1"])),evidence_snapshot:{investigationId,evidence:output.graph.evidence,entities:output.graph.entities,contradictions:output.graph.contradictions,confidence},provider_results:[],score_explanation:output.graph.decision.summary,payment_status:"paid",report_status:"ready",ready_at:new Date().toISOString(),metadata:{investigationId,canonicalGraph:output.graph,confidence,reportSummary:{message:output.graph.decision.summary,findingCount:output.graph.evidence.length}}})});
 await call(`/rest/v1/intakes?intake_id=eq.${encodeURIComponent(investigationId)}`,{method:"PATCH",body:JSON.stringify({report_status:"ready",updated_at:new Date().toISOString()})});
 await call(`/rest/v1/cases?investigation_id=eq.${encodeURIComponent(investigationId)}`,{method:"PATCH",body:JSON.stringify({status:"completed",updated_at:new Date().toISOString()})});
 await call(`/rest/v1/investigation_jobs?investigation_job_id=eq.${job.investigation_job_id}`,{method:"PATCH",body:JSON.stringify({status:"completed",current_stage:"report_ready",completed_at:new Date().toISOString(),lease_owner:null,lease_expires_at:null,metadata:{investigationId,canonicalStatus:status}})});
 return {investigationId,status,evidenceCount:output.graph.evidence.length,confidence};
}
