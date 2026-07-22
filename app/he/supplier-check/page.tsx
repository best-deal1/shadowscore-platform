import MarketingPage from "../../components/MarketingPage";
import { hebrewPages, marketingMetadata } from "../../lib/marketing";
export const metadata = marketingMetadata(hebrewPages["supplier-check"], "he");
export default function Page() { return <MarketingPage page={hebrewPages["supplier-check"]} locale="he" />; }
