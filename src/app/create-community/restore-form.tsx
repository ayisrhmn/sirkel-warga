"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
import type { FormState } from "@/lib/form-state";
import { restoreCommunity } from "./actions";

export function RestoreForm() {
  const [state, action, pending] = useActionState(restoreCommunity, {} as FormState);

  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="File cadangan (.json)">
        <input name="file" type="file" accept=".json,application/json" required className={inputClass} />
      </Field>
      <Field label="Slug (opsional, kosongkan untuk memakai slug di cadangan)">
        <input
          name="slug"
          autoCapitalize="none"
          defaultValue={state.values?.slug}
          className={inputClass}
        />
      </Field>
      {state.error && <p className={errorClass}>{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Memulihkan..." : "Pulihkan komunitas"}
      </button>
    </form>
  );
}
