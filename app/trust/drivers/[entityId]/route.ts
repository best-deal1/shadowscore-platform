import { notFound, trustEntityId, trustResult } from "@/lib/trustIntelligence/routes";
export async function GET(_request:Request,context:{params:Promise<{entityId:string}>}){const entityId=await trustEntityId(context),result=trustResult(entityId);if(!result)return notFound(entityId);return Response.json({schemaVersion:"trust-drivers-api@1.0.0",entityId,drivers:result.engine.drivers(entityId)});}
