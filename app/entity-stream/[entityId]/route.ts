import { runtime } from "@/lib/continuousResolution/demo";

export async function GET(request:Request,{params}:{params:Promise<{entityId:string}>}) {
  const {entityId}=await params,url=new URL(request.url),cursor=url.searchParams.get("cursor"),limit=Number(url.searchParams.get("limit")??50);
  if(!runtime.projection(entityId))return Response.json({error:"Entity was not found."},{status:404});
  return Response.json(runtime.timeline(entityId,cursor,Number.isFinite(limit)?limit:50));
}
