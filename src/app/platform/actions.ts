"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

// Server Actions are public endpoints: re-check the caller every time.
async function requirePlatformAdmin() {
  const user = await requireUser();
  if (!user.isPlatformAdmin) notFound();
}

export async function approveUser(userId: string) {
  await requirePlatformAdmin();
  await getDb().user.updateMany({
    where: { id: userId, approved: false },
    data: { approved: true },
  });
  revalidatePath("/platform");
}

// Only pending accounts can be rejected, so this can never delete an
// approved user.
export async function rejectUser(userId: string) {
  await requirePlatformAdmin();
  await getDb().user.deleteMany({ where: { id: userId, approved: false } });
  revalidatePath("/platform");
}
