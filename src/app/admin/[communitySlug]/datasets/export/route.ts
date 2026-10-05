import { requireMember } from "@/lib/access";
import { getDb } from "@/lib/db";

// Backup of every dataset in the community (the Free database plan has no
// backup of its own). Members only.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/admin/[communitySlug]/datasets/export">,
) {
  const { communitySlug } = await ctx.params;
  const { community } = await requireMember(communitySlug);

  const datasets = await getDb().dataset.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "asc" },
    select: {
      title: true,
      period: true,
      visibility: true,
      columns: true,
      rows: true,
      fills: true,
      createdAt: true,
    },
  });

  const now = new Date();
  const body = JSON.stringify(
    {
      exportedAt: now.toISOString(),
      community: { slug: community.slug, name: community.name },
      datasets,
    },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${community.slug}-backup-${now.toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
