import { createHash } from "node:crypto";
import { DEFAULT_TRUST_POLICY } from "./policy";
import { TRUST_DIMENSIONS, type DimensionScore, type TrustDriver, type TrustPolicy, type TrustRecommendation, type TrustSignal, type TrustSnapshot } from "./types";

export const TRUST_COMPUTATION_VERSION="trust-computation@1.0.0";
const clamp=(n:number,min=0,max=100)=>Math.min(max,Math.max(min,n));
const round=(n:number,digits=0)=>Number(n.toFixed(digits));
const id=(value:string)=>createHash("sha256").update(value).digest("hex").slice(0,24);
const ageDays=(observedAt:string,now:string)=>Math.max(0,(Date.parse(now)-Date.parse(observedAt))/86400000);
export const signalFreshness=(signal:TrustSignal,now:string)=>signal.expiresAt&&Date.parse(signal.expiresAt)<=Date.parse(now)?0:Math.exp(-ageDays(signal.observedAt,now)/365);

function dimensionScore(dimension:typeof TRUST_DIMENSIONS[number], signals:TrustSignal[], policy:TrustPolicy, now:string):DimensionScore{
  const active=signals.filter(signal=>signal.dimension===dimension&&signalFreshness(signal,now)>0).sort((a,b)=>a.signalId.localeCompare(b.signalId));
  const factorWeights=policy.factorWeights[dimension]??{};
  const drivers:TrustDriver[]=active.map(signal=>{const freshness=signalFreshness(signal,now);const weight=factorWeights[signal.factor]??1;return {...signal,freshness:round(freshness,4),contribution:round((signal.effect==="positive"?1:-1)*signal.strength*signal.confidence*signal.sourceReliability*(.5+.5*signal.corroboration)*freshness*weight*50,2)}});
  const totalWeight=active.reduce((sum,signal)=>sum+(factorWeights[signal.factor]??1),0);
  const score=clamp(policy.missingBaseline+(totalWeight?drivers.reduce((sum,driver)=>sum+driver.contribution,0)/Math.max(1,totalWeight):0));
  const confidence=active.length?clamp(active.reduce((sum,signal)=>sum+signal.confidence*signal.sourceReliability*(.6+.4*signal.corroboration),0)/Math.max(2,active.length),0,1):0;
  const expected=Object.keys(factorWeights); const present=new Set(active.map(signal=>signal.factor));
  const positiveEvidence=drivers.filter(driver=>driver.effect==="positive").sort((a,b)=>b.contribution-a.contribution);
  const negativeEvidence=drivers.filter(driver=>driver.effect==="negative").sort((a,b)=>a.contribution-b.contribution);
  const missingEvidence=expected.filter(factor=>!present.has(factor));
  const why=drivers.length?`${positiveEvidence.length} positive and ${negativeEvidence.length} negative signals produced this score.`:"No current signals are available. The policy baseline was applied.";
  return {score:round(score),confidence:round(confidence,2),why,positiveEvidence,negativeEvidence,missingEvidence,evidenceFreshness:round(active.length?drivers.reduce((sum,d)=>sum+d.freshness,0)/active.length:0,2)};
}

export function recommendationFor(overall:number,confidence:number,compliance:number):TrustRecommendation{
  if(compliance<30||overall<30)return "Do Not Engage"; if(overall<45)return "High Risk"; if(confidence<.55||overall<65)return "Manual Review"; if(overall<82)return "Proceed with Monitoring"; return "Proceed";
}

export function computeTrust(entityId:string,signals:TrustSignal[],options:{now:string;policy?:TrustPolicy;previous?:TrustSnapshot|null;reason?:string}):TrustSnapshot{
  const policy=options.policy??DEFAULT_TRUST_POLICY;
  const scores=Object.fromEntries(TRUST_DIMENSIONS.map(dimension=>[dimension,dimensionScore(dimension,signals,policy,options.now)])) as Record<typeof TRUST_DIMENSIONS[number],DimensionScore>;
  const weighted=TRUST_DIMENSIONS.reduce((sum,dimension)=>sum+scores[dimension].score*policy.dimensionWeights[dimension],0);
  const weightTotal=TRUST_DIMENSIONS.reduce((sum,dimension)=>sum+policy.dimensionWeights[dimension],0);
  const overall=round(weighted/weightTotal); const confidence=round(TRUST_DIMENSIONS.reduce((sum,dimension)=>sum+scores[dimension].confidence*policy.dimensionWeights[dimension],0)/weightTotal,2);
  const inputSignalIds=signals.filter(signal=>signal.entityId===entityId&&signalFreshness(signal,options.now)>0).map(signal=>signal.signalId).sort();
  const fingerprint=JSON.stringify({entityId,now:options.now,policy:policy.version,inputSignalIds,scores:Object.fromEntries(TRUST_DIMENSIONS.map(d=>[d,scores[d].score]))});
  return {snapshotId:`trust_${id(fingerprint)}`,entityId,computedAt:options.now,scores,overall,confidence,recommendation:recommendationFor(overall,confidence,scores.compliance.score),policyVersion:policy.version,computationVersion:TRUST_COMPUTATION_VERSION,inputSignalIds,previousSnapshotId:options.previous?.snapshotId??null,changeReason:options.reason??"Evidence evaluated"};
}
