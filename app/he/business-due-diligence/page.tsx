import MarketingPage from "../../components/MarketingPage";
import { hebrewPages, marketingMetadata } from "../../lib/marketing";
export const metadata = marketingMetadata(hebrewPages["business-due-diligence"], "he");
export default function Page() { return <MarketingPage page={hebrewPages["business-due-diligence"]} locale="he" />; }
