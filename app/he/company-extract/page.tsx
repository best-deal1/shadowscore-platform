import MarketingPage from "../../components/MarketingPage";
import { hebrewPages, marketingMetadata } from "../../lib/marketing";
export const metadata = marketingMetadata(hebrewPages["company-extract"], "he");
export default function Page() { return <MarketingPage page={hebrewPages["company-extract"]} locale="he" />; }
