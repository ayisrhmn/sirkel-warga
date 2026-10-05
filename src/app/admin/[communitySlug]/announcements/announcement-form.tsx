"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Field } from "@/components/molecules/field";
import { FormMessage } from "@/components/molecules/form-message";
import { RadioCardGroup } from "@/components/molecules/radio-card-group";
import { RichTextEditor } from "@/components/organisms/rich-text-editor";
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
    <form action={action} className="flex flex-col gap-5">
      <Field label="Judul">
        <Input name="title" required defaultValue={value("title")} />
      </Field>
      <RichTextEditor
        name="bodyDoc"
        label="Isi"
        defaultValue={value("bodyDoc") ?? ""}
        legacyText={item?.body}
        syncKey={state}
      />
      <RadioCardGroup
        name="status"
        legend="Status"
        defaultValue={value("status") ?? "public"}
        options={[
          { value: "public", label: "Publik", description: "Tampil di halaman warga" },
          { value: "draft", label: "Draft", description: "Belum tampil" },
        ]}
      />
      <FormMessage state={state} />
      <Button type="submit" full disabled={pending}>
        {pending ? "Menyimpan..." : item ? "Simpan perubahan" : "Tambah pengumuman"}
      </Button>
    </form>
  );
}
