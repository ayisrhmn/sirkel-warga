import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";

// Cached per slug and invalidated with `revalidateTag(communityTag(slug))`.
// Never select protectedPasswordHash here: this result lives in the cache.
// A cached "not found" stays until the tag is revalidated, so creating a
// community must call revalidateTag too (Phase 1).
export const communityTag = (slug: string) => `community:${slug}`;

export function getCommunity(slug: string) {
  return unstable_cache(
    () =>
      getDb().community.findUnique({
        where: { slug },
        select: { id: true, slug: true, name: true, timezone: true },
      }),
    ["community", slug],
    // Also expires after an hour, so lookups of slugs that never existed (scans,
    // typos) cannot pile up in the cache forever.
    { tags: [communityTag(slug)], revalidate: 3600 },
  )();
}
