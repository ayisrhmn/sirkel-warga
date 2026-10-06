import { CalendarDays, Table2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Chip } from "@/components/atoms/chip";
import { Heading } from "@/components/atoms/heading";
import { DataTable } from "@/components/organisms/data-table";
import { PublicPage } from "@/components/templates/public-page";
import { getCommunity } from "@/lib/communities";
import { requireUuid } from "@/lib/form";
import { getPublicDataset } from "@/lib/public-dataset";
import { SLUG_RE } from "@/lib/slug";

// Generated on first request, then cached until the community's data changes.
export function generateStaticParams() {
  return [];
}

export default async function DatasetPage({
  params,
}: PageProps<"/[communitySlug]/datasets/[id]">) {
  const { communitySlug, id } = await params;
  if (!SLUG_RE.test(communitySlug)) notFound();
  requireUuid(id);

  const community = await getCommunity(communitySlug);
  if (!community) notFound();
  const dataset = await getPublicDataset(community, id);
  if (!dataset) notFound();
  // Protected data is served only by the dynamic, cookie-checked route.
  if (dataset.visibility === "protected")
    redirect(`/${community.slug}/protected/${dataset.id}`);

  return (
    <PublicPage size="content" themeColor={community.primaryColor} back={{ href: `/${community.slug}`, label: community.name }}>
      <div className="flex flex-wrap gap-2.5">
        <Chip tone="green" icon={Table2}>
          Laporan
        </Chip>
        {dataset.period && (
          <Chip icon={CalendarDays}>{dataset.period}</Chip>
        )}
      </div>
      <Heading as="h1" size="hero" className="text-4xl sm:text-5xl">
        {dataset.title}
      </Heading>
      <DataTable columns={dataset.columns} rows={dataset.rows} fills={dataset.fills} />
    </PublicPage>
  );
}
