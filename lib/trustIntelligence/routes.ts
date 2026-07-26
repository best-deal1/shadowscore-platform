import { createDemoTrustEngine, DEMO_TRUST_ENTITY_ID } from "./seed";
export async function trustEntityId(context:{params:Promise<{entityId:string}>}){return (await context.params).entityId;}
export function trustResult(entityId:string){if(entityId!==DEMO_TRUST_ENTITY_ID)return null;const engine=createDemoTrustEngine();return {engine,snapshot:engine.current(entityId)!};}
export function notFound(entityId:string){return Response.json({error:"Trust profile not found.",entityId},{status:404});}
