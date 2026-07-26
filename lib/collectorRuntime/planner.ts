import type { Subject, SubjectIdentifier } from "../platformCore/types";
import type { CollectorRegistry } from "./registry";
import type { ExecutionPlan } from "./types";

export type PlannerInput={subject:Subject;identifiers:SubjectIdentifier[];workspace:{workspaceId:string};investigationId:string;enabledCapabilities:string[];pricingPlan:string;entitlements:string[]};
export class InvestigationPlanner { private readonly registry:CollectorRegistry;private readonly now:()=>string;constructor(registry:CollectorRegistry,now=()=>new Date().toISOString()){this.registry=registry;this.now=now;}
 plan(input:PlannerInput):ExecutionPlan{const identifierTypes=new Set(input.identifiers.map(i=>i.identifierType));const eligible=this.registry.list().filter(c=>c.healthStatus!=="disabled"&&input.enabledCapabilities.includes(c.capability)&&c.supportedSubjectTypes.includes(input.subject.subjectType)&&c.supportedIdentifierTypes.some(t=>identifierTypes.has(t))&&c.requiredEntitlements.every(e=>input.entitlements.includes(e)));
  const keys=new Set(eligible.map(c=>c.collectorKey));const collectors=eligible.filter(c=>c.dependencies.every(d=>keys.has(d))).map(c=>({collectorKey:c.collectorKey,version:c.version,priority:c.priority,dependencies:[...c.dependencies]}));
  return {planId:crypto.randomUUID(),investigationId:input.investigationId,collectors,createdAt:this.now()}; }
}
