import { notFound } from "next/navigation";
import { requireMember } from "@/lib/access";
import { toCsv, type DatasetCell } from "@/lib/dataset";
import { getDb } from "@/lib/db";
import { requireUuid } from "@/lib/form";
import { slugify } from "@/lib/slug";

// One dataset as CSV, for opening in Excel. Members only.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/admin/[communitySlug]/datasets/[id]/export">,
) {
  const { communitySlug, id } = await ctx.params;
  const { community } = await requireMember(communitySlug);
  requireUuid(id);

  const dataset = await getDb().dataset.findFirst({
    where: { id, communityId: community.id },
    select: { title: true, columns: true, rows: true },
  });
  if (!dataset) notFound();

  const csv = toCsv(dataset.columns as string[], dataset.rows as DatasetCell[][]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slugify(dataset.title) || "laporan"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
