import { ChevronRight, Download, Lock, Table2, Upload } from "lucide-react";
import Link from "next/link";
import { ButtonLink, buttonClass } from "@/components/atoms/button";
import { Heading } from "@/components/atoms/heading";
import { IconTile } from "@/components/atoms/icon-tile";
import { EmptyState } from "@/components/molecules/empty-state";
import { PageHeader } from "@/components/molecules/page-header";
import { StatusChip } from "@/components/molecules/status-chip";
import { requireMember } from "@/lib/access";
import { asTimeZone, formatDate } from "@/lib/datetime";
import { getDb } from "@/lib/db";

export default async function DatasetsPage({
  params,
}: PageProps<"/admin/[communitySlug]/datasets">) {
  const { communitySlug } = await params;
  const { community } = await requireMember(communitySlug);
  const base = `/admin/${community.slug}/datasets`;

  // Rows are left out: the list only needs the summary.
  const items = await getDb().dataset.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      period: true,
      visibility: true,
      columns: true,
      createdAt: true,
    },
  });

  return (
    <>
      <PageHeader
        title="Laporan"
        description="Tabel dari Excel untuk warga atau pengurus."
        action={
          <ButtonLink href={`${base}/import`} icon={Upload}>
            Impor dari Excel
          </ButtonLink>
        }
      />
      <section className="flex max-w-4xl flex-col gap-4">
        <Heading>Laporan ({items.length})</Heading>
        {items.length === 0 && <EmptyState>Belum ada laporan.</EmptyState>}
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`${base}/${item.id}`} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4 hover:bg-zebra sm:p-5">
                <IconTile icon={item.visibility === "protected" ? Lock : Table2} tone={item.visibility === "protected" ? "amber" : "green"} shape="square" size="lg" />
                <span className="min-w-0 flex-1 basis-48">
                  <span className="block text-[17px] leading-snug font-bold text-ink">{item.title}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {[item.period, `Diimpor ${formatDate(item.createdAt, asTimeZone(community.timezone))}`].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <StatusChip status={item.visibility} />
                <ChevronRight aria-hidden="true" size={20} className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
        {items.length > 0 && (
          <a href={`${base}/export`} className={buttonClass({ variant: "secondary", size: "sm" }, "self-start")}>
            <Download aria-hidden="true" size={18} />
            Unduh cadangan semua laporan (JSON)
          </a>
        )}
      </section>
    </>
  );
}
