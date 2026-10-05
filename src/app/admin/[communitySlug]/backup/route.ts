import { requireMember } from "@/lib/access";
import { buildBackup } from "@/lib/backup";

// Full backup of the community. Super admin only: it lists the members and
// holds every report, including the ones that are protected.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/admin/[communitySlug]/backup">,
) {
  const { communitySlug } = await ctx.params;
  const { community } = await requireMember(communitySlug, { owner: true });

  const backup = await buildBackup(community);
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${community.slug}-cadangan-${backup.exportedAt.slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
