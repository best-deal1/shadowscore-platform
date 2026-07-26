import "server-only";
import { investigateWebsite } from "@/lib/websiteIntelligence";
import { createWebsiteChangeReport, type WebsiteScanSnapshot } from "@/lib/websiteIntelligence/history";
import { evidenceFreshness, FRESHNESS_POLICY } from "./evidence";

type ClaimedJob={investigation_job_id:string;subject_id:string;workspace_id:string;requested_by_user_id:string;attempt_count:number};
type SubjectRow={canonical_name:string};
type ScanRow={scan_id:string;scanned_at:string;scan_snapshot:WebsiteScanSnapshot["report"]};
export async function executeClaimedWebsiteJob(baseUrl:string,serviceKey:string,job:ClaimedJob){
 const call=async(path:string,init:RequestInit={})=>{const response=await fetch(`${baseUrl}${path}`,{...init,headers:{apikey:serviceKey,authorization:`Bearer ${serviceKey}`,"content-type":"application/json",...init.headers}});if(!response.ok)throw new Error(`Worker persistence failed with ${response.status}.`);return response.status===204?null:response.json();};
 const subjects=await call(`/rest/v1/subjects?subject_id=eq.${job.subject_id}&select=canonical_name`) as SubjectRow[];if(!subjects[0])throw new Error("Worker subject is unavailable.");
 const report=await investigateWebsite({target:subjects[0].canonical_name,retries:0,timeoutMs:5000});
 const previousRows=await call(`/rest/v1/website_intelligence_scans?subject_id=eq.${job.subject_id}&select=scan_id,scanned_at,scan_snapshot&order=scanned_at.desc&limit=1`) as ScanRow[];
 const previous=previousRows[0]?{scanId:previousRows[0].scan_id,target:report.target,scannedAt:previousRows[0].scanned_at,report:previousRows[0].scan_snapshot,changeReport:createWebsiteChangeReport(undefined,previousRows[0].scan_snapshot,previousRows[0].scan_id)}:undefined;
 const scanId=`wscan-${report.scannedAt.replace(/[^0-9]/g,"")}-${crypto.randomUUID()}`;const change=createWebsiteChangeReport(previous,report,scanId);
 await call("/rest/v1/website_intelligence_scans",{method:"POST",body:JSON.stringify({scan_id:scanId,user_id:job.requested_by_user_id,target:report.target,scanned_at:report.scannedAt,previous_scan_id:previous?.scanId??null,scan_snapshot:report,change_report:change,subject_id:job.subject_id,investigation_job_id:job.investigation_job_id})});
 const observations=report.modules.flatMap(module=>module.evidence.map(item=>({subject_id:job.subject_id,investigation_job_id:job.investigation_job_id,provider:`website-${module.moduleId}`,evidence_type:module.moduleId,normalized_key:item.id,normalized_value:String(item.value),confidence:module.confidence,observed_at:item.observedAt,valid_from:item.observedAt,freshness_status:evidenceFreshness(module.moduleId,new Date(item.observedAt)),source_reference:item.source,collector_version:"website-intelligence-v1",policy_version:FRESHNESS_POLICY.version,metadata:{scanId}})));
 if(observations.length)await call("/rest/v1/evidence_observations",{method:"POST",headers:{Prefer:"resolution=ignore-duplicates"},body:JSON.stringify(observations)});
 const usage=report.modules.map(module=>({investigation_job_id:job.investigation_job_id,subject_id:job.subject_id,workspace_id:job.workspace_id,provider:`website-${module.moduleId}`,operation:"collect",request_started_at:report.scannedAt,request_completed_at:report.scannedAt,outcome:module.status==="failed"?"failed":"completed",cache_hit:false,retry_number:job.attempt_count-1,metadata:{durationMs:module.durationMs,costStatus:"unknown"}}));
 await call("/rest/v1/provider_usage_events",{method:"POST",body:JSON.stringify(usage)});
 await call(`/rest/v1/investigation_stages?investigation_job_id=eq.${job.investigation_job_id}&status=neq.completed`,{method:"PATCH",body:JSON.stringify({status:"completed",completed_at:new Date().toISOString(),output_reference:`website_intelligence_scans:${scanId}`})});
 await call(`/rest/v1/investigation_jobs?investigation_job_id=eq.${job.investigation_job_id}&lease_owner=not.is.null`,{method:"PATCH",body:JSON.stringify({status:"completed",completed_at:new Date().toISOString(),current_stage:"watchlist_update",lease_owner:null,lease_expires_at:null,metadata:{scanId}})});
 await call("/rest/v1/platform_audit_events",{method:"POST",body:JSON.stringify({workspace_id:job.workspace_id,actor_type:"worker",event_type:"investigation.completed",subject_id:job.subject_id,investigation_job_id:job.investigation_job_id,resource_type:"website_intelligence_scan",resource_id:scanId})});
 return {scanId,observationCount:observations.length};
}
