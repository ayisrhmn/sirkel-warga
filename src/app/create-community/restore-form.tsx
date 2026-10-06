"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Field } from "@/components/molecules/field";
import { FileInput } from "@/components/molecules/file-input";
import { FormMessage } from "@/components/molecules/form-message";
import type { FormState } from "@/lib/form-state";
import { restoreCommunity } from "./actions";

export function RestoreForm() {
  const [state, action, pending] = useActionState(restoreCommunity, {} as FormState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="File cadangan (.json)">
        <FileInput name="file" accept=".json,application/json" hint="Berkas cadangan .json" required />
      </Field>
      <Field label="Slug (opsional, kosongkan untuk memakai slug di cadangan)">
        <Input name="slug" autoCapitalize="none" defaultValue={state.values?.slug} />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" variant="secondary" full disabled={pending}>
        {pending ? "Memulihkan..." : "Pulihkan komunitas"}
      </Button>
    </form>
  );
}
