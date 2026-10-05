import { unstable_cache } from "next/cache";
import { communityTag } from "@/lib/communities";
import { startOfTodayWib } from "@/lib/datetime";
import { getDb } from "@/lib/db";

// Dates are ISO strings: cached values go through JSON.
export type PublicContent = {
  announcements: { id: string; title: string; body: string; publishedAt: string }[];
  events: {
    id: string;
    title: string;
    startsAt: string;
    location: string | null;
    description: string | null;
  }[];
  contacts: { id: string; name: string; role: string; phone: string }[];
  // Titles only: the rows of a dataset are fetched on its own page.
  datasets: { id: string; title: string; period: string | null; visibility: "public" | "protected" }[];
};

// Everything shown on a community's public page, cached under the same tag
// as the community itself so one revalidation refreshes the whole page.
// Hourly revalidation drops events that have passed.
export function getPublicContent(community: { id: string; slug: string }) {
  return unstable_cache(
    async (): Promise<PublicContent> => {
      const db = getDb();
      const where = { communityId: community.id };
      const [announcements, events, contacts, datasets] = await Promise.all([
        db.announcement.findMany({
          where: { ...where, status: "public" },
          orderBy: { publishedAt: "desc" },
          take: 20,
          select: { id: true, title: true, body: true, publishedAt: true },
        }),
        db.event.findMany({
          where: { ...where, startsAt: { gte: startOfTodayWib() } },
          orderBy: { startsAt: "asc" },
          take: 20,
          select: {
            id: true,
            title: true,
            startsAt: true,
            location: true,
            description: true,
          },
        }),
        db.contact.findMany({
          where,
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          take: 50,
          select: { id: true, name: true, role: true, phone: true },
        }),
        db.dataset.findMany({
          where: { ...where, visibility: { in: ["public", "protected"] } },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, title: true, period: true, visibility: true },
        }),
      ]);
      return {
        announcements: announcements.map((a) => ({
          ...a,
          publishedAt: a.publishedAt.toISOString(),
        })),
        events: events.map((e) => ({ ...e, startsAt: e.startsAt.toISOString() })),
        contacts,
        datasets: datasets.map((d) => ({
          ...d,
          visibility: d.visibility === "protected" ? ("protected" as const) : ("public" as const),
        })),
      };
    },
    ["community-content", community.id],
    { tags: [communityTag(community.slug)], revalidate: 3600 },
  )();
}
