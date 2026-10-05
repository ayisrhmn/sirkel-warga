import Link from "next/link";
import { requireMember } from "@/lib/access";
import { VISIBILITY_LABEL } from "@/lib/dataset";
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
    <main className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Laporan ({items.length})</h2>
        <Link href={`${base}/import`} className="underline">
          Impor dari Excel
        </Link>
      </div>
      {items.length === 0 && (
        <p className="text-neutral-600">Belum ada laporan.</p>
      )}
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-1 rounded-md border border-neutral-300 p-3"
          >
            <Link href={`${base}/${item.id}`} className="font-medium underline">
              {item.title}
            </Link>
            <p className="text-sm text-neutral-600">
              {[
                item.period,
                VISIBILITY_LABEL[item.visibility],
                `Diimpor ${formatDate(item.createdAt, asTimeZone(community.timezone))}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </li>
        ))}
      </ul>
      {items.length > 0 && (
        <a href={`${base}/export`} className="w-fit underline">
          Unduh cadangan semua laporan (JSON)
        </a>
      )}
    </main>
  );
}
