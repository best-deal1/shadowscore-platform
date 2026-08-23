import PublicContentPage from "../components/PublicContentPage";
import { publicPages } from "../lib/public-pages";
import { publicMetadata } from "../lib/public-metadata";
const page = publicPages["/data"];
export const metadata = publicMetadata(page);
export default function Page() { return <PublicContentPage page={page} />; }
