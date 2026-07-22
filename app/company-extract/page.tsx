import MarketingPage from "../components/MarketingPage";
import { englishPages, marketingMetadata } from "../lib/marketing";
export const metadata = marketingMetadata(englishPages["company-extract"]);
export default function Page() { return <MarketingPage page={englishPages["company-extract"]} />; }
