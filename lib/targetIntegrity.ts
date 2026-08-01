import { normalizeDomain } from "./platformCore/subjects";
import type { ProviderEvidence, ProviderResult } from "./providers/types";

export type TargetResolution = { investigationId:string; submittedTarget:string; canonicalTarget:string; finalDestination?:string; redirectDomainMismatch:boolean; rejectedEvidenceCount:number; rejectedTargets:string[] };
const DOMAIN_PATTERN=/(?:https?:\/\/|@)?((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,})(?=[\s/:,;]|$)/gi;
export function canonicalWebsiteTarget(value:string){return normalizeDomain(value);}
function domainsIn(value:unknown){if(typeof value!=="string")return [];return Array.from(value.matchAll(DOMAIN_PATTERN),match=>{try{return canonicalWebsiteTarget(match[1]);}catch{return "";}}).filter(Boolean);}
function evidenceMatchesTarget(evidence:ProviderEvidence,target:string){const domains=[...domainsIn(evidence.value),...domainsIn(evidence.source)];return domains.length===0||domains.every(domain=>domain===target);}
function resultTarget(result:ProviderResult){const value=result.metadata.canonicalTarget||result.metadata.providerTarget||result.metadata.domain;if(typeof value!=="string")return;try{return canonicalWebsiteTarget(value);}catch{return;}}
function finalTarget(result:ProviderResult){const diagnostics=result.metadata.httpDiagnostics as {finalUrl?:unknown}|undefined;const value=typeof result.metadata.finalUrl==="string"?result.metadata.finalUrl:typeof diagnostics?.finalUrl==="string"?diagnostics.finalUrl:undefined;if(!value)return;try{return canonicalWebsiteTarget(value);}catch{return;}}

export function isolateProviderResults(input:{investigationId:string;submittedTarget:string;providerResults:ProviderResult[];collectedAt?:string}){
 const canonicalTarget=canonicalWebsiteTarget(input.submittedTarget),rejectedTargets=new Set<string>();let rejectedEvidenceCount=0,redirectTarget:string|undefined;
 const providerResults=input.providerResults.map(result=>{const providerTarget=resultTarget(result)||canonicalTarget,destination=finalTarget(result);if(destination&&destination!==canonicalTarget)redirectTarget||=destination;const targetMismatch=providerTarget!==canonicalTarget;if(targetMismatch)rejectedTargets.add(providerTarget);
  const evidence=targetMismatch?[]:result.evidence.filter(item=>{const accepted=evidenceMatchesTarget(item,canonicalTarget);if(!accepted){rejectedEvidenceCount+=1;domainsIn(`${item.value||""} ${item.source}`).filter(domain=>domain!==canonicalTarget).forEach(domain=>rejectedTargets.add(domain));}return accepted;});if(targetMismatch)rejectedEvidenceCount+=result.evidence.length;const contaminated=targetMismatch||evidence.length!==result.evidence.length;
  return {...result,findings:contaminated?[]:result.findings,evidence:evidence.map(item=>({...item,investigationId:input.investigationId,canonicalTarget,providerName:result.providerId,collectedAt:result.completedAt||input.collectedAt||new Date().toISOString()})),metadata:{...result.metadata,investigationId:input.investigationId,canonicalTarget,providerTarget,collectionTimestamp:result.completedAt||input.collectedAt||new Date().toISOString(),evidenceRejected:contaminated}};});
 return {providerResults,resolution:{investigationId:input.investigationId,submittedTarget:input.submittedTarget,canonicalTarget,finalDestination:redirectTarget,redirectDomainMismatch:Boolean(redirectTarget),rejectedEvidenceCount,rejectedTargets:[...rejectedTargets]} satisfies TargetResolution};
}
