import { notFound } from "next/navigation";

import AlertsPage from "../_pages/alerts";
import ChurnPage from "../_pages/churn";
import ComparePage from "../_pages/compare";
import DigestPage from "../_pages/digest";
import HubPage from "../_pages/hub";
import PipelinePage from "../_pages/pipeline";

// Collapsed into one dynamic segment to stay under Vercel's 12-function Hobby
// cap. generateStaticParams keeps each page prerendered at build time, and
// dynamicParams = false makes anything not listed here a 404 as before.

const PAGES: Record<string, () => Promise<React.ReactElement> | React.ReactElement> = {
  "alerts": AlertsPage,
  "churn": ChurnPage,
  "compare": ComparePage,
  "digest": DigestPage,
  "hub": HubPage,
  "pipeline": PipelinePage,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PAGES).map((page) => ({ page }));
}

export default async function TopLevelPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const Page = PAGES[page];
  if (!Page) notFound();
  return Page();
}
