import { unstable_cache } from "next/cache";
import { communityTag } from "@/lib/communities";
import type { DatasetCell, DatasetFill } from "@/lib/dataset";
import { getDb } from "@/lib/db";

export type PublicDataset =
  | { visibility: "public"; id: string; title: string; period: string | null; columns: string[]; rows: DatasetCell[][]; fills: DatasetFill[] }
  | { visibility: "protected"; id: string; title: string; period: string | null };

// A dataset as shown to anyone with the link. Drafts do not exist here. The
// rows of a `protected` dataset are never loaded: that data only ever leaves
// the database through the password-gated route (Phase 3).
export function getPublicDataset(
  community: { id: string; slug: string },
  id: string,
) {
  return unstable_cache(
    async (): Promise<PublicDataset | null> => {
      const db = getDb();
      const meta = await db.dataset.findFirst({
        where: {
          id,
          communityId: community.id,
          visibility: { in: ["public", "protected"] },
        },
        select: { id: true, title: true, period: true, visibility: true },
      });
      if (!meta) return null;
      if (meta.visibility === "protected") return { ...meta, visibility: "protected" };

      const data = await db.dataset.findUniqueOrThrow({
        where: { id: meta.id },
        select: { columns: true, rows: true, fills: true },
      });
      return {
        ...meta,
        visibility: "public",
        columns: data.columns as string[],
        rows: data.rows as DatasetCell[][],
        fills: data.fills as DatasetFill[],
      };
    },
    ["dataset", community.id, id],
    { tags: [communityTag(community.slug)] },
  )();
}
