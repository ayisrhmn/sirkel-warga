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
import { clearRateLimit, clientIp, hitRateLimit, releaseRateLimit } from "@/lib/rate-limit";
import { SLUG_RE } from "@/lib/slug";

// Per visitor address: stops one person from guessing.
const PER_ADDRESS = { max: 5, windowMs: 10 * 60 * 1000 };
// Per community, counting only wrong guesses: stops guessing from many
// addresses at once (IPv6 makes new addresses free). Visitors who already
// unlocked are not affected; new ones wait for the window to pass.
const PER_COMMUNITY = { max: 100, windowMs: 60 * 60 * 1000 };

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
  if (!(await hitRateLimit(key, PER_ADDRESS)))
    return { error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." };
  const communityKey = `unlock-all:${community.id}`;
  if (!(await hitRateLimit(communityKey, PER_COMMUNITY)))
    return {
      error: "Terlalu banyak percobaan gagal pada laporan komunitas ini. Coba lagi nanti atau hubungi pengurus.",
    };

  const password = String(formData.get("password") ?? "");
  if (!(await verifyPassword(password, community.protectedPasswordHash)))
    return { error: "Password salah." };

  // A correct password is not a guess: it resets this address and gives the
  // community-wide attempt back.
  await clearRateLimit(key);
  await releaseRateLimit(communityKey);
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
