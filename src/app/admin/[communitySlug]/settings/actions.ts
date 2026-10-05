"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/access";
import { communityTag } from "@/lib/communities";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { FormState } from "@/lib/form-state";

export async function renameCommunity(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { community } = await requireMember(slug, { owner: true });
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 3 || name.length > 80)
    return { error: "Nama komunitas 3-80 karakter.", values: { name } };

  await getDb().community.update({
    where: { id: community.id },
    data: { name },
  });

  updateTag(communityTag(slug));
  revalidatePath(`/${slug}`);
  revalidatePath(`/admin/${slug}`, "layout");
  return { ok: "Nama komunitas disimpan.", values: { name } };
}

// Deletes the community with its content and memberships, plus the admin
// accounts that only belonged to it. The owner's account stays.
export async function deleteCommunity(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { community } = await requireMember(slug, { owner: true });
  if (String(formData.get("confirm") ?? "").trim() !== community.slug)
    return { error: "Ketik slug komunitas dengan benar untuk menghapus." };

  await getDb().$transaction(async (tx) => {
    const admins = await tx.membership.findMany({
      where: { communityId: community.id, role: "admin" },
      select: { userId: true },
    });
    await tx.community.delete({ where: { id: community.id } });
    await tx.user.deleteMany({
      where: {
        id: { in: admins.map((a) => a.userId) },
        memberships: { none: {} },
      },
    });
  });

  updateTag(communityTag(slug));
  revalidatePath(`/${slug}`);
  redirect("/admin");
}

const PROTECTED_PASSWORD_MIN = 8;
const PROTECTED_PASSWORD_MAX = 64;

// The one password warga enter to open `protected` datasets. Only the hash is
// stored. Changing it signs every visitor out of protected data.
export async function setProtectedPassword(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { community } = await requireMember(slug, { owner: true });
  const password = String(formData.get("password") ?? "");
  if (password.length < PROTECTED_PASSWORD_MIN || password.length > PROTECTED_PASSWORD_MAX)
    return {
      error: `Password ${PROTECTED_PASSWORD_MIN}-${PROTECTED_PASSWORD_MAX} karakter.`,
    };

  await getDb().community.update({
    where: { id: community.id },
    data: { protectedPasswordHash: await hashPassword(password) },
  });
  revalidatePath(`/admin/${slug}`, "layout");
  return {
    ok: "Password disimpan. Semua pengunjung yang sudah membuka laporan dilindungi harus memasukkan password baru.",
  };
}
