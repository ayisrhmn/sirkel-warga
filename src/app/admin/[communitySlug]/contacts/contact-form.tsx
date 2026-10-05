"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
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
    <form action={action} className="flex flex-col gap-3">
      <Field label="Nama">
        <input name="name" required defaultValue={value("name")} className={inputClass} />
      </Field>
      <Field label="Peran (mis. Ketua RT, Ronda, Posyandu)">
        <input name="role" required defaultValue={value("role")} className={inputClass} />
      </Field>
      <Field label="Nomor WhatsApp (mis. 0812 3456 7890)">
        <input
          name="phone"
          type="tel"
          required
          defaultValue={value("phone")}
          className={inputClass}
        />
      </Field>
      <Field label="Urutan (angka kecil tampil lebih dulu)">
        <input
          name="sortOrder"
          type="number"
          min={0}
          max={999}
          defaultValue={value("sortOrder") ?? "0"}
          className={inputClass}
        />
      </Field>
      {state.error && <p className={errorClass}>{state.error}</p>}
      {state.ok && <p className="text-sm text-green-700">{state.ok}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Menyimpan..." : item ? "Simpan perubahan" : "Tambah kontak"}
      </button>
    </form>
  );
}
