import MarketingPage from "../components/MarketingPage";
import { englishPages, marketingMetadata } from "../lib/marketing";
export const metadata = marketingMetadata(englishPages["business-due-diligence"]);
export default function Page() { return <MarketingPage page={englishPages["business-due-diligence"]} />; }
