import type { Assertion, CurrentAssertion, EvidenceLink, EvidenceRepository, Observation, QuarantinedEvidence, Json } from "./types";
export class MemoryEvidenceRepository implements EvidenceRepository {
 readonly observations:Observation[]=[];readonly assertions:Assertion[]=[];readonly links:EvidenceLink[]=[];readonly quarantined:QuarantinedEvidence[]=[];readonly projections=new Map<string,CurrentAssertion>();readonly outbox:Array<{eventId:string;type:string;aggregateId:string;payload:Record<string,Json>;occurredAt:string}>=[];
 async appendObservation(v:Observation){if(this.observations.some(x=>x.observationId===v.observationId))throw new Error("Observation IDs are append-only and unique.");this.observations.push(structuredClone(v));}
 async appendAssertion(v:Assertion){if(this.assertions.some(x=>x.assertionId===v.assertionId||x.assertionKey===v.assertionKey&&x.version===v.version))throw new Error("Assertion versions are append-only and unique.");this.assertions.push(structuredClone(v));}
 async appendLinks(v:EvidenceLink[]){this.links.push(...structuredClone(v));} async quarantine(v:QuarantinedEvidence){this.quarantined.push(structuredClone(v));}
 async findAssertion(k:string,h:string){return this.assertions.find(x=>x.assertionKey===k&&x.canonicalValueHash===h)??null;} async latestAssertion(k:string){return this.assertions.filter(x=>x.assertionKey===k).sort((a,b)=>b.version-a.version)[0]??null;}
 async replaceProjection(v:CurrentAssertion){this.projections.set(v.assertionKey,structuredClone(v));} async appendOutbox(v:{eventId:string;type:string;aggregateId:string;payload:Record<string,Json>;occurredAt:string}){this.outbox.push(structuredClone(v));}
 rebuildProjections(){this.projections.clear();for(const assertion of this.assertions){const old=this.projections.get(assertion.assertionKey);if(!old||old.version<assertion.version)this.projections.set(assertion.assertionKey,{...structuredClone(assertion),projectedAt:new Date().toISOString()});}}
}
