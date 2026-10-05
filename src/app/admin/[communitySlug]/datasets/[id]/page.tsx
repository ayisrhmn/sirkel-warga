import { CalendarDays, Download } from "lucide-react";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/atoms/button";
import { Card } from "@/components/atoms/card";
import { Chip } from "@/components/atoms/chip";
import { BackLink } from "@/components/molecules/back-link";
import { Banner } from "@/components/molecules/banner";
import { DeleteButton } from "@/components/molecules/delete-button";
import { FormPanel } from "@/components/molecules/form-panel";
import { PageHeader } from "@/components/molecules/page-header";
import { StatusChip } from "@/components/molecules/status-chip";
import { DataTable } from "@/components/organisms/data-table";
import { requireMember } from "@/lib/access";
import type { DatasetCell, DatasetFill } from "@/lib/dataset";
import { requireUuid } from "@/lib/form";
import { hasProtectedPassword } from "@/lib/queries/communities";
import { getDataset } from "@/lib/queries/datasets";
import { deleteDataset } from "../actions";
import { DatasetMetaForm } from "./dataset-meta-form";

export default async function DatasetPage({
  params,
}: PageProps<"/admin/[communitySlug]/datasets/[id]">) {
  const { communitySlug, id } = await params;
  const { community } = await requireMember(communitySlug);
  requireUuid(id);

  const dataset = await getDataset(community.id, id);
  if (!dataset) notFound();
  const hasPassword = await hasProtectedPassword(community.id);
  const rows = dataset.rows as DatasetCell[][];

  return (
    <>
      <BackLink href={`/admin/${community.slug}/datasets`} variant="inline">
        Semua laporan
      </BackLink>
      <PageHeader
        title={dataset.title}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {dataset.period && <Chip icon={CalendarDays}>{dataset.period}</Chip>}
            <StatusChip status={dataset.visibility} />
          </div>
        }
      />
      {dataset.visibility === "protected" && !hasPassword && (
        <Banner tone="warning">
          Laporan ini Dilindungi, tapi password komunitas belum diatur sehingga
          belum bisa dibuka siapa pun. Super admin bisa mengaturnya di menu
          Pengaturan.
        </Banner>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[17px] font-bold">{rows.length} baris</p>
            <div className="flex flex-wrap gap-2.5">
              <a href={`/admin/${community.slug}/datasets/${dataset.id}/export`} className={buttonClass({ variant: "secondary", size: "sm" })}>
                <Download aria-hidden="true" size={18} />
                Unduh CSV
              </a>
              <DeleteButton
                action={deleteDataset.bind(null, community.slug, dataset.id)}
                confirmText={`Hapus laporan "${dataset.title}"? Tidak bisa dibatalkan.`}
                label="Hapus laporan"
              />
            </div>
          </div>
          <DataTable columns={dataset.columns as string[]} rows={rows} fills={dataset.fills as DatasetFill[]} />
        </Card>
        <FormPanel title="Info laporan">
          <DatasetMetaForm
            slug={community.slug}
            item={{
              id: dataset.id,
              title: dataset.title,
              period: dataset.period ?? "",
              visibility: dataset.visibility,
            }}
          />
        </FormPanel>
      </div>
    </>
  );
}
