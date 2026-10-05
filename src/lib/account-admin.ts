import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

// Gives an account a temporary password: the account is signed out
// everywhere and must pick its own password at the next login. Shared by the
// "reset password" button for super admins and the emergency script.
export async function setTemporaryPassword(userId: string, password: string) {
  const ctx = await auth.$context;
  await ctx.internalAdapter.updatePassword(userId, await ctx.password.hash(password));

  const db = getDb();
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { mustChangePassword: true } }),
    db.session.deleteMany({ where: { userId } }),
  ]);
}

// Emergency access by username. Returns false when no such account exists.
export async function resetAccountPassword(username: string, password: string) {
  const user = await getDb().user.findUnique({ where: { username }, select: { id: true } });
  if (!user) return false;
  await setTemporaryPassword(user.id, password);
  return true;
}
