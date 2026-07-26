import { createObservation, resolveEntities } from "./resolver";
import { evaluateGoldenDataset } from "./evaluation";
import type { Entity, GoldenPair, Observation } from "./types";

const entity=(entityId:string,canonicalName:string,extra:Partial<Entity>={}):Entity=>({entityId,workspaceId:"demo-workspace",entityType:"organization",canonicalName,aliases:[],domains:[],addresses:[],phoneNumbers:[],emailAddresses:[],registrationIdentifiers:[],peopleAndDirectors:[],relationships:[],status:"active",jurisdiction:"IL",observationIds:[`${entityId}-name`],...extra});
export const demoEntities:Entity[]=[
  entity("ent-atlas-il","Atlas Commerce Ltd",{aliases:["אטלס מסחר בעמ","Atlas Marketplace"],domains:["atlas.co.il"],addresses:["14 HaArbaa Street, Tel Aviv"],phoneNumbers:["+972-3-555-0140"],emailAddresses:["legal@atlas.co.il"],registrationIdentifiers:["IL-515001234"],peopleAndDirectors:["Noa Levi"],observationIds:["ent-atlas-il-name","ent-atlas-il-reg","ent-atlas-il-domain","ent-atlas-il-address"]}),
  entity("ent-atlas-market","אטלס מסחר בע\"מ",{aliases:["Atlas Commerce"],domains:["www.atlas.co.il"],addresses:["14 הארבעה, תל אביב"],registrationIdentifiers:["515001234"],peopleAndDirectors:["נועה לוי"],observationIds:["ent-atlas-market-name","ent-atlas-market-reg","ent-atlas-market-domain"]}),
  entity("ent-atlas-logistics","Atlas Logistics Ltd",{domains:["atlas-logistics.co.il"],addresses:["14 HaArbaa Street, Tel Aviv"],registrationIdentifiers:["IL-515009999"],peopleAndDirectors:["Noa Levi"],observationIds:["ent-atlas-logistics-name","ent-atlas-logistics-reg"]}),
  entity("ent-northstar","Northstar Systems",{aliases:["North Star Systems"],domains:["northstar.systems"],addresses:["8 Rothschild Blvd, Tel Aviv"],registrationIdentifiers:["IL-515088221"],observationIds:["ent-northstar-name","ent-northstar-reg"]}),
];
const observationData:[string,string,string,string,number][]=[
  ["ent-atlas-il-name","registry-il","company/515001234","Atlas Commerce Ltd",.98],
  ["ent-atlas-il-reg","registry-il","company/515001234","IL-515001234",.99],
  ["ent-atlas-il-domain","dns","atlas.co.il","atlas.co.il",.88],
  ["ent-atlas-il-address","registry-il","company/515001234","14 HaArbaa Street, Tel Aviv",.95],
  ["ent-atlas-market-name","marketplace","seller/atlas-88","אטלס מסחר בע\"מ",.72],
  ["ent-atlas-market-reg","marketplace","seller/atlas-88","515001234",.72],
  ["ent-atlas-market-domain","marketplace","seller/atlas-88","www.atlas.co.il",.72],
  ["ent-atlas-logistics-name","registry-il","company/515009999","Atlas Logistics Ltd",.98],
  ["ent-atlas-logistics-reg","registry-il","company/515009999","IL-515009999",.99],
];
const attribute=(id:string)=>id.endsWith("-reg")?"registration_id" as const:id.endsWith("-domain")?"domain" as const:id.endsWith("-address")?"address" as const:"name" as const;
export const demoObservations:Observation[]=observationData.map(([observationId,source,sourceRecordId,observedValue,reliability])=>createObservation({observationId,workspaceId:"demo-workspace",source,sourceRecordId,attribute:attribute(observationId),observedValue,observedAt:"2026-07-25T10:00:00.000Z",jurisdiction:"IL",evidenceReference:`evidence://${source}/${sourceRecordId}`,reliability}));

const pair=(pairId:string,category:string,left:Entity,right:Entity,expectedMatch:boolean):GoldenPair=>({pairId,category,left,right,expectedMatch});
export const goldenDataset:GoldenPair[]=[
  pair("g-01","Hebrew and English names",demoEntities[0],demoEntities[1],true),
  pair("g-02","reused addresses",demoEntities[0],demoEntities[2],false),
  pair("g-03","shared directors",demoEntities[1],demoEntities[2],false),
  pair("g-04","similar company names",entity("a","Northstar Systems"),entity("b","North Star System"),true),
  pair("g-05","abbreviations",entity("c","International Business Machines",{aliases:["IBM"],domains:["ibm.com"]}),entity("d","IBM",{domains:["ibm.com"]}),true),
  pair("g-06","spelling mistakes",entity("e","Acme Technologies",{domains:["acme.example"]}),entity("f","Acme Technlogies",{domains:["acme.example"]}),true),
  pair("g-07","conflicting identifiers",entity("g","Atlas Commerce",{registrationIdentifiers:["100"]}),entity("h","Atlas Commerce",{registrationIdentifiers:["200"]}),false),
  pair("g-08","historical names",entity("i","Meta Platforms",{aliases:["Facebook Inc"],registrationIdentifiers:["US-1"]}),entity("j","Facebook Inc",{registrationIdentifiers:["US-1"]}),true),
  pair("g-09","marketplace aliases",entity("k","Blue River Retail",{aliases:["BlueRiver Shop"],domains:["blueriver.example"]}),entity("l","BlueRiver Shop",{domains:["blueriver.example"]}),true),
  pair("g-10","false merge trap",entity("m","Global Trading",{registrationIdentifiers:["11"],addresses:["Shared Office"]}),entity("n","Global Trading",{registrationIdentifiers:["12"],addresses:["Shared Office"]}),false),
  pair("g-11","false split trap",entity("o","A.C.M.E. Ltd",{registrationIdentifiers:["44"]}),entity("p","ACME",{registrationIdentifiers:["44"]}),true),
  pair("g-12","parent and subsidiary",entity("q","Orion Holdings",{registrationIdentifiers:["71"]}),entity("r","Orion Payments",{registrationIdentifiers:["72"],relationships:[{entityId:"q",type:"parent"}]}),false),
  pair("g-13","acquisitions",entity("s","OldCo",{registrationIdentifiers:["81"],status:"acquired"}),entity("t","NewCo",{registrationIdentifiers:["82"],relationships:[{entityId:"s",type:"acquired_by"}]}),false),
];

export const demoDecisions=[resolveEntities(demoEntities[0],demoEntities[1],demoObservations,{now:"2026-07-26T09:42:00.000Z"}),resolveEntities(demoEntities[0],demoEntities[2],demoObservations,{now:"2026-07-26T09:45:00.000Z"})];
export const demoMetrics=evaluateGoldenDataset(goldenDataset);
