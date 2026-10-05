"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireMember } from "@/lib/access";
import { validateDatasetInput, VISIBILITIES, type Visibility } from "@/lib/dataset";
import { getDb } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { getString, requireUuid } from "@/lib/form";
import { revalidateCommunity } from "@/lib/revalidate";

function refresh(slug: string) {
  revalidateCommunity(slug);
  revalidatePath(`/admin/${slug}/datasets`);
}

// Called from the import screen with the table parsed in the browser.
export async function createDataset(
  slug: string,
  input: unknown,
): Promise<{ error: string }> {
  const { community } = await requireMember(slug);
  const parsed = validateDatasetInput(input);
  if ("error" in parsed) return { error: parsed.error };

  const { title, period, visibility, columns, rows } = parsed.data;
  await getDb().dataset.create({
    data: { title, period, visibility, columns, rows, communityId: community.id },
  });
  refresh(slug);
  redirect(`/admin/${slug}/datasets`);
}

export async function updateDatasetMeta(
  slug: string,
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { community } = await requireMember(slug);
  requireUuid(id);

  const title = getString(formData, "title");
  const period = getString(formData, "period");
  const visibility = getString(formData, "visibility") as Visibility;
  const values = { title, period, visibility };

  if (title.length < 3 || title.length > 120)
    return { error: "Judul 3-120 karakter.", values };
  if (period.length > 60) return { error: "Periode maksimal 60 karakter.", values };
  if (!VISIBILITIES.includes(visibility))
    return { error: "Visibilitas tidak valid.", values };

  const { count } = await getDb().dataset.updateMany({
    where: { id, communityId: community.id },
    data: { title, period: period || null, visibility },
  });
  if (count === 0) notFound();
  refresh(slug);
  return { ok: "Perubahan disimpan.", values };
}

export async function deleteDataset(slug: string, id: string) {
  const { community } = await requireMember(slug);
  requireUuid(id);
  const { count } = await getDb().dataset.deleteMany({
    where: { id, communityId: community.id },
  });
  if (count === 0) notFound();
  refresh(slug);
  redirect(`/admin/${slug}/datasets`);
}
