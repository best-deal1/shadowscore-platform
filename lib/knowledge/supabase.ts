import "server-only";
import { supabaseFetch } from "@/lib/supabase";
export type KnowledgeView="knowledge"|"facts"|"relationships"|"conflicts"|"identity-candidates"|"knowledge-graph";
const tables:Record<Exclude<KnowledgeView,"knowledge"|"knowledge-graph">,string>={facts:"resolved_facts",relationships:"relationships",conflicts:"knowledge_conflicts","identity-candidates":"identity_candidates"};
export async function readSubjectKnowledge(input:{view:KnowledgeView;subjectId:string;workspaceId:string;token:string;params:URLSearchParams}){
 const base=`workspace_id=eq.${encodeURIComponent(input.workspaceId)}`;const subject=`subject_id=eq.${encodeURIComponent(input.subjectId)}`;
 if(input.view==="knowledge")return supabaseFetch<unknown[]>(`/rest/v1/knowledge_projection?${base}&${subject}&select=subject_id,payload,projected_at`,{},input.token);
 if(input.view==="knowledge-graph"){const min=input.params.get("minimumConfidence");const confidence=min?`&confidence=gte.${encodeURIComponent(min)}`:"";return supabaseFetch<unknown[]>(`/rest/v1/knowledge_graph_edges?${base}${confidence}&select=*,relationship_assertions(assertion_id,contribution_type,contribution_weight)`,{},input.token);}
 const table=tables[input.view];const subjectFilter=input.view==="relationships"?`source_subject_id=eq.${encodeURIComponent(input.subjectId)}`:input.view==="identity-candidates"?`or=(left_subject_id.eq.${encodeURIComponent(input.subjectId)},right_subject_id.eq.${encodeURIComponent(input.subjectId)})`:subject;
 const mappings:Record<string,string>={taxonomy:"taxonomy_key",relationshipType:"relationship_type",status:"status",policyVersion:"policy_version",minimumConfidence:"confidence"};let filters="";for(const [query,column] of Object.entries(mappings)){const value=input.params.get(query);if(value)filters+=`&${column}=${query==="minimumConfidence"?"gte":"eq"}.${encodeURIComponent(value)}`;}const provenance=input.view==="facts"?",fact_assertions(assertion_id,contribution_type,contribution_weight)":input.view==="relationships"?",relationship_assertions(assertion_id,contribution_type,contribution_weight)":input.view==="conflicts"?",conflict_assertions(assertion_id)":",identity_candidate_assertions(assertion_id,contribution_type)";
 return supabaseFetch<unknown[]>(`/rest/v1/${table}?${base}&${subjectFilter}${filters}&select=*${provenance}`,{},input.token);
}
