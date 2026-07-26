import { TrustIntelligenceEngine } from "./engine";
import type { TrustSignal } from "./types";

export const DEMO_TRUST_ENTITY_ID="ent-atlas-il";
const signal=(signalId:string,dimension:TrustSignal["dimension"],factor:string,effect:TrustSignal["effect"],strength:number,confidence:number,observedAt:string,description:string):TrustSignal=>({signalId,entityId:DEMO_TRUST_ENTITY_ID,dimension,factor,effect,strength,confidence,observedAt,sourceReliability:.9,corroboration:.8,evidenceReferences:[`evidence://trust/${signalId}`],description});
export const demoTrustSignals:TrustSignal[]=[
  signal("sig-reg","identity","verified_identifier","positive",.95,.98,"2026-05-01T09:00:00.000Z","The registration identifier was verified against the registry."),
  signal("sig-valid","identity","registration_validity","positive",.9,.96,"2026-06-12T09:00:00.000Z","The company registration is active."),
  signal("sig-uptime","operational","website_uptime","positive",.82,.91,"2026-07-20T09:00:00.000Z","The website met its 30-day availability target."),
  signal("sig-contact","operational","contact_consistency","positive",.7,.88,"2026-07-18T09:00:00.000Z","Published contact details match verified records."),
  signal("sig-pay","financial","payment_history","positive",.76,.78,"2026-07-02T09:00:00.000Z","Available payment records show consistent settlement."),
  signal("sig-license","compliance","licenses","positive",.9,.95,"2026-06-28T09:00:00.000Z","Required operating licenses are current."),
  signal("sig-aml","compliance","aml","positive",.88,.92,"2026-07-10T09:00:00.000Z","AML screening returned no material match."),
  signal("sig-delivery","marketplace","delivery_history","positive",.7,.84,"2026-07-15T09:00:00.000Z","Verified orders show a stable delivery record."),
  signal("sig-disputes","marketplace","dispute_ratio","negative",.28,.86,"2026-07-21T09:00:00.000Z","The recent dispute ratio is above the peer median."),
  signal("sig-tls","cyber","tls","positive",.92,.99,"2026-07-24T09:00:00.000Z","The primary domain uses a valid TLS configuration."),
  signal("sig-email","cyber","email_authentication","negative",.48,.94,"2026-07-24T09:00:00.000Z","DMARC enforcement is not enabled."),
  signal("sig-reviews","reputation","verified_reviews","positive",.68,.72,"2026-07-12T09:00:00.000Z","Verified reviews show a consistent service record."),
  signal("sig-directors","relationships","directors","positive",.8,.9,"2026-06-20T09:00:00.000Z","Directors match current registry filings."),
  signal("sig-source","evidenceQuality","source_reliability","positive",.9,.97,"2026-07-24T09:00:00.000Z","Most conclusions use authoritative sources."),
  signal("sig-corroboration","evidenceQuality","corroboration","positive",.78,.93,"2026-07-24T09:00:00.000Z","Key identity claims are supported by multiple sources."),
];

export function createDemoTrustEngine(){const engine=new TrustIntelligenceEngine();const waves=[demoTrustSignals.slice(0,5),demoTrustSignals.slice(5,10),demoTrustSignals.slice(10)];const dates=["2026-06-01T12:00:00.000Z","2026-07-01T12:00:00.000Z","2026-07-26T12:00:00.000Z"];waves.forEach((signals,index)=>{for(const item of signals)engine.recordSignal(item,dates[index]);engine.recompute(DEMO_TRUST_ENTITY_ID,dates[index],index===0?"Initial trust baseline":index===1?"Compliance and marketplace evidence added":"Current evidence refresh");});return engine;}
