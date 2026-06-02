"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Finding = { title: string; severity: "Low" | "Medium" | "High" | "Critical"; points: number; detail: string };

const MARKETPLACE_REQUIREMENTS: Record<string, { label: string; hints: string[] }[]> = {
  eBay: [
    { label: "MC011 / MC999 / restriction notice", hints: ["mc011", "mc999", "restriction", "suspension", "appeal", "review"] },
    { label: "Tracking and delivery evidence", hints: ["tracking", "delivery", "delivered", "carrier", "ups", "usps", "fedex", "proof"] },
    { label: "Seller Hub / order screenshots", hints: ["seller", "hub", "order", "buyer", "feedback"] },
    { label: "Policy or payout notices", hints: ["policy", "vero", "payout", "hold", "payment"] },
  ],
  Amazon: [
    { label: "Performance notification", hints: ["performance", "notification", "section 3", "deactivation", "suspension"] },
    { label: "Account Health screenshot", hints: ["account health", "health", "ahr", "dashboard"] },
    { label: "Supplier invoices / authenticity documents", hints: ["invoice", "supplier", "authenticity", "distributor", "receipt"] },
    { label: "Order / tracking / A-to-Z evidence", hints: ["tracking", "order", "a-to-z", "claim", "delivery"] },
  ],
  Walmart: [
    { label: "Seller performance notice", hints: ["performance", "seller", "review", "suspension"] },
    { label: "Order defect / cancellation evidence", hints: ["defect", "cancellation", "cancel", "odr"] },
    { label: "Tracking / fulfillment report", hints: ["tracking", "fulfillment", "delivery", "carrier"] },
    { label: "Policy compliance notice", hints: ["policy", "compliance", "violation"] },
  ],
  Etsy: [
    { label: "Shop notice / account review", hints: ["etsy", "shop", "review", "suspension", "reserve"] },
    { label: "IP / policy complaint evidence", hints: ["ip", "intellectual", "property", "policy", "copyright", "trademark"] },
    { label: "Cases and buyer messages", hints: ["case", "buyer", "message", "dispute"] },
    { label: "Tracking / delivery proof", hints: ["tracking", "delivery", "proof", "delivered"] },
  ],
  "TikTok Shop": [
    { label: "Seller verification notice", hints: ["verification", "seller", "identity", "kyc"] },
    { label: "Fulfillment SLA / late dispatch data", hints: ["fulfillment", "late", "dispatch", "sla", "tracking"] },
    { label: "Product compliance notice", hints: ["compliance", "policy", "violation", "restricted"] },
    { label: "Payout / settlement review", hints: ["payout", "settlement", "hold", "reserve"] },
  ],
  SHEIN: [
    { label: "Seller onboarding or review notice", hints: ["onboarding", "seller", "review", "verification"] },
    { label: "Product compliance documents", hints: ["product", "compliance", "quality", "certificate"] },
    { label: "Fulfillment and return evidence", hints: ["fulfillment", "return", "delivery", "tracking"] },
    { label: "Supplier documentation", hints: ["supplier", "invoice", "factory", "document"] },
  ],
};

const CASE_TYPES = ["MC011 / proof of delivery", "MC999 / selling restriction", "Payout hold", "Verification review", "Policy violation", "Amazon Section 3", "Inauthentic / supplier documents", "General marketplace review"];
function normalize(v:string){return v.toLowerCase().replace(/[_-]+/g," ")}
function scoreLabel(s:number){if(s>=82)return"Critical Exposure";if(s>=66)return"High Exposure";if(s>=46)return"Elevated Exposure";if(s>=25)return"Moderate Exposure";return"Low Exposure"}
function scoreColor(s:number){if(s>=82)return"text-red-100";if(s>=66)return"text-red-300";if(s>=46)return"text-orange-200";if(s>=25)return"text-yellow-200";return"text-emerald-200"}

