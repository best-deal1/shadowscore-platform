import { createHash } from "node:crypto";
import { RESOLVER_VERSION, type Entity, type Observation, type ObservationAttribute, type ResolutionDecision, type ResolutionFeature, type ResolverPolicy } from "./types";

export const DEFAULT_RESOLVER_POLICY: ResolverPolicy = {
  version: "organization-resolution-policy@1.0.0", matchThreshold: .82, possibleMatchThreshold: .58, noMatchThreshold: .25, minimumEvidence: 2,
  weights: { registration_id: 1, domain: .9, email: .75, phone: .72, name: .62, address: .45, director: .3, parent: .25, status: .1 },
};

const LEGAL_SUFFIXES = new Set(["ltd", "limited", "inc", "corp", "corporation", "llc", "plc", "company", "co", "בעמ", "חברה"]);
const transliteration: Record<string, string> = { א:"a",ב:"b",ג:"g",ד:"d",ה:"h",ו:"v",ז:"z",ח:"h",ט:"t",י:"i",כ:"k",ך:"k",ל:"l",מ:"m",ם:"m",נ:"n",ן:"n",ס:"s",ע:"a",פ:"p",ף:"p",צ:"ts",ץ:"ts",ק:"k",ר:"r",ש:"sh",ת:"t" };

export function normalizeValue(attribute: ObservationAttribute, value: string): string {
  let normalized = value.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  if (attribute === "domain") return normalized.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  if (attribute === "email") return normalized.replace(/^mailto:/, "");
  if (attribute === "registration_id") return normalized.replace(/[^a-z0-9]/g, "").replace(/^[a-z]{2}(?=\d)/, "");
  if (attribute === "phone") return normalized.replace(/[^a-z0-9]/g, "");
  if (attribute === "name") normalized=normalized.replace(/בע[\"׳״']?מ/g," ").replace(/אטלס/g,"atlas");
  normalized = [...normalized].map(character => transliteration[character] ?? character).join("");
  const tokens = normalized.replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  return (attribute === "name" ? tokens.filter(token => !LEGAL_SUFFIXES.has(token)) : tokens).join(" ");
}

export function createObservation(input: Omit<Observation, "normalizedValue">): Observation {
  return { ...input, normalizedValue: normalizeValue(input.attribute, input.observedValue) };
}

const tokens = (value: string) => new Set(value.split(/\s+/).filter(Boolean));
function similarity(left: string, right: string): number {
  if (left === right) return 1;
  const a=tokens(left), b=tokens(right), intersection=[...a].filter(value=>b.has(value)).length, union=new Set([...a,...b]).size;
  const tokenScore=union ? intersection/union : 0;
  const distance=levenshtein(left,right), editScore=Math.max(0,1-distance/Math.max(left.length,right.length,1));
  return Math.max(tokenScore,editScore);
}
function levenshtein(a:string,b:string){const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prior=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const current=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prior+(a[i-1]===b[j-1]?0:1));prior=current;}}return row[b.length];}
const id=(...values:string[])=>createHash("sha256").update(values.join("|")).digest("hex").slice(0,24);

function values(entity:Entity, attribute:ObservationAttribute):string[]{const map:Record<ObservationAttribute,string[]>={name:[entity.canonicalName,...entity.aliases],domain:entity.domains,address:entity.addresses,phone:entity.phoneNumbers,email:entity.emailAddresses,registration_id:entity.registrationIdentifiers,director:entity.peopleAndDirectors,parent:entity.relationships.filter(r=>r.type==="parent").map(r=>r.entityId),status:[entity.status]};return map[attribute].map(v=>normalizeValue(attribute,v)).filter(Boolean);}

export function generateCandidates(subject:Entity, entities:Entity[]):Entity[]{
  const anchors=new Set([...["registration_id","domain","phone","email","name"] as ObservationAttribute[]].flatMap(attribute=>values(subject,attribute).map(value=>`${attribute}:${value}`)));
  return entities.filter(entity=>entity.entityId!==subject.entityId&&entity.workspaceId===subject.workspaceId&&[...["registration_id","domain","phone","email","name"] as ObservationAttribute[]].some(attribute=>values(entity,attribute).some(value=>anchors.has(`${attribute}:${value}`)||attribute==="name"&&values(subject,attribute).some(left=>similarity(left,value)>=.65))));
}

