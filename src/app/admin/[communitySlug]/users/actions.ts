"use server";

import { APIError } from "better-auth/api";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/access";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { usernameToEmail } from "@/lib/username";

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

function validPassword(password: string) {
  return password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX;
}

// Creates an admin account for this community. The super admin chooses the
// first password; the account must change it on first login.
export async function createAdmin(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { community } = await requireMember(slug, { owner: true });
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { name, username };

  if (name.length < 2 || name.length > 80)
    return { error: "Nama 2-80 karakter.", values };
  if (!/^[a-z0-9_.]{3,30}$/.test(username))
    return {
      error: "Username 3-30 karakter: huruf kecil, angka, titik, atau garis bawah.",
      values,
    };
  if (!validPassword(password))
    return { error: `Password minimal ${PASSWORD_MIN} karakter.`, values };

  let userId: string;
  try {
    const result = await auth.api.signUpEmail({
      body: { email: usernameToEmail(username), password, name, username },
    });
    userId = result.user.id;
  } catch (error) {
    if (error instanceof APIError)
      return { error: "Username sudah dipakai atau tidak valid.", values };
    throw error;
  }

  const db = getDb();
  try {
    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { approved: true, mustChangePassword: true },
      }),
      db.membership.create({
        data: { userId, communityId: community.id, role: "admin" },
      }),
    ]);
  } catch (error) {
    // Don't leave an unapproved orphan account in the approval queue.
    await db.user.deleteMany({ where: { id: userId, approved: false } });
    throw error;
  }

  revalidatePath(`/admin/${slug}/users`);
  return {
    ok: `Akun @${username} dibuat. Kirim password awalnya secara pribadi; akun wajib menggantinya saat login pertama.`,
  };
}

// Only admins of this community can be targeted: never the owner, never a
// user of another community.
async function requireAdminTarget(communityId: string, userId: string) {
  const target = await getDb().membership.findFirst({
    where: { communityId, userId, role: "admin" },
    select: { userId: true },
  });
  if (!target) notFound();
}

export async function resetPassword(
  slug: string,
  userId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { community } = await requireMember(slug, { owner: true });
  await requireAdminTarget(community.id, userId);

  const password = String(formData.get("password") ?? "");
  if (!validPassword(password))
    return { error: `Password minimal ${PASSWORD_MIN} karakter.` };

  const ctx = await auth.$context;
  await ctx.internalAdapter.updatePassword(
    userId,
    await ctx.password.hash(password),
  );

  const db = getDb();
  // Sign the account out everywhere and force a new password on next login.
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { mustChangePassword: true } }),
    db.session.deleteMany({ where: { userId } }),
  ]);

  return {
    ok: "Password direset. Akun wajib menggantinya saat login berikutnya.",
  };
}

export async function removeAdmin(slug: string, userId: string) {
  const { community } = await requireMember(slug, { owner: true });
  await requireAdminTarget(community.id, userId);

  await getDb().$transaction(async (tx) => {
    await tx.membership.deleteMany({
      where: { communityId: community.id, userId, role: "admin" },
    });
    // Created admins belong to one community only, so deleting the account
    // also ends its sessions (they cascade) and revokes access immediately.
    if ((await tx.membership.count({ where: { userId } })) === 0)
      await tx.user.delete({ where: { id: userId } });
  });

  revalidatePath(`/admin/${slug}/users`);
}
