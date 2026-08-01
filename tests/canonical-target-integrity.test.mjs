import assert from "node:assert/strict";
import test from "node:test";
import { canonicalWebsiteTarget, isolateProviderResults } from "../lib/targetIntegrity.ts";

test("website variants resolve to one canonical target",()=>{
 for(const value of ["https://www.gadgetdeals.co.il/","http://gadgetdeals.co.il","gadgetdeals.co.il/"])assert.equal(canonicalWebsiteTarget(value),"gadgetdeals.co.il");
});

const result=(domain,evidence,metadata={})=>({providerId:"fixture-provider",providerVersion:"1",status:"completed",startedAt:"2026-08-01T00:00:00.000Z",completedAt:"2026-08-01T00:00:01.000Z",duration:1000,findings:[{id:"finding",title:"Mismatch",description:"Mismatch",severity:"high"}],evidence,metadata:{domain,...metadata},errors:[]});

test("production fixture rejects unrelated domains and stamps accepted evidence",()=>{
 const isolated=isolateProviderResults({investigationId:"investigation-new",submittedTarget:"https://www.gadgetdeals.co.il/",providerResults:[result("gadgetdeals.co.il",[
  {id:"valid",type:"observation",label:"Domain",value:"gadgetdeals.co.il",source:"https://gadgetdeals.co.il"},
  {id:"old",type:"observation",label:"Repeated evidence",value:"012.net.il",source:"cached-provider"},
  {id:"wrong-name",type:"document",label:"Reviewed target",value:"Smart-Deals.Biz",source:"cached-provider"},
 ])]});
 assert.deepEqual(isolated.providerResults[0].evidence.map(item=>item.id),["valid"]);
 assert.deepEqual(isolated.providerResults[0].findings,[]);
 assert.equal(isolated.providerResults[0].evidence[0].investigationId,"investigation-new");
 assert.equal(isolated.providerResults[0].evidence[0].canonicalTarget,"gadgetdeals.co.il");
 assert.deepEqual(isolated.resolution.rejectedTargets.sort(),["012.net.il","smart-deals.biz"]);
});

test("provider scope and redirect destinations cannot silently replace the target",()=>{
 const prior=isolateProviderResults({investigationId:"new",submittedTarget:"gadgetdeals.co.il",providerResults:[result("smart-deals.biz",[{id:"cached",type:"observation",label:"Domain",value:"smart-deals.biz",source:"cache"}])]});
 assert.equal(prior.providerResults[0].evidence.length,0);
 const redirected=isolateProviderResults({investigationId:"new",submittedTarget:"gadgetdeals.co.il",providerResults:[result("gadgetdeals.co.il",[],{httpDiagnostics:{finalUrl:"https://smart-deals.biz/landing"}})]});
 assert.equal(redirected.resolution.canonicalTarget,"gadgetdeals.co.il");
 assert.equal(redirected.resolution.finalDestination,"smart-deals.biz");
 assert.equal(redirected.resolution.redirectDomainMismatch,true);
});

test("customer and account email domains are not target inputs",()=>{
 const isolated=isolateProviderResults({investigationId:"new",submittedTarget:"gadgetdeals.co.il",providerResults:[result("gadgetdeals.co.il",[{id:"email",type:"observation",label:"Customer email",value:"person@012.net.il",source:"intake"}])]});
 assert.equal(isolated.resolution.canonicalTarget,"gadgetdeals.co.il");
 assert.equal(isolated.providerResults[0].evidence.length,0);
});

test("contaminated evidence forces manual review rather than a negative recommendation",async()=>{
 const { executiveRecommendation }=await import("../lib/executiveReport.ts");
 const recommendation=executiveRecommendation({reportSummary:{targetResolution:{investigationId:"new",submittedTarget:"gadgetdeals.co.il",canonicalTarget:"gadgetdeals.co.il",redirectDomainMismatch:false,rejectedEvidenceCount:1,rejectedTargets:["012.net.il"]}}});
 assert.equal(recommendation.label,"Manual Review Required");
 assert.doesNotMatch(recommendation.label,/Do Not Proceed/i);
});
