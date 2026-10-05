import { unstable_cache } from "next/cache";
import { communityTag } from "@/lib/communities";
import { asTimeZone, startOfToday } from "@/lib/datetime";
import { getDb } from "@/lib/db";
import { excerpt } from "@/lib/rich-text";

// Dates are ISO strings: cached values go through JSON.
export type PublicContent = {
  // Previews only: the full text is on the detail page.
  announcements: { id: string; title: string; excerpt: string; publishedAt: string }[];
  events: {
    id: string;
    title: string;
    startsAt: string;
    location: string | null;
    excerpt: string;
  }[];
  contacts: { id: string; name: string; role: string; phone: string }[];
  // Titles only: the rows of a dataset are fetched on its own page.
  datasets: { id: string; title: string; period: string | null; visibility: "public" | "protected" }[];
};

// Everything shown on a community's public page, cached under the same tag
// as the community itself so one revalidation refreshes the whole page.
// Hourly revalidation drops events that have passed.
export function getPublicContent(community: { id: string; slug: string; timezone: string }) {
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
          where: { ...where, startsAt: { gte: startOfToday(asTimeZone(community.timezone)) } },
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
        announcements: announcements.map(({ body, ...a }) => ({
          ...a,
          excerpt: excerpt(body),
          publishedAt: a.publishedAt.toISOString(),
        })),
        events: events.map(({ description, ...e }) => ({
          ...e,
          excerpt: excerpt(description),
          startsAt: e.startsAt.toISOString(),
        })),
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
