"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Field } from "@/components/molecules/field";
import { FormMessage } from "@/components/molecules/form-message";
import type { FormState } from "@/lib/form-state";
import { createContact, updateContact } from "./actions";

export type ContactItem = {
  id: string;
  name: string;
  role: string;
  phone: string;
  sortOrder: string;
};

// Creates a new contact, or edits `item` when given.
export function ContactForm({ slug, item }: { slug: string; item?: ContactItem }) {
  const [state, action, pending] = useActionState(
    item ? updateContact.bind(null, slug, item.id) : createContact.bind(null, slug),
    {} as FormState,
  );
  const value = (key: keyof ContactItem) => state.values?.[key] ?? item?.[key];

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Nama">
        <Input name="name" required defaultValue={value("name")} />
      </Field>
      <Field label="Peran" hint="Mis. Ketua RT, Ronda, Posyandu">
        <Input name="role" required defaultValue={value("role")} />
      </Field>
      <Field label="Nomor WhatsApp" hint="Mis. 0812 3456 7890">
        <Input name="phone" type="tel" required defaultValue={value("phone")} />
      </Field>
      <Field label="Urutan" hint="Angka kecil tampil lebih dulu">
        <Input name="sortOrder" type="number" min={0} max={999} defaultValue={value("sortOrder") ?? "0"} />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" full disabled={pending}>
        {pending ? "Menyimpan..." : item ? "Simpan perubahan" : "Tambah kontak"}
      </Button>
    </form>
  );
}
