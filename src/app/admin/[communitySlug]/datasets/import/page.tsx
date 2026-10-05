import { BackLink } from "@/components/molecules/back-link";
import { PageHeader } from "@/components/molecules/page-header";
import { requireMember } from "@/lib/access";
import { ImportDataset } from "./import-dataset";

export default async function ImportDatasetPage({
  params,
}: PageProps<"/admin/[communitySlug]/datasets/import">) {
  const { communitySlug } = await params;
  const { community } = await requireMember(communitySlug);

  return (
    <>
      <BackLink href={`/admin/${community.slug}/datasets`} variant="inline">
        Semua laporan
      </BackLink>
      <PageHeader
        title="Impor laporan dari Excel"
        description="Ikuti langkahnya dari atas ke bawah. Tidak ada yang tersimpan sebelum kamu menekan Simpan."
      />
      <ImportDataset slug={community.slug} />
    </>
  );
}
