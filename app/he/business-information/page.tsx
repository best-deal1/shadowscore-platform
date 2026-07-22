import MarketingPage from "../../components/MarketingPage";
import { hebrewPages, marketingMetadata } from "../../lib/marketing";
export const metadata = marketingMetadata(hebrewPages["business-information"], "he");
export default function Page() { return <MarketingPage page={hebrewPages["business-information"]} locale="he" />; }
