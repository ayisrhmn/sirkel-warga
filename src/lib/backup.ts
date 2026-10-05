import { validateDatasetInput, type DatasetInput } from "@/lib/dataset";
import { getDb } from "@/lib/db";

// A full backup of one community. It holds the content, not the secrets: no
// password hashes and no accounts, only a list of who the members were. That
// makes the file safe to keep, and an account can always be created again.
export type Backup = {
  format: "sirkel-backup";
  version: 1;
  exportedAt: string;
  community: { slug: string; name: string; timezone?: string };
  members: { username: string | null; name: string; role: "owner" | "admin" }[];
  announcements: {
    title: string;
    body: string;
    status: "draft" | "public";
    publishedAt: string;
  }[];
  events: {
    title: string;
    startsAt: string;
    location: string | null;
    description: string | null;
  }[];
  contacts: { name: string; role: string; phone: string; sortOrder: number }[];
  datasets: DatasetInput[];
};

export const BACKUP_MAX_BYTES = 3_500_000; // below the 4 MB Server Action limit

export async function buildBackup(community: {
  id: string;
  slug: string;
  name: string;
  timezone: string;
}): Promise<Backup> {
  const db = getDb();
  const where = { communityId: community.id };
  const [members, announcements, events, contacts, datasets] = await Promise.all([
    db.membership.findMany({
      where,
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: { role: true, user: { select: { username: true, name: true } } },
    }),
    db.announcement.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: { title: true, body: true, status: true, publishedAt: true },
    }),
    db.event.findMany({
      where,
      orderBy: { startsAt: "asc" },
      select: { title: true, startsAt: true, location: true, description: true },
    }),
    db.contact.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, role: true, phone: true, sortOrder: true },
    }),
    db.dataset.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: { title: true, period: true, visibility: true, columns: true, rows: true },
    }),
  ]);

  return {
    format: "sirkel-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    community: { slug: community.slug, name: community.name, timezone: community.timezone },
    members: members.map((m) => ({ ...m.user, role: m.role })),
    announcements: announcements.map((a) => ({
      ...a,
      publishedAt: a.publishedAt.toISOString(),
    })),
    events: events.map((e) => ({ ...e, startsAt: e.startsAt.toISOString() })),
    contacts,
    datasets: datasets.map((d) => ({
      title: d.title,
      period: d.period,
      visibility: d.visibility,
      columns: d.columns as string[],
      rows: d.rows as DatasetInput["rows"],
    })),
  };
}

const LIMITS = { announcements: 2000, events: 2000, contacts: 500, datasets: 100 };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, min: number, max: number) =>
  typeof v === "string" && v.length >= min && v.length <= max;
const optionalText = (v: unknown, max: number) => v === null || text(v, 0, max);
const isoDate = (v: unknown) => typeof v === "string" && !Number.isNaN(Date.parse(v));

// Reads a backup file. Everything in it is validated again with the same
// rules as the forms: the file may have been edited or come from anywhere.
export function parseBackup(raw: string): { error: string } | { data: Backup } {
  const bad = { error: "File cadangan tidak valid." };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return bad;
  }
  if (!isObj(json) || json.format !== "sirkel-backup" || json.version !== 1) return bad;
  const { community, announcements, events, contacts, datasets } = json;
  if (!isObj(community) || !text(community.slug, 1, 100) || !text(community.name, 3, 80)) return bad;
  if (
    !Array.isArray(announcements) || announcements.length > LIMITS.announcements ||
    !Array.isArray(events) || events.length > LIMITS.events ||
    !Array.isArray(contacts) || contacts.length > LIMITS.contacts ||
    !Array.isArray(datasets) || datasets.length > LIMITS.datasets
  )
    return bad;

  for (const a of announcements) {
    if (!isObj(a) || !text(a.title, 3, 120) || !text(a.body, 1, 5000) ||
        (a.status !== "draft" && a.status !== "public") || !isoDate(a.publishedAt))
      return bad;
  }
  for (const e of events) {
    if (!isObj(e) || !text(e.title, 3, 120) || !isoDate(e.startsAt) ||
        !optionalText(e.location, 120) || !optionalText(e.description, 1000))
      return bad;
  }
  for (const c of contacts) {
    if (!isObj(c) || !text(c.name, 2, 80) || !text(c.role, 2, 80) ||
        typeof c.phone !== "string" || !/^[0-9+()\- ]{5,20}$/.test(c.phone) ||
        !Number.isInteger(c.sortOrder) || (c.sortOrder as number) < 0 || (c.sortOrder as number) > 999)
      return bad;
  }
  const checked: DatasetInput[] = [];
  for (const d of datasets) {
    const result = validateDatasetInput(d);
    if ("error" in result) return { error: `Laporan dalam cadangan tidak valid: ${result.error}` };
    checked.push(result.data);
  }

  return {
    data: {
      format: "sirkel-backup",
      version: 1,
      exportedAt: typeof json.exportedAt === "string" ? json.exportedAt : "",
      community: {
        slug: community.slug as string,
        name: community.name as string,
        // Older backups have no zone: restoring falls back to WIB.
        timezone: typeof community.timezone === "string" ? community.timezone : undefined,
      },
      members: [], // informational only, never restored
      announcements: announcements as Backup["announcements"],
      events: events as Backup["events"],
      contacts: contacts as Backup["contacts"],
      datasets: checked,
    },
  };
}
