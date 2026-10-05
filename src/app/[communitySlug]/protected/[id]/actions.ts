"use server";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { requireUuid } from "@/lib/form";
import { verifyPassword } from "@/lib/password";
import {
  ACCESS_MAX_AGE_SECONDS,
  accessCookieName,
  createAccessToken,
} from "@/lib/protected-access";
import { clearRateLimit, clientIp, hitRateLimit } from "@/lib/rate-limit";
import { SLUG_RE } from "@/lib/slug";

const ATTEMPTS = { max: 5, windowMs: 10 * 60 * 1000 };

export async function unlockDatasets(
  slug: string,
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!SLUG_RE.test(slug)) notFound();
  requireUuid(id);

  const community = await getDb().community.findUnique({
    where: { slug },
    select: { id: true, protectedPasswordHash: true },
  });
  if (!community) notFound();
  if (!community.protectedPasswordHash)
    return { error: "Pengurus belum menetapkan password." };

  // Every attempt counts before the password is checked, so a burst of
  // parallel guesses is cut off too. A correct password clears the counter.
  const key = `unlock:${community.id}:${await clientIp()}`;
  if (!(await hitRateLimit(key, ATTEMPTS)))
    return { error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." };

  const password = String(formData.get("password") ?? "");
  if (!(await verifyPassword(password, community.protectedPasswordHash)))
    return { error: "Password salah." };

  await clearRateLimit(key);
  (await cookies()).set(
    accessCookieName(community.id),
    createAccessToken(community.id, community.protectedPasswordHash),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: `/${slug}`,
      maxAge: ACCESS_MAX_AGE_SECONDS,
    },
  );
  redirect(`/${slug}/protected/${id}`);
}