export default function IntakePage(){
 const [files,setFiles]=useState<File[]>([]); const [marketplace,setMarketplace]=useState("eBay"); const [store,setStore]=useState(""); const [caseType,setCaseType]=useState("MC011 / proof of delivery"); const [submitted,setSubmitted]=useState(false);
 const requirements=MARKETPLACE_REQUIREMENTS[marketplace]||MARKETPLACE_REQUIREMENTS.eBay;
 const fileNames=useMemo(()=>files.map(f=>normalize(f.name)),[files]);
 const evidenceStatus=useMemo(()=>requirements.map(item=>({...item,present:fileNames.some(n=>item.hints.some(h=>n.includes(h)))})),[fileNames,requirements]);
 const findings=useMemo<Finding[]>(()=>{
  const r:Finding[]=[];
  if(!store.trim()) r.push({title:"Missing store URL or seller name",severity:"Medium",points:8,detail:"A store URL or seller name helps connect the evidence to a specific marketplace profile."});
  if(files.length===0){r.push({title:"No evidence uploaded",severity:"High",points:35,detail:"A preliminary assessment requires at least one notice, tracking file, screenshot or report."});return r;}
  evidenceStatus.filter(i=>!i.present).forEach(i=>r.push({title:`${i.label} missing`,severity:"Medium",points:10,detail:`Upload evidence related to ${i.label.toLowerCase()} to improve assessment quality.`}));
  const rules=[
   ["amazon","Amazon reference detected",14],["tba","Amazon Logistics / TBA tracking reference detected",16],["vero","VeRO or brand complaint reference detected",18],["intellectual","Intellectual property complaint reference detected",18],["policy","Policy violation reference detected",12],["military","Restricted item policy reference detected",22],["suspension","Suspension reference detected",18],["mc999","MC999 restriction reference detected",22],["mc011","MC011 review reference detected",18],["payout","Payout hold reference detected",12],["hold","Funds hold reference detected",10],["section 3","Amazon Section 3 reference detected",22],["inauthentic","Authenticity / supplier document risk detected",20]
  ] as const;
  rules.forEach(([term,title,points])=>{if(fileNames.some(n=>n.includes(term)))r.push({title,severity:points>=20?"Critical":points>=16?"High":"Medium",points,detail:"This signal can increase marketplace exposure and should be reviewed in a full report."})});
  if(files.length<3) r.push({title:"Evidence package is thin",severity:"Medium",points:8,detail:"A stronger review usually includes notices, tracking, delivery proof, policy screenshots and account reports."});
  if(caseType.includes("MC999")||caseType.includes("Section 3")) r.push({title:"High severity case type",severity:"High",points:16,detail:"This case type usually requires deeper post-mortem analysis and document review."});
  return r;
 },[files,store,evidenceStatus,fileNames,caseType]);
 const score=useMemo(()=>{if(files.length===0)return 0; const completenessBonus=evidenceStatus.filter(i=>i.present).length*-4; const total=22+findings.reduce((s,i)=>s+i.points,0)+completenessBonus; return Math.min(96,Math.max(12,total));},[files.length,findings,evidenceStatus]);
 const progress=files.length===0?0:Math.min(100,25+files.length*12+evidenceStatus.filter(i=>i.present).length*10);
 const canAnalyze=files.length>0;
 return <main className="min-h-screen overflow-hidden bg-black text-white"><div className="fixed inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:76px_76px]"/><div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(220,38,38,0.16),transparent_42%)]"/>
  <header className="relative z-10 border-b border-white/10 bg-black/85 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back to ShadowScore</Link><div className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">Evidence-Based Trust Assessment</div></div></header>
  <section className="relative z-10 mx-auto max-w-7xl px-6 py-14"><div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr]"><div><div className="text-xs uppercase tracking-[0.45em] text-red-300">ShadowScore Intake</div><h1 className="mt-6 text-5xl font-extrabold leading-tight">Marketplace Trust Assessment Console</h1><p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">Upload real evidence and receive an instant preliminary risk assessment. Missing evidence is flagged clearly instead of showing a fake result.</p><div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="font-bold">What this console checks</div><div className="mt-4 grid gap-3 text-sm text-zinc-400"><div>• Marketplace-specific document requirements</div><div>• Tracking and delivery proof completeness</div><div>• Payout hold or reserve signals</div><div>• Policy, VeRO, restricted item and supplier-document signals</div><div>• Weak or missing evidence package</div></div></div><div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/[0.06] p-6"><div className="font-bold text-red-200">Important</div><p className="mt-3 leading-7 text-zinc-400">This is a preliminary assessment based on file names, case type and evidence completeness. A full paid review requires manual inspection of the actual documents.</p></div></div>
  <div className="rounded-[32px] border border-white/10 bg-black/55 p-6 shadow-[0_0_60px_rgba(120,0,20,0.16)] backdrop-blur-xl"><div className="grid gap-5 md:grid-cols-3"><label><div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Marketplace</div><select value={marketplace} onChange={e=>{setMarketplace(e.target.value);setSubmitted(false)}} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white">{Object.keys(MARKETPLACE_REQUIREMENTS).map(n=><option key={n}>{n}</option>)}</select></label><label><div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Case type</div><select value={caseType} onChange={e=>{setCaseType(e.target.value);setSubmitted(false)}} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white">{CASE_TYPES.map(n=><option key={n}>{n}</option>)}</select></label><label><div className="mb-2 text-xs uppercase tracking-[0.28em] text-zinc-500">Store URL or seller name</div><input value={store} onChange={e=>setStore(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black p-4 text-white" placeholder="https://..." /></label></div>
  <label className="mt-6 grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02] p-16 text-center hover:border-red-500/40"><input type="file" multiple className="hidden" onChange={e=>{setSubmitted(false);setFiles(Array.from(e.target.files||[]))}}/><div className="text-2xl font-extrabold">Drop evidence files here</div><div className="mt-3 text-zinc-500">PNG, JPG, CSV, PDF, DOCX, XLSX, HTML</div><div className="mt-5 text-sm font-bold text-red-300">Click to select files</div></label>
  <div className="mt-6 rounded-2xl border border-white/10 p-5"><div className="mb-3 flex items-center justify-between"><div><div className="text-xs uppercase tracking-[0.28em] text-zinc-500">Evidence completeness</div><div className="mt-2 font-bold">{files.length?"Evidence loaded":"Waiting for evidence"}</div></div><div className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">{files.length} files</div></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-red-800 via-red-500 to-red-300 transition-all duration-500" style={{width:`${progress}%`}}/></div></div>
  <div className="mt-6 grid gap-4 md:grid-cols-2">{evidenceStatus.map(item=><div key={item.label} className={`rounded-2xl border p-4 ${item.present?"border-emerald-400/25 bg-emerald-500/10":"border-yellow-400/25 bg-yellow-500/10"}`}><div className="text-sm font-bold">{item.present?"✓ Present":"Missing"}</div><div className="mt-2 text-xs leading-5 text-zinc-400">{item.label}</div></div>)}</div>
  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="text-xs uppercase tracking-[0.28em] text-red-300">Evidence Queue</div><div className="mt-4 space-y-2 text-sm text-zinc-400">{files.length?files.map(f=><div key={`${f.name}-${f.size}`}>• {f.name}</div>):<div>No evidence uploaded yet.</div>}</div></div>
  {!canAnalyze&&submitted&&<div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-sm leading-7 text-red-100">Assessment cannot run yet. Please upload at least one evidence file.</div>}
  <button type="button" onClick={()=>setSubmitted(true)} className="mt-6 block w-full rounded-2xl bg-red-600 px-7 py-5 text-center text-sm font-black uppercase tracking-[0.16em] shadow-[0_0_28px_rgba(220,38,38,0.28)] hover:bg-red-500">Run Preliminary Assessment</button>
  {submitted&&canAnalyze&&<div className="mt-8 rounded-[28px] border border-red-400/20 bg-red-500/[0.06] p-6"><div className="grid gap-6 md:grid-cols-[180px_1fr]"><div><div className={`text-6xl font-black ${scoreColor(score)}`}>{score}</div><div className="mt-3 text-sm font-bold text-white">{scoreLabel(score)}</div><div className="mt-2 text-xs text-zinc-500">{marketplace} · {caseType}</div></div><div><div className="text-xl font-bold">Preliminary findings</div><div className="mt-4 space-y-3">{findings.length?findings.map(f=><div key={f.title} className="rounded-2xl border border-white/10 bg-black/45 p-4"><div className="flex items-center justify-between gap-4"><div className="font-bold">{f.title}</div><div className={`rounded-full border px-3 py-1 text-xs ${f.severity==="Critical"||f.severity==="High"?"border-red-400/30 text-red-200":f.severity==="Medium"?"border-yellow-400/30 text-yellow-200":"border-zinc-400/30 text-zinc-300"}`}>{f.severity}</div></div><p className="mt-2 text-sm leading-6 text-zinc-400">{f.detail}</p></div>):<div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">No major preliminary gaps detected from the uploaded evidence package.</div>}</div></div></div><div className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-5 text-sm leading-7 text-zinc-400">This preliminary score is designed to create urgency and direction. It does not guarantee any marketplace outcome and does not represent internal marketplace data.</div></div>}
  </div></div></section></main>
}
