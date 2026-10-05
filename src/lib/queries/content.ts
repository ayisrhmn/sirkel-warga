import { getDb } from "@/lib/db";

// Reads for the admin pages of a community's content. Every query is scoped by
// `communityId`, which callers take from `requireMember`, never from input.

export async function getContentCounts(communityId: string) {
  const where = { communityId };
  const db = getDb();
  const [announcements, drafts, events, contacts, datasets] = await Promise.all([
    db.announcement.count({ where: { ...where, status: "public" } }),
    db.announcement.count({ where: { ...where, status: "draft" } }),
    db.event.count({ where }),
    db.contact.count({ where }),
    db.dataset.count({ where }),
  ]);
  return { announcements, drafts, events, contacts, datasets };
}

export const listAnnouncements = (communityId: string) =>
  getDb().announcement.findMany({
    where: { communityId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, body: true, bodyDoc: true, status: true, publishedAt: true },
  });

export const listEvents = (communityId: string) =>
  getDb().event.findMany({
    where: { communityId },
    orderBy: { startsAt: "desc" },
    select: { id: true, title: true, startsAt: true, location: true, description: true, descriptionDoc: true },
  });

export const listContacts = (communityId: string) =>
  getDb().contact.findMany({
    where: { communityId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, role: true, phone: true, sortOrder: true },
  });