export function resolveEntities(left:Entity,right:Entity,observations:Observation[],options:{policy?:ResolverPolicy;now?:string;supersedesDecisionId?:string|null}={}):ResolutionDecision{
  const policy=options.policy??DEFAULT_RESOLVER_POLICY, features:ResolutionFeature[]=[];
  for(const attribute of Object.keys(policy.weights) as ObservationAttribute[]){let best:{left:string;right:string;score:number}|null=null;for(const a of values(left,attribute))for(const b of values(right,attribute)){const score=similarity(a,b);if(!best||score>best.score)best={left:a,right:b,score};}if(best)features.push({attribute,left:best.left,right:best.right,similarity:best.score,weight:policy.weights[attribute],contribution:best.score*policy.weights[attribute],evidenceReferences:observations.filter(o=>[...left.observationIds,...right.observationIds].includes(o.observationId)&&o.attribute===attribute).map(o=>o.evidenceReference).sort()});}
  const verifiedConflict=features.find(feature=>feature.attribute==="registration_id"&&feature.left&&feature.right&&feature.similarity<1);
  const exactIdentifier=features.find(feature=>["registration_id","domain"].includes(feature.attribute)&&feature.similarity===1);
  const meaningful=features.filter(feature=>feature.weight>=.3), denominator=meaningful.reduce((n,f)=>n+f.weight,0), weighted=denominator?meaningful.reduce((n,f)=>n+f.contribution,0)/denominator:0;
  const source=observations.filter(o=>[...left.observationIds,...right.observationIds].includes(o.observationId));const sourceQuality=source.length?source.reduce((n,o)=>n+o.reliability,0)/source.length:0;
  let outcome:ResolutionDecision["outcome"], method:ResolutionDecision["method"], reason:string, confidence=weighted;
  if(verifiedConflict){outcome="CONFLICT";method="deterministic_conflict";confidence=Math.max(.9,1-weighted);reason="Verified registration identifiers conflict. Automatic consolidation is blocked.";}
  else if(exactIdentifier){outcome="MATCH";method="deterministic_verified_identifier";confidence=Math.max(.95,weighted);reason=`Exact ${exactIdentifier.attribute.replace("_"," ")} links both records.`;}
  else if(meaningful.length<policy.minimumEvidence){outcome="ABSTAIN";method="insufficient_evidence";confidence=0;reason="The available identity evidence is insufficient for a resolution.";}
  else if(weighted>=policy.matchThreshold){outcome="MATCH";method="weighted_similarity";reason="Independent identity features exceed the automatic match threshold.";}
  else if(weighted>=policy.possibleMatchThreshold){outcome="POSSIBLE_MATCH";method="weighted_similarity";reason="Identity features support a possible match. Analyst review is required.";}
  else if(weighted<=policy.noMatchThreshold){outcome="NO_MATCH";method="weighted_similarity";confidence=1-weighted;reason="Identity features remain below the configured match threshold.";}
  else {outcome="REVIEW_REQUIRED";method="weighted_similarity";reason="Signals are ambiguous under the configured policy.";}
  const evidenceReferences=[...new Set(source.map(o=>o.evidenceReference))].sort(), decidedAt=options.now??new Date().toISOString();
  return {decisionId:id(left.entityId,right.entityId,policy.version,decidedAt,options.supersedesDecisionId??""),workspaceId:left.workspaceId,leftEntityId:left.entityId,rightEntityId:right.entityId,outcome,confidence:Number(confidence.toFixed(4)),matchedAttributes:features.filter(f=>f.similarity>=.7),conflictingAttributes:features.filter(f=>f.similarity<.35||f.attribute==="registration_id"&&f.similarity<1),sourceQuality:Number(sourceQuality.toFixed(4)),method,reason,evidenceReferences,decidedAt,resolverVersion:RESOLVER_VERSION,policyVersion:policy.version,supersedesDecisionId:options.supersedesDecisionId??null,review:{status:["POSSIBLE_MATCH","REVIEW_REQUIRED","CONFLICT"].includes(outcome)?"pending":"deferred",actorId:null,reason:null,reviewedAt:null}};
}
