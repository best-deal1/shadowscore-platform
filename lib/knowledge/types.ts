import type { Assertion, Json } from "@/lib/evidenceV2/types";

export type ContributionType = "supports"|"contradicts"|"supersedes"|"contextualizes";
export type ResolutionStatus = "current"|"disputed"|"superseded"|"unresolved"|"rejected";
export type ResolutionPolicy = { policyKey:string; version:string; supportedTaxonomyKeys:string[]; supportedSubjectTypes:string[]; priority:number; deterministicRules:Record<string,Json>; confidenceRules:Record<string,Json>; conflictBehavior:"dispute"|"unresolved"; supersessionBehavior:"append"; enabled:boolean };
export type Provenance = { assertionId:string; contributionType:ContributionType; contributionWeight:number };
export type ResolvedFact = { factId:string; workspaceId:string; subjectId:string; taxonomyKey:string; canonicalValue:Json; canonicalValueHash:string; confidence:number; resolutionStatus:ResolutionStatus; policyKey:string; policyVersion:string; validFrom:string; validTo:string|null; createdAt:string; supersededByFactId:string|null; provenance:Provenance[] };
export type KnowledgeConflict = { conflictId:string; workspaceId:string; subjectId:string; taxonomyKey:string; severity:number; status:"open"|"resolved"|"superseded"|"accepted_variance"; policyKey:string; policyVersion:string; assertionIds:string[]; explanation:string; createdAt:string };
export type IdentityCandidate = { candidateId:string; workspaceId:string; leftSubjectId:string; rightSubjectId:string; candidateType:"possible_match"|"probable_match"|"exact_match"|"possible_relationship"|"possible_split"|"conflict"; policyKey:string; policyVersion:string; confidence:number; status:"open"|"accepted"|"rejected"|"superseded"|"expired"; supportingAssertionIds:string[]; conflictingAssertionIds:string[]; explanation:string; createdAt:string; resolvedAt:string|null; resolution:string|null };
export type Relationship = { relationshipId:string; workspaceId:string; sourceSubjectId:string; targetSubjectId:string|null; targetReference:Json|null; relationshipType:string; direction:"directed"|"bidirectional"; confidence:number; policyKey:string; policyVersion:string; validFrom:string; validTo:string|null; status:ResolutionStatus; createdAt:string; supersededByRelationshipId:string|null; provenance:Provenance[] };
export type KnowledgeProjection = { subjectId:string; facts:ResolvedFact[]; relationships:Relationship[]; conflicts:KnowledgeConflict[]; identityCandidates:IdentityCandidate[]; confidenceSummary:{minimum:number;average:number}; projectedAt:string };
export type ResolutionScope = { workspaceId:string; subjectId?:string; taxonomyKey?:string };
export interface AssertionReader { current(scope:ResolutionScope):Promise<Assertion[]> }
export interface FactLedgerRepository { listFacts(scope:ResolutionScope):Promise<ResolvedFact[]>; appendFact(fact:ResolvedFact):Promise<void> }
export interface RelationshipLedgerRepository { listRelationships(scope:ResolutionScope):Promise<Relationship[]>; appendRelationship(value:Relationship):Promise<void> }
export interface IdentityCandidateRepository { listCandidates(scope:ResolutionScope):Promise<IdentityCandidate[]>; appendCandidate(value:IdentityCandidate):Promise<void> }
export interface ConflictRepository { listConflicts(scope:ResolutionScope):Promise<KnowledgeConflict[]>; appendConflict(value:KnowledgeConflict):Promise<void> }
export interface KnowledgeProjectionRepository { replace(scope:ResolutionScope,value:KnowledgeProjection):Promise<void>; get(subjectId:string):Promise<KnowledgeProjection|null>; clear(scope:ResolutionScope):Promise<void> }
export interface ResolutionPolicyRepository { applicable(taxonomy:string,subjectType:string):Promise<ResolutionPolicy[]> }
export interface KnowledgeEventRepository { appendEvent(value:{eventId:string;workspaceId:string;type:string;aggregateId:string;policyVersions:string[];occurredAt:string}):Promise<void> }
