import { CaseQueue } from "@/components/workspace/CaseQueue";
import { getWorkspaceLocale } from "@/components/workspace/locale";
import { placeholderCaseQueue } from "@/lib/workspace/placeholder-data";

export default async function WorkspacePage() {
  const { locale } = await getWorkspaceLocale();

  return <CaseQueue cases={placeholderCaseQueue} locale={locale} />;
}
