import { unstable_cache } from "next/cache";
import { communityTag } from "@/lib/communities";
import { getDb } from "@/lib/db";

// Detail pages of announcements and events, cached like the community page and
// refreshed by the same tag. Drafts do not exist here. The rich text document
// is returned as stored; it is rebuilt from the allow-list again on render.
export function getPublicAnnouncement(community: { id: string; slug: string }, id: string) {
  return unstable_cache(
    async () => {
      const a = await getDb().announcement.findFirst({
        where: { id, communityId: community.id, status: "public" },
        select: { title: true, body: true, bodyDoc: true, publishedAt: true },
      });
      return a && { ...a, publishedAt: a.publishedAt.toISOString() };
    },
    ["announcement", community.id, id],
    { tags: [communityTag(community.slug)] },
  )();
}

export function getPublicEvent(community: { id: string; slug: string }, id: string) {
  return unstable_cache(
    async () => {
      const e = await getDb().event.findFirst({
        where: { id, communityId: community.id },
        select: { title: true, startsAt: true, location: true, description: true, descriptionDoc: true },
      });
      return e && { ...e, startsAt: e.startsAt.toISOString() };
    },
    ["event", community.id, id],
    { tags: [communityTag(community.slug)] },
  )();
}
