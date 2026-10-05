"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { communityTag } from "@/lib/communities";
import { getDb } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { requireUser } from "@/lib/session";
import { validateSlug } from "@/lib/slug";

export async function createCommunity(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
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
