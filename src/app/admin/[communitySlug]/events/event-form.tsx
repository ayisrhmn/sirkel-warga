"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Field } from "@/components/molecules/field";
import { FormMessage } from "@/components/molecules/form-message";
import { RichTextEditor } from "@/components/organisms/rich-text-editor";
import type { FormState } from "@/lib/form-state";
import { createEvent, updateEvent } from "./actions";

export type EventItem = {
  id: string;
  title: string;
  startsAt: string; // datetime-local value in the community's zone
  location: string;
  description: string; // plain text, for rows that have no document yet
  descriptionDoc: string; // JSON of the editor document, or ""
};

// Creates a new event, or edits `item` when given.
export function EventForm({
  slug,
  zoneLabel,
  item,
}: {
  slug: string;
  zoneLabel: string;
  item?: EventItem;
}) {
  const [state, action, pending] = useActionState(
    item ? updateEvent.bind(null, slug, item.id) : createEvent.bind(null, slug),
    {} as FormState,
  );
  const value = (key: keyof EventItem) => state.values?.[key] ?? item?.[key];

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Judul">
        <Input name="title" required defaultValue={value("title")} />
      </Field>
      <Field label={`Tanggal dan jam (${zoneLabel})`}>
        <Input name="startsAt" type="datetime-local" required defaultValue={value("startsAt")} />
      </Field>
      <Field label="Lokasi (opsional)">
        <Input name="location" defaultValue={value("location")} />
      </Field>
      <RichTextEditor
        name="descriptionDoc"
        label="Keterangan (opsional)"
        defaultValue={value("descriptionDoc") ?? ""}
        legacyText={item?.description}
        syncKey={state}
      />
      <FormMessage state={state} />
      <Button type="submit" full disabled={pending}>
        {pending ? "Menyimpan..." : item ? "Simpan perubahan" : "Tambah agenda"}
      </Button>
    </form>
  );
}
