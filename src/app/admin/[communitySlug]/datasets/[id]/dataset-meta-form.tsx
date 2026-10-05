"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
import { VISIBILITIES, VISIBILITY_LABEL, type Visibility } from "@/lib/dataset";
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
    <form action={action} className="flex flex-col gap-3">
      <Field label="Judul">
        <input name="title" required defaultValue={value("title")} className={inputClass} />
      </Field>
      <Field label="Periode (opsional)">
        <input name="period" defaultValue={value("period")} className={inputClass} />
      </Field>
      <Field label="Tampilan">
        <select name="visibility" defaultValue={value("visibility")} className={inputClass}>
          {VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {VISIBILITY_LABEL[v]}
            </option>
          ))}
        </select>
      </Field>
      {state.error && <p className={errorClass}>{state.error}</p>}
      {state.ok && <p className="text-sm text-green-700">{state.ok}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Menyimpan..." : "Simpan perubahan"}
      </button>
    </form>
  );
}
