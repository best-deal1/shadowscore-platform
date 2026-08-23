import { notFound } from "next/navigation";
import PublicContentPage from "../../components/PublicContentPage";
import { publicPages } from "../../lib/public-pages";
import { publicMetadata } from "../../lib/public-metadata";

const prefix = "/solutions/";
export function generateStaticParams() {
  return Object.keys(publicPages).filter((path) => path.startsWith(prefix)).map((path) => ({ slug: path.split("/").at(-1)! }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = publicPages[`${prefix}${slug}`];
  return page ? publicMetadata(page) : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = publicPages[`${prefix}${slug}`];
  if (!page) notFound();
  return <PublicContentPage page={page} />;
}
