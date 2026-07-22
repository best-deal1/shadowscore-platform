import MarketingPage from "../components/MarketingPage";
import { englishPages, marketingMetadata } from "../lib/marketing";
export const metadata = marketingMetadata(englishPages["company-check"]);
export default function Page() { return <MarketingPage page={englishPages["company-check"]} />; }
