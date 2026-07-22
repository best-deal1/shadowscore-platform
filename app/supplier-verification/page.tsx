import MarketingPage from "../components/MarketingPage";
import { englishPages, marketingMetadata } from "../lib/marketing";
export const metadata = marketingMetadata(englishPages["supplier-verification"]);
export default function Page() { return <MarketingPage page={englishPages["supplier-verification"]} />; }
