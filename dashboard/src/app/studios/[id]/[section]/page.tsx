import { notFound } from "next/navigation";

import ClassesPage from "../_sections/classes";
import InventoryPage from "../_sections/inventory";
import StudioMaintenancePage from "../_sections/maintenance";
import MembersPage from "../_sections/members";
import OperationsPage from "../_sections/operations";
import RetentionPage from "../_sections/retention";
import StudioReviewsPage from "../_sections/reviews";
import SalesPage from "../_sections/sales";
import SchedulePage from "../_sections/schedule";
import SettingsPage from "../_sections/settings";

// Each page file becomes its own serverless function, and Vercel's Hobby plan
// caps a deployment at 12. The ten studio sub-pages are rendered from this one
// dynamic segment instead; the URLs are unchanged.

type SectionProps = { params: Promise<{ id: string }> };

const SECTIONS: Record<string, (props: SectionProps) => Promise<React.ReactElement> | React.ReactElement> = {
  "classes": ClassesPage,
  "inventory": InventoryPage,
  "maintenance": StudioMaintenancePage,
  "members": MembersPage,
  "operations": OperationsPage,
  "retention": RetentionPage,
  "reviews": StudioReviewsPage,
  "sales": SalesPage,
  "schedule": SchedulePage,
  "settings": SettingsPage,
};

export default async function StudioSectionPage({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { id, section } = await params;
  const Section = SECTIONS[section];
  if (!Section) notFound();
  return Section({ params: Promise.resolve({ id }) });
}
