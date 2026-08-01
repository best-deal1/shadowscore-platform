import type { Subject, SubjectIdentifier, SubjectType, SubjectVisibility } from "./types";

export class InvalidSubjectIdentifierError extends Error {}

export function normalizeDomain(input:string) {
  let value=input.trim();
  if (!value) throw new InvalidSubjectIdentifierError("A domain or URL is required.");
  try { value=new URL(value.includes("://")?value:`https://${value}`).hostname; } catch { throw new InvalidSubjectIdentifierError("The domain or URL is invalid."); }
  value=value.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  if (!value || value.includes(" ") || !value.includes(".")) throw new InvalidSubjectIdentifierError("The domain or URL is invalid.");
  return value;
}

export function normalizeWebsiteUrl(input:string) {
  const candidate=input.includes("://")?input:`https://${input}`;
  let url:URL; try { url=new URL(candidate); } catch { throw new InvalidSubjectIdentifierError("The URL is invalid."); }
  url.hostname=normalizeDomain(url.hostname); url.hash="";
  if ((url.protocol==="https:"&&url.port==="443")||(url.protocol==="http:"&&url.port==="80")) url.port="";
  return url.toString();
}

export type SubjectStore = { findIdentifier(workspaceId:string|null,type:string,value:string):Promise<SubjectIdentifier|null>; getSubject(id:string):Promise<Subject|null>; createSubject(subject:Subject):Promise<void>; attachIdentifier(identifier:SubjectIdentifier):Promise<SubjectIdentifier> };
export class SubjectResolutionService {
  private store:SubjectStore; private now:()=>Date;
  constructor(store:SubjectStore, now=()=>new Date()){this.store=store;this.now=now;}
  async resolve(input:{ subjectType:SubjectType; value:string; workspaceId:string|null; visibility?:SubjectVisibility; source?:string }) {
    const strong=input.subjectType==="domain"||input.subjectType==="website";
    const identifierType=input.subjectType==="website"?"domain":input.subjectType;
    const normalized=strong?normalizeDomain(input.value):input.value.trim().toLowerCase();
    if (!normalized) throw new InvalidSubjectIdentifierError("A subject identifier is required.");
    // Only deterministic website identifiers participate in automatic resolution.
    const existing=strong?await this.store.findIdentifier(input.workspaceId,identifierType,normalized):null;
    if (existing) { const subject=await this.store.getSubject(existing.subjectId); if (subject) return {subject,identifier:existing,created:false}; }
    const at=this.now().toISOString(), subjectId=crypto.randomUUID();
    const subject:Subject={subjectId,subjectType:input.subjectType,canonicalName:normalized,displayName:input.value.trim(),status:"active",workspaceId:input.workspaceId,visibility:input.visibility??"private",mergedIntoSubjectId:null,metadata:{},createdAt:at,updatedAt:at};
    await this.store.createSubject(subject);
    const identifier=await this.store.attachIdentifier({identifierId:crypto.randomUUID(),subjectId,identifierType,normalizedValue:normalized,displayValue:input.value.trim(),source:input.source??"investigation_request",verificationStatus:"unverified",firstSeenAt:at,lastSeenAt:at,metadata:{}});
    return {subject,identifier,created:true};
  }
}
