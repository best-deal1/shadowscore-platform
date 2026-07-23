import "server-only";
import { supabaseFetch } from "@/lib/supabase";
import type { CasePriority, CaseQueueDto, CaseQueueItemDto, CaseStatus } from "../domain";
import type { WorkspaceActor } from "./auth";
export type CaseRow = { public_id:string; title:string; investigation_id:string; status:CaseStatus; priority:CasePriority; owner_id:string|null; due_at:string|null; updated_at:string; version:number };
export type CaseFilters={ status?:CaseStatus; owner?:string; priority?:CasePriority; query?:string; cursor?:string; limit:number };
function dto(row: CaseRow): CaseQueueItemDto { return { id:row.public_id,title:row.title,target:row.investigation_id,status:row.status,priority:row.priority,ownerName:null,dueAt:row.due_at,updatedAt:row.updated_at,openAlertCount:0 }; }
export class WorkspaceRepository {
 async listCases(actor:WorkspaceActor, filters:CaseFilters):Promise<CaseQueueDto> {
  const p=new URLSearchParams({select:"public_id,title,investigation_id,status,priority,owner_id,due_at,updated_at,version",organization_id:`eq.${actor.organizationId}`,order:"updated_at.desc,public_id.desc",limit:String(filters.limit+1)});
  if(filters.status)p.set("status",`eq.${filters.status}`); if(filters.owner)p.set("owner_id",`eq.${filters.owner}`); if(filters.priority)p.set("priority",`eq.${filters.priority}`); if(filters.query)p.set("or",`(title.ilike.*${filters.query.replace(/[,*()]/g, "")}*,investigation_id.ilike.*${filters.query.replace(/[,*()]/g, "")}*)`);
  if(filters.cursor){ const c=decodeCursor(filters.cursor); p.set("and",`(updated_at.lt.${c.updatedAt},or(updated_at.eq.${c.updatedAt},public_id.lt.${c.publicId}))`); }
  const rows=await supabaseFetch<CaseRow[]>(`/rest/v1/cases?${p}`,{},actor.accessToken); const page=rows.slice(0,filters.limit); const last=page.at(-1);
  return {cases:page.map(dto),nextCursor:rows.length>filters.limit&&last?encodeCursor(last.updated_at,last.public_id):null};
 }
 async getCase(actor:WorkspaceActor, publicId:string){ const rows=await supabaseFetch<CaseRow[]>(`/rest/v1/cases?select=public_id,title,investigation_id,status,priority,owner_id,due_at,updated_at,version&organization_id=eq.${actor.organizationId}&public_id=eq.${encodeURIComponent(publicId)}&limit=1`,{},actor.accessToken); return rows[0]??null; }
 async createCase(actor:WorkspaceActor,input:unknown){ return this.mutate(actor,"POST","/rest/v1/rpc/workspace_create_case",input); }
 async updateCase(actor:WorkspaceActor,publicId:string,input:unknown){ return this.mutate(actor,"POST","/rest/v1/rpc/workspace_update_case",{...input,public_id:publicId}); }
 private async mutate(actor:WorkspaceActor,method:string,path:string,body:unknown){ return supabaseFetch<unknown>(path,{method,body:JSON.stringify(body)},actor.accessToken); }
}
function encodeCursor(updatedAt:string,publicId:string){return Buffer.from(JSON.stringify({updatedAt,publicId})).toString("base64url");}
function decodeCursor(value:string):{updatedAt:string;publicId:string}{try{const x=JSON.parse(Buffer.from(value,"base64url").toString());if(typeof x.updatedAt!=="string"||typeof x.publicId!=="string")throw 0;return x;}catch{throw new Error("invalid_cursor");}}
