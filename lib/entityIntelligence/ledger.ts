import type { Entity, ResolutionDecision } from "./types";

export type ReviewAction = "approved" | "rejected" | "split" | "deferred";
export class ResolutionLedger {
  readonly decisions: ResolutionDecision[] = [];
  private links = new Map<string, Set<string>>();
  append(decision:ResolutionDecision){if(this.decisions.some(item=>item.decisionId===decision.decisionId))return;this.decisions.push(structuredClone(decision));if(decision.outcome==="MATCH")this.link(decision.leftEntityId,decision.rightEntityId);}
  review(decisionId:string,action:ReviewAction,actorId:string,reason:string,reviewedAt=new Date().toISOString()){const prior=this.decisions.find(item=>item.decisionId===decisionId);if(!prior)throw new Error("Resolution decision was not found.");if(!reason.trim())throw new Error("A review reason is required.");const next:ResolutionDecision={...structuredClone(prior),decisionId:`${prior.decisionId}:review:${this.decisions.length+1}`,outcome:action==="approved"?"MATCH":action==="rejected"||action==="split"?"NO_MATCH":"ABSTAIN",decidedAt:reviewedAt,supersedesDecisionId:prior.decisionId,reason:`Analyst ${action}: ${reason}`,review:{status:action,actorId,reason,reviewedAt}};this.decisions.push(next);if(action==="approved")this.link(next.leftEntityId,next.rightEntityId);if(action==="rejected"||action==="split")this.unlink(next.leftEntityId,next.rightEntityId);return next;}
  linked(entityId:string){return [...(this.links.get(entityId)??[])].sort();}
  rebuild(){this.links.clear();for(const decision of this.decisions){if(decision.outcome==="MATCH")this.link(decision.leftEntityId,decision.rightEntityId);if(decision.review.status==="rejected"||decision.review.status==="split")this.unlink(decision.leftEntityId,decision.rightEntityId);}}
  private link(a:string,b:string){this.links.set(a,new Set([...(this.links.get(a)??[]),b]));this.links.set(b,new Set([...(this.links.get(b)??[]),a]));}
  private unlink(a:string,b:string){this.links.get(a)?.delete(b);this.links.get(b)?.delete(a);}
}

export function currentEntityProjection(entity:Entity,entities:Entity[],ledger:ResolutionLedger):Entity{const linked=ledger.linked(entity.entityId).map(id=>entities.find(item=>item.entityId===id)).filter((item):item is Entity=>Boolean(item));return {...entity,aliases:[...new Set([...entity.aliases,...linked.flatMap(item=>[item.canonicalName,...item.aliases])])].sort(),domains:[...new Set([...entity.domains,...linked.flatMap(item=>item.domains)])].sort(),observationIds:[...new Set([...entity.observationIds,...linked.flatMap(item=>item.observationIds)])].sort()};}
