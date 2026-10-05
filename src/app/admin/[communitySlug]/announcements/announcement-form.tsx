"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { FormState } from "@/lib/form-state";
import { createAnnouncement, updateAnnouncement } from "./actions";

export type AnnouncementItem = {
  id: string;
  title: string;
  body: string; // plain text, for rows that have no document yet
  bodyDoc: string; // JSON of the editor document, or ""
  status: "draft" | "public";
};

// Creates a new announcement, or edits `item` when given.
export function AnnouncementForm({
  slug,
  item,
}: {
  slug: string;
  item?: AnnouncementItem;
}) {
  const [state, action, pending] = useActionState(
    item ? updateAnnouncement.bind(null, slug, item.id) : createAnnouncement.bind(null, slug),
    {} as FormState,
  );
  const value = (key: keyof AnnouncementItem) => state.values?.[key] ?? item?.[key];

  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="Judul">
        <input name="title" required defaultValue={value("title")} className={inputClass} />
      </Field>
      <RichTextEditor
        name="bodyDoc"
        label="Isi"
        defaultValue={value("bodyDoc") ?? ""}
        legacyText={item?.body}
        syncKey={state}
      />
      <Field label="Status">
        <select name="status" defaultValue={value("status") ?? "public"} className={inputClass}>
          <option value="public">Publik (tampil di halaman warga)</option>
          <option value="draft">Draft (belum tampil)</option>
        </select>
      </Field>
      {state.error && <p className={errorClass}>{state.error}</p>}
      {state.ok && <p className="text-sm text-green-700">{state.ok}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Menyimpan..." : item ? "Simpan perubahan" : "Tambah pengumuman"}
      </button>
    </form>
  );
}
