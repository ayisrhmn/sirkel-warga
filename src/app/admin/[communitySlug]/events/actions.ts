"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/access";
import { parseWibInput } from "@/lib/datetime";
import { getDb } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { getString, requireUuid } from "@/lib/form";
import { revalidateCommunity } from "@/lib/revalidate";

function parse(formData: FormData) {
  const title = getString(formData, "title");
  const startsAtInput = getString(formData, "startsAt");
  const location = getString(formData, "location");
  const description = getString(formData, "description");
  const values = { title, startsAt: startsAtInput, location, description };

  if (title.length < 3 || title.length > 120)
    return { error: "Judul 3-120 karakter.", values };
  const startsAt = parseWibInput(startsAtInput);
  if (!startsAt) return { error: "Tanggal dan jam tidak valid.", values };
  if (location.length > 120) return { error: "Lokasi maksimal 120 karakter.", values };
  if (description.length > 1000)
    return { error: "Keterangan maksimal 1000 karakter.", values };

  return {
    data: {
      title,
      startsAt,
      location: location || null,
      description: description || null,
    },
    values,
  };
}

function refresh(slug: string) {
  revalidateCommunity(slug);
  revalidatePath(`/admin/${slug}/events`);
}

export async function createEvent(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { community } = await requireMember(slug);
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  await getDb().event.create({
    data: { ...parsed.data, communityId: community.id },
  });
  refresh(slug);
  return { ok: "Agenda disimpan." };
}

export async function updateEvent(
  slug: string,
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { community } = await requireMember(slug);
  requireUuid(id);
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  const { count } = await getDb().event.updateMany({
    where: { id, communityId: community.id },
    data: parsed.data,
  });
  if (count === 0) notFound();
  refresh(slug);
  return { ok: "Perubahan disimpan.", values: parsed.values };
}

export async function deleteEvent(slug: string, id: string) {
  const { community } = await requireMember(slug);
  requireUuid(id);
  const { count } = await getDb().event.deleteMany({
    where: { id, communityId: community.id },
  });
  if (count === 0) notFound();
  refresh(slug);
}
