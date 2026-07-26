import "server-only";
import { supabaseFetch } from "@/lib/supabase";
export async function getCurrentEvidence(subjectId:string,accessToken:string,taxonomy?:string){
 const filter=taxonomy?`&taxonomy=eq.${encodeURIComponent(taxonomy)}`:"";
 return supabaseFetch<Array<{assertion_key:string;assertion_id:string;subject_id:string;taxonomy:string;value:unknown;confidence:number;valid_from:string;valid_to:string|null;assertion_version:number;projected_at:string}>>(`/rest/v1/current_evidence_projection?subject_id=eq.${encodeURIComponent(subjectId)}${filter}&select=*&order=taxonomy.asc`,{},accessToken);
}
