import { runtime } from "@/lib/continuousResolution/demo";

export async function GET(_request:Request,{params}:{params:Promise<{entityId:string}>}) {
  const {entityId}=await params,projection=runtime.projection(entityId);
  return projection?Response.json(projection):Response.json({error:"Entity projection was not found."},{status:404});
}
