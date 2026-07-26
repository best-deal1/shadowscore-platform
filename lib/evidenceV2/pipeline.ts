import { createHash, randomUUID } from "node:crypto";
import type { Assertion, AssertionCandidate, ConfidenceComponents, EvidenceLink, EvidenceRepository, Json, NormalizationPolicy, NormalizationStage, Observation, ObservationInput } from "./types";

export class EvidenceQuarantineError extends Error { readonly stage:NormalizationStage; readonly reasonCode:string; constructor(stage:NormalizationStage,reasonCode:string,message:string){super(message);this.name="EvidenceQuarantineError";this.stage=stage;this.reasonCode=reasonCode;} }
const stable=(value:Json):string=>{if(Array.isArray(value))return `[${value.map(stable).join(",")}]`;if(value&&typeof value==="object")return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;return JSON.stringify(value)};
export const canonicalHash=(value:Json)=>createHash("sha256").update(stable(value)).digest("hex");
const intervalValid=(from:string,to:string|null)=>Number.isFinite(Date.parse(from))&&(!to||(Number.isFinite(Date.parse(to))&&Date.parse(to)>Date.parse(from)));
const overall=(c:Omit<ConfidenceComponents,"overall">)=>Number(((c.sourceReliability+c.extractionQuality+c.corroboration+c.freshness)/4).toFixed(4));

export class NormalizationPipeline {
 private readonly repository:EvidenceRepository; private readonly policy:NormalizationPolicy; private readonly now:()=>string;
 constructor(repository:EvidenceRepository,policy:NormalizationPolicy,now=()=>new Date().toISOString()){this.repository=repository;this.policy=policy;this.now=now;}
 async process(input:ObservationInput):Promise<{observation:Observation;assertion:Assertion;deduplicated:boolean}> {
  let stage:NormalizationStage="accept";
  try {
   if(!input.observationId||!input.sourceInstanceId)throw new EvidenceQuarantineError(stage,"missing_identity","Observation and source instance IDs are required.");
   stage="validate"; if(!input.subjectId||!input.key||!intervalValid(input.validFrom,input.validTo)||!Number.isFinite(Date.parse(input.observedAt)))throw new EvidenceQuarantineError(stage,"invalid_contract","The observation contract or validity interval is invalid.");
   stage="policy"; if(!this.policy.allowedObservationTypes.has(input.observationType))throw new EvidenceQuarantineError(stage,"policy_rejected","The observation type is not allowed by this policy.");
   const observation:Observation={...input,metadata:input.metadata??{},recordedAt:this.now(),status:"accepted"}; await this.repository.appendObservation(observation);
   stage="canonicalize"; const value=this.policy.canonicalize(observation);
   stage="taxonomy"; const taxonomy=this.policy.taxonomyFor(observation); if(!taxonomy)throw new EvidenceQuarantineError(stage,"taxonomy_unknown","No taxonomy mapping exists for the observation.");
   const assertionKey=this.policy.assertionKey(observation,taxonomy,value); const hash=canonicalHash(value);
   stage="deduplicate"; const duplicate=await this.repository.findAssertion(assertionKey,hash); if(duplicate){const link:EvidenceLink={evidenceLinkId:randomUUID(),assertionId:duplicate.assertionId,observationId:observation.observationId,role:"supporting",createdAt:this.now()};await this.repository.appendLinks([link]);await this.repository.replaceProjection({...duplicate,projectedAt:this.now()});await this.repository.appendOutbox({eventId:randomUUID(),type:"evidence.observation.linked",aggregateId:duplicate.assertionId,payload:{observationId:observation.observationId},occurredAt:this.now()});return {observation,assertion:duplicate,deduplicated:true};}
   stage="confidence"; const parts=this.policy.confidence(observation); for(const score of Object.values(parts))if(score<0||score>1)throw new EvidenceQuarantineError(stage,"invalid_confidence","Confidence components must be between zero and one.");
   const candidate:AssertionCandidate={assertionKey,taxonomy,subjectId:observation.subjectId,value,provenance:{sourceInstanceId:observation.sourceInstanceId},validFrom:observation.validFrom,validTo:observation.validTo,observationIds:[observation.observationId],confidence:parts};
   const previous=await this.repository.latestAssertion(assertionKey);
   const assertion:Assertion={assertionId:randomUUID(),assertionKey:candidate.assertionKey,taxonomy:candidate.taxonomy,subjectId:candidate.subjectId,value:candidate.value,provenance:candidate.provenance,validFrom:candidate.validFrom,validTo:candidate.validTo,version:(previous?.version??0)+1,confidence:{...parts,overall:overall(parts)},recordedAt:this.now(),supersedesAssertionId:previous?.assertionId??null,policyVersion:this.policy.version,canonicalValueHash:hash};
   stage="append"; await this.repository.appendAssertion(assertion); const links:EvidenceLink[]=candidate.observationIds.map(observationId=>({evidenceLinkId:randomUUID(),assertionId:assertion.assertionId,observationId,role:"supporting",createdAt:this.now()}));await this.repository.appendLinks(links);
   stage="project"; await this.repository.replaceProjection({...assertion,projectedAt:this.now()});
   stage="outbox"; await this.repository.appendOutbox({eventId:randomUUID(),type:"evidence.assertion.appended",aggregateId:assertion.assertionId,payload:{assertionKey,version:assertion.version},occurredAt:this.now()});
   return {observation,assertion,deduplicated:false};
  } catch(error){const failure=error instanceof EvidenceQuarantineError?error:new EvidenceQuarantineError(stage,"normalization_failed",error instanceof Error?error.message:"Normalization failed.");await this.repository.quarantine({quarantineId:randomUUID(),observation:input,stage:failure.stage,reasonCode:failure.reasonCode,message:failure.message,quarantinedAt:this.now()});throw failure;}
 }
}
