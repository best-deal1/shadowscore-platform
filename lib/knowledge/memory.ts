import type { Assertion } from "@/lib/evidenceV2/types";
import type { AssertionReader, ConflictRepository, FactLedgerRepository, IdentityCandidateRepository, KnowledgeConflict, KnowledgeEventRepository, KnowledgeProjection, KnowledgeProjectionRepository, Relationship, RelationshipLedgerRepository, ResolutionPolicy, ResolutionPolicyRepository, ResolutionScope, ResolvedFact, IdentityCandidate } from "./types";
export class MemoryKnowledgeRepository implements AssertionReader,FactLedgerRepository,RelationshipLedgerRepository,IdentityCandidateRepository,ConflictRepository,KnowledgeProjectionRepository,ResolutionPolicyRepository,KnowledgeEventRepository {
 assertions:Assertion[]=[]; facts:ResolvedFact[]=[]; relationships:Relationship[]=[]; candidates:IdentityCandidate[]=[]; conflicts:KnowledgeConflict[]=[]; policies:ResolutionPolicy[]=[]; projections=new Map<string,KnowledgeProjection>(); events:Array<{eventId:string;workspaceId:string;type:string;aggregateId:string;policyVersions:string[];occurredAt:string}>=[];
 async current(s:ResolutionScope){return this.assertions.filter(a=>(!s.subjectId||a.subjectId===s.subjectId)&&(!s.taxonomyKey||a.taxonomy===s.taxonomyKey));}
 async listFacts(s:ResolutionScope){return this.facts.filter(v=>!s.subjectId||v.subjectId===s.subjectId);}
 async listRelationships(s:ResolutionScope){return this.relationships.filter(v=>!s.subjectId||v.sourceSubjectId===s.subjectId);}
 async listCandidates(s:ResolutionScope){return this.candidates.filter(v=>!s.subjectId||v.leftSubjectId===s.subjectId||v.rightSubjectId===s.subjectId);}
 async listConflicts(s:ResolutionScope){return this.conflicts.filter(v=>!s.subjectId||v.subjectId===s.subjectId);}
 async appendFact(v:ResolvedFact){if(!this.facts.some(x=>x.factId===v.factId))this.facts.push(v);}
 async appendRelationship(v:Relationship){if(!this.relationships.some(x=>x.relationshipId===v.relationshipId))this.relationships.push(v);}
 async appendCandidate(v:IdentityCandidate){if(!this.candidates.some(x=>x.candidateId===v.candidateId))this.candidates.push(v);}
 async appendConflict(v:KnowledgeConflict){if(!this.conflicts.some(x=>x.conflictId===v.conflictId))this.conflicts.push(v);}
 async appendEvent(v:{eventId:string;workspaceId:string;type:string;aggregateId:string;policyVersions:string[];occurredAt:string}){if(!this.events.some(x=>x.eventId===v.eventId))this.events.push(v);}
 async replace(_:ResolutionScope,v:KnowledgeProjection){this.projections.set(v.subjectId,v);} async get(id:string){return this.projections.get(id)??null;} async clear(s:ResolutionScope){if(s.subjectId)this.projections.delete(s.subjectId);else this.projections.clear();}
 async applicable(t:string,subjectType:string){return this.policies.filter(p=>p.enabled&&(p.supportedTaxonomyKeys.includes("*")||p.supportedTaxonomyKeys.includes(t))&&(p.supportedSubjectTypes.includes("*")||p.supportedSubjectTypes.includes(subjectType))).sort((a,b)=>b.priority-a.priority||a.policyKey.localeCompare(b.policyKey));}
}
