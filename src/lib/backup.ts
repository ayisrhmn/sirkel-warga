import { validateDatasetInput, type DatasetInput } from "@/lib/dataset";
import { getDb } from "@/lib/db";
import { checkPrimaryColor } from "@/lib/theme";
import { parseRichDoc, type RichDoc } from "@/lib/rich-text";

// A full backup of one community. It holds the content, not the secrets: no
// password hashes and no accounts, only a list of who the members were. That
// makes the file safe to keep, and an account can always be created again.
export type Backup = {
  format: "sirkel-backup";
  version: 1;
  exportedAt: string;
  community: { slug: string; name: string; timezone?: string; primaryColor?: string | null };
  members: { username: string | null; name: string; role: "owner" | "admin" }[];
  announcements: {
    title: string;
    body: string;
    bodyDoc?: RichDoc | null; // absent in backups made before rich text
    status: "draft" | "public";
    publishedAt: string;
  }[];
  events: {
    title: string;
    startsAt: string;
    location: string | null;
    description: string | null;
    descriptionDoc?: RichDoc | null;
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
  primaryColor: string | null;
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
      select: { title: true, body: true, bodyDoc: true, status: true, publishedAt: true },
    }),
    db.event.findMany({
      where,
      orderBy: { startsAt: "asc" },
      select: { title: true, startsAt: true, location: true, description: true, descriptionDoc: true },
    }),
    db.contact.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, role: true, phone: true, sortOrder: true },
    }),
    db.dataset.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: { title: true, period: true, visibility: true, columns: true, rows: true, fills: true },
    }),
  ]);

  return {
    format: "sirkel-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    community: { slug: community.slug, name: community.name, timezone: community.timezone, primaryColor: community.primaryColor },
    members: members.map((m) => ({ ...m.user, role: m.role })),
    announcements: announcements.map((a) => ({
      ...a,
      bodyDoc: a.bodyDoc as RichDoc | null,
      publishedAt: a.publishedAt.toISOString(),
    })),
    events: events.map((e) => ({
      ...e,
      descriptionDoc: e.descriptionDoc as RichDoc | null,
      startsAt: e.startsAt.toISOString(),
    })),
    contacts,
    datasets: datasets.map((d) => ({
      title: d.title,
      period: d.period,
      visibility: d.visibility,
      columns: d.columns as string[],
      rows: d.rows as DatasetInput["rows"],
      fills: d.fills as DatasetInput["fills"],
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

const readableColor = (value: unknown) => {
  const checked = checkPrimaryColor(value);
  return "color" in checked ? checked.color : null;
};

const cleanDoc = (value: unknown): RichDoc | null => {
  if (value == null) return null;
  const parsed = parseRichDoc(value, { maxText: 5000, allowEmpty: true });
  return "doc" in parsed && parsed.text !== "" ? parsed.doc : null;
};

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
        !optionalText(e.location, 120) || !optionalText(e.description, 5000))
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
        // Older backups have no colour, and an unreadable one is dropped: the default applies.
        primaryColor: readableColor(community.primaryColor),
      },
      members: [], // informational only, never restored
      // The documents are rebuilt from the allow-list, like on every save.
      announcements: (announcements as Obj[]).map((a): Backup["announcements"][number] => ({
        ...(a as Backup["announcements"][number]),
        bodyDoc: cleanDoc(a.bodyDoc),
      })),
      events: (events as Obj[]).map((e): Backup["events"][number] => ({
        ...(e as Backup["events"][number]),
        descriptionDoc: cleanDoc(e.descriptionDoc),
      })),
      contacts: contacts as Backup["contacts"],
      datasets: checked,
    },
  };
}
