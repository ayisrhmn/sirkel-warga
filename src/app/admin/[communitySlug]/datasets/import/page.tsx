import { requireMember } from "@/lib/access";
import { ImportDataset } from "./import-dataset";

export default async function ImportDatasetPage({
  params,
}: PageProps<"/admin/[communitySlug]/datasets/import">) {
  const { communitySlug } = await params;
  const { community } = await requireMember(communitySlug);

  return (
    <main className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">Impor laporan dari Excel</h2>
      <ImportDataset slug={community.slug} />
    </main>
  );
}
