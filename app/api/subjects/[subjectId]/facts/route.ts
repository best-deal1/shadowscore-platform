import { knowledgeRoute } from "@/lib/knowledge/route";
type Context={params:Promise<{subjectId:string}>};
export function GET(request:Request,context:Context){return knowledgeRoute(request,context,"facts");}
