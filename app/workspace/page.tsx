import { CaseQueue } from "@/components/workspace/CaseQueue";
import { getWorkspaceLocale } from "@/components/workspace/locale";
export default async function WorkspacePage(){const {locale}=await getWorkspaceLocale();return <CaseQueue locale={locale}/>;}
