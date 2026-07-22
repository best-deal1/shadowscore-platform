import MarketingPage from "../components/MarketingPage";
import { englishPages, marketingMetadata } from "../lib/marketing";
export const metadata = marketingMetadata(englishPages["marketplace-seller-verification"]);
export default function Page() { return <MarketingPage page={englishPages["marketplace-seller-verification"]} />; }
