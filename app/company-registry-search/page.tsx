import MarketingPage from "../components/MarketingPage";
import { englishPages, marketingMetadata } from "../lib/marketing";
export const metadata = marketingMetadata(englishPages["company-registry-search"]);
export default function Page() { return <MarketingPage page={englishPages["company-registry-search"]} />; }
