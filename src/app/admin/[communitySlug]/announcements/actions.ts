"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/access";
import { getDb } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { getString, requireUuid } from "@/lib/form";
import { revalidateCommunity } from "@/lib/revalidate";
import { parseRichDoc } from "@/lib/rich-text";

function parse(formData: FormData) {
  const title = getString(formData, "title");
  const bodyJson = getString(formData, "bodyDoc");
  const status = getString(formData, "status") === "public" ? "public" : "draft";
  const values = { title, bodyDoc: bodyJson, status };

  if (title.length < 3 || title.length > 120)
    return { error: "Judul 3-120 karakter.", values };
  // The document is rebuilt from an allow-list, so only what the editor can
  // make is stored; `body` keeps its plain text.
  const parsed = parseRichDoc(bodyJson, { maxText: 5000 });
  if ("error" in parsed)
    return { error: `Isi pengumuman: ${parsed.error.toLowerCase()}`, values };
  return { data: { title, body: parsed.text, bodyDoc: parsed.doc, status } as const, values };
}

function refresh(slug: string) {
  revalidateCommunity(slug);
  revalidatePath(`/admin/${slug}/announcements`);
}

export async function createAnnouncement(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { community } = await requireMember(slug);
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  await getDb().announcement.create({
    data: { ...parsed.data, communityId: community.id },
  });
  refresh(slug);
  return { ok: "Pengumuman disimpan." };
}

export async function updateAnnouncement(
  slug: string,
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { community } = await requireMember(slug);
  requireUuid(id);
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  const db = getDb();
  const existing = await db.announcement.findFirst({
    where: { id, communityId: community.id },
    select: { status: true },
  });
  if (!existing) notFound();

  await db.announcement.updateMany({
    where: { id, communityId: community.id },
    data: {
      ...parsed.data,
      // The public date is when it was first published, not first drafted.
      ...(existing.status === "draft" && parsed.data.status === "public"
        ? { publishedAt: new Date() }
        : {}),
    },
  });
  refresh(slug);
  return { ok: "Perubahan disimpan.", values: parsed.values };
}

export async function deleteAnnouncement(slug: string, id: string) {
  const { community } = await requireMember(slug);
  requireUuid(id);
  const { count } = await getDb().announcement.deleteMany({
    where: { id, communityId: community.id },
  });
  if (count === 0) notFound();
  refresh(slug);
}
