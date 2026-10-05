"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { BACKUP_MAX_BYTES, parseBackup } from "@/lib/backup";
import { communityTag } from "@/lib/communities";
import { asTimeZone } from "@/lib/datetime";
import { getDb } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { requireUser } from "@/lib/session";
import { validateSlug } from "@/lib/slug";

const PLATFORM_ADMIN_MESSAGE = "Akun platform admin tidak bisa membuat komunitas.";

export async function createCommunity(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (user.isPlatformAdmin) return { error: PLATFORM_ADMIN_MESSAGE };
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const timezone = asTimeZone(String(formData.get("timezone") ?? ""));
  const values = { name, slug };

  if (name.length < 3 || name.length > 80)
    return { error: "Nama komunitas 3-80 karakter.", values };
  const slugError = validateSlug(slug);
  if (slugError) return { error: slugError, values };

  const db = getDb();
  if ((await db.membership.count({ where: { userId: user.id } })) > 0)
    return { error: "Kamu sudah punya komunitas.", values };

  try {
    await db.community.create({
      data: {
        name,
        slug,
        timezone,
        memberships: { create: { userId: user.id, role: "owner" } },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return { error: "Slug sudah dipakai, coba yang lain.", values };
    throw error;
  }

  // Drop any cached "not found" for this slug so the public page shows up now.
  updateTag(communityTag(slug));
  revalidatePath(`/${slug}`);
  redirect(`/admin/${slug}`);
}

// Recreates a community from a backup file: the uploader becomes its owner.
// Accounts are not part of a backup, so admins must be created again.
export async function restoreCommunity(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (user.isPlatformAdmin) return { error: PLATFORM_ADMIN_MESSAGE };
  const db = getDb();
  if ((await db.membership.count({ where: { userId: user.id } })) > 0)
    return { error: "Kamu sudah punya komunitas." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Pilih file cadangan (.json)." };
  if (file.size > BACKUP_MAX_BYTES) return { error: "File terlalu besar." };

  const parsed = parseBackup(await file.text());
  if ("error" in parsed) return { error: parsed.error };
  const backup = parsed.data;

  const slug = (String(formData.get("slug") ?? "").trim() || backup.community.slug).toLowerCase();
  const slugError = validateSlug(slug);
  if (slugError) return { error: slugError, values: { slug } };

  try {
    await db.$transaction(
      async (tx) => {
        const community = await tx.community.create({
          data: {
            slug,
            name: backup.community.name,
            timezone: asTimeZone(backup.community.timezone),
            memberships: { create: { userId: user.id, role: "owner" } },
          },
        });
        const communityId = community.id;
        await tx.announcement.createMany({
          data: backup.announcements.map((a) => ({
            ...a,
            publishedAt: new Date(a.publishedAt),
            communityId,
          })),
        });
        await tx.event.createMany({
          data: backup.events.map((e) => ({ ...e, startsAt: new Date(e.startsAt), communityId })),
        });
        await tx.contact.createMany({
          data: backup.contacts.map((c) => ({ ...c, communityId })),
        });
        await tx.dataset.createMany({
          data: backup.datasets.map((d) => ({ ...d, communityId })),
        });
      },
      { timeout: 30_000 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return { error: "Slug sudah dipakai. Isi slug lain di bawah.", values: { slug } };
    throw error;
  }

  updateTag(communityTag(slug));
  revalidatePath(`/${slug}`);
  redirect(`/admin/${slug}`);
}
