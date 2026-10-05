"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/access";
import { getDb } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { getString, requireUuid } from "@/lib/form";
import { revalidateCommunity } from "@/lib/revalidate";

function parse(formData: FormData) {
  const name = getString(formData, "name");
  const role = getString(formData, "role");
  const phone = getString(formData, "phone");
  const sortOrderInput = getString(formData, "sortOrder") || "0";
  const values = { name, role, phone, sortOrder: sortOrderInput };

  if (name.length < 2 || name.length > 80) return { error: "Nama 2-80 karakter.", values };
  if (role.length < 2 || role.length > 80) return { error: "Peran 2-80 karakter.", values };
  if (!/^[0-9+()\- ]{5,20}$/.test(phone))
    return { error: "Nomor telepon 5-20 karakter (angka, +, -, spasi).", values };
  const sortOrder = Number(sortOrderInput);
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 999)
    return { error: "Urutan harus angka 0-999.", values };

  return { data: { name, role, phone, sortOrder }, values };
}

function refresh(slug: string) {
  revalidateCommunity(slug);
  revalidatePath(`/admin/${slug}/contacts`);
}

export async function createContact(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { community } = await requireMember(slug);
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  await getDb().contact.create({
    data: { ...parsed.data, communityId: community.id },
  });
  refresh(slug);
  return { ok: "Kontak disimpan." };
}

export async function updateContact(
  slug: string,
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { community } = await requireMember(slug);
  requireUuid(id);
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };

  const { count } = await getDb().contact.updateMany({
    where: { id, communityId: community.id },
    data: parsed.data,
  });
  if (count === 0) notFound();
  refresh(slug);
  return { ok: "Perubahan disimpan.", values: parsed.values };
}

export async function deleteContact(slug: string, id: string) {
  const { community } = await requireMember(slug);
  requireUuid(id);
  const { count } = await getDb().contact.deleteMany({
    where: { id, communityId: community.id },
  });
  if (count === 0) notFound();
  refresh(slug);
}
