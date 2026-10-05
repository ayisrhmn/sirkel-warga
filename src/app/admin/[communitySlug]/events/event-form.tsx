"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
import type { FormState } from "@/lib/form-state";
import { createEvent, updateEvent } from "./actions";

export type EventItem = {
  id: string;
  title: string;
  startsAt: string; // datetime-local value, WIB
  location: string;
  description: string;
};

// Creates a new event, or edits `item` when given.
export function EventForm({ slug, item }: { slug: string; item?: EventItem }) {
  const [state, action, pending] = useActionState(
    item ? updateEvent.bind(null, slug, item.id) : createEvent.bind(null, slug),
    {} as FormState,
  );
  const value = (key: keyof EventItem) => state.values?.[key] ?? item?.[key];

  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="Judul">
        <input name="title" required defaultValue={value("title")} className={inputClass} />
      </Field>
      <Field label="Tanggal dan jam (WIB)">
        <input
          name="startsAt"
          type="datetime-local"
          required
          defaultValue={value("startsAt")}
          className={inputClass}
        />
      </Field>
      <Field label="Lokasi (opsional)">
        <input name="location" defaultValue={value("location")} className={inputClass} />
      </Field>
      <Field label="Keterangan (opsional)">
        <textarea
          name="description"
          rows={3}
          defaultValue={value("description")}
          className={inputClass}
        />
      </Field>
      {state.error && <p className={errorClass}>{state.error}</p>}
      {state.ok && <p className="text-sm text-green-700 dark:text-green-400">{state.ok}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Menyimpan..." : item ? "Simpan perubahan" : "Tambah agenda"}
      </button>
    </form>
  );
}
