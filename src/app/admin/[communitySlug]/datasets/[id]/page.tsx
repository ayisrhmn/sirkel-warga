import { notFound } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { requireMember } from "@/lib/access";
import type { DatasetCell, DatasetFill } from "@/lib/dataset";
import { getDb } from "@/lib/db";
import { requireUuid } from "@/lib/form";
import { deleteDataset } from "../actions";
import { DatasetMetaForm } from "./dataset-meta-form";

export default async function DatasetPage({
  params,
}: PageProps<"/admin/[communitySlug]/datasets/[id]">) {
  const { communitySlug, id } = await params;
  const { community } = await requireMember(communitySlug);
  requireUuid(id);

  const dataset = await getDb().dataset.findFirst({
    where: { id, communityId: community.id },
  });
  if (!dataset) notFound();
  const { protectedPasswordHash } = await getDb().community.findUniqueOrThrow({
    where: { id: community.id },
    select: { protectedPasswordHash: true },
  });

  return (
    <main className="flex flex-col gap-6">
      {dataset.visibility === "protected" && !protectedPasswordHash && (
        <p className="rounded-md border border-yellow-500 p-3 text-sm">
          Laporan ini Dilindungi, tapi password komunitas belum diatur sehingga
          belum bisa dibuka siapa pun. Super admin bisa mengaturnya di menu
          Pengaturan.
        </p>
      )}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{dataset.title}</h2>
        <DatasetMetaForm
          slug={community.slug}
          item={{
            id: dataset.id,
            title: dataset.title,
            period: dataset.period ?? "",
            visibility: dataset.visibility,
          }}
        />
      </section>
      <section className="flex flex-col gap-3">
        <p className="text-sm text-neutral-600">
          {(dataset.rows as DatasetCell[][]).length} baris
        </p>
        <DataTable
          columns={dataset.columns as string[]}
          rows={dataset.rows as DatasetCell[][]}
          fills={dataset.fills as DatasetFill[]}
        />
        <div className="flex flex-wrap gap-4">
          <a
            href={`/admin/${community.slug}/datasets/${dataset.id}/export`}
            className="underline"
          >
            Unduh CSV
          </a>
          <DeleteButton
            action={deleteDataset.bind(null, community.slug, dataset.id)}
            confirmText={`Hapus laporan "${dataset.title}"? Tidak bisa dibatalkan.`}
          />
        </div>
      </section>
    </main>
  );
}
