import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase";
import { executeClaimedWebsiteJob } from "@/lib/platformCore/worker";
import { executeCanonicalPaidInvestigation } from "@/lib/canonicalPaidInvestigation";

export async function POST(request:Request){
  const secret=process.env.INVESTIGATION_WORKER_SECRET; if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Worker authentication failed."},{status:401});
  const config=getSupabaseConfig(),serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!config||!serviceKey)return NextResponse.json({error:"Worker persistence is not configured."},{status:503});
  const response=await fetch(`${config.url}/rest/v1/rpc/claim_investigation_job`,{method:"POST",headers:{apikey:serviceKey,authorization:`Bearer ${serviceKey}`,"content-type":"application/json"},body:JSON.stringify({p_worker_id:process.env.INVESTIGATION_WORKER_ID||"next-worker",p_lease_seconds:300})});
  if(!response.ok)return NextResponse.json({error:"The worker could not claim a job."},{status:500});const jobs=await response.json() as unknown[];
  if(!jobs[0])return NextResponse.json({claimed:false});
  try{const job=jobs[0] as Parameters<typeof executeClaimedWebsiteJob>[2]&{investigation_type?:string;canonical_investigation_id?:string;payment_intent_id?:string};const result=job.investigation_type==="canonical_paid"?await executeCanonicalPaidInvestigation(config.url,serviceKey,job as Parameters<typeof executeCanonicalPaidInvestigation>[2]):await executeClaimedWebsiteJob(config.url,serviceKey,job);return NextResponse.json({claimed:true,result});}
  catch(error){const message=error instanceof Error?error.message:"Worker execution failed.";await fetch(`${config.url}/rest/v1/rpc/fail_or_retry_investigation_job`,{method:"POST",headers:{apikey:serviceKey,authorization:`Bearer ${serviceKey}`,"content-type":"application/json"},body:JSON.stringify({p_job_id:(jobs[0] as {investigation_job_id:string}).investigation_job_id,p_worker_id:process.env.INVESTIGATION_WORKER_ID||"next-worker",p_failure_code:"worker_execution_failed",p_failure_message:message})});return NextResponse.json({claimed:true,error:message},{status:500});}
}
