"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { passwordProblem } from "@/lib/password-policy";
import { requireUser } from "@/lib/session";

export async function changePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser({ allowPasswordChange: true });
  const currentPassword = String(formData.get("current") ?? "");
  const newPassword = String(formData.get("new") ?? "");

  if (newPassword.length < 8 || newPassword.length > 128)
    return { error: "Password baru minimal 8 karakter." };
  const weak = passwordProblem(newPassword, user.username ?? undefined);
  if (weak) return { error: weak };
  if (newPassword !== String(formData.get("confirm") ?? ""))
    return { error: "Konfirmasi password tidak sama." };
  if (newPassword === currentPassword)
    return { error: "Password baru harus berbeda dari yang lama." };

  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError)
      return { error: "Password lama salah." };
    throw error;
  }

  await getDb().user.update({
    where: { id: user.id },
    data: { mustChangePassword: false },
  });
  redirect("/admin");
}
