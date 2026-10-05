import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DataTable } from "@/components/data-table";
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
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-8">
      <Link href={`/${community.slug}`} className="w-fit text-sm underline">
        {community.name}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{dataset.title}</h1>
        {dataset.period && (
          <p className="text-neutral-600">{dataset.period}</p>
        )}
      </div>
      <DataTable columns={dataset.columns} rows={dataset.rows} fills={dataset.fills} />
    </main>
  );
}
