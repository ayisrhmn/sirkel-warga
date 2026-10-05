"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
import type { FormState } from "@/lib/form-state";
import { unlockDatasets } from "./actions";

export function UnlockForm({ slug, id }: { slug: string; id: string }) {
  const [state, action, pending] = useActionState(
    unlockDatasets.bind(null, slug, id),
    {} as FormState,
  );

  return (
    <form action={action} className="flex max-w-sm flex-col gap-3">
      <Field label="Password">
        <input
          name="password"
          type="password"
          required
          autoComplete="off"
          className={inputClass}
        />
      </Field>
      {state.error && <p className={errorClass}>{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Memeriksa..." : "Buka laporan"}
      </button>
    </form>
  );
}
