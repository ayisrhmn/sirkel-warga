"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Field } from "@/components/molecules/field";
import { FormMessage } from "@/components/molecules/form-message";
import { VisibilityField } from "@/components/molecules/visibility-field";
import type { Visibility } from "@/lib/dataset";
import type { FormState } from "@/lib/form-state";
import { updateDatasetMeta } from "../actions";

export type DatasetMeta = {
  id: string;
  title: string;
  period: string;
  visibility: Visibility;
};

export function DatasetMetaForm({ slug, item }: { slug: string; item: DatasetMeta }) {
  const [state, action, pending] = useActionState(
    updateDatasetMeta.bind(null, slug, item.id),
    {} as FormState,
  );
  const value = (key: keyof DatasetMeta) => state.values?.[key] ?? item[key];

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Judul">
        <Input name="title" required defaultValue={value("title")} />
      </Field>
      <Field label="Periode (opsional)">
        <Input name="period" defaultValue={value("period")} />
      </Field>
      <VisibilityField defaultValue={value("visibility") as Visibility} />
      <FormMessage state={state} />
      <Button type="submit" full disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan perubahan"}
      </Button>
    </form>
  );
}
