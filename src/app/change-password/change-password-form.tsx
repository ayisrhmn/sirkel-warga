"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { Field } from "@/components/molecules/field";
import { FormMessage } from "@/components/molecules/form-message";
import { PasswordInput } from "@/components/molecules/password-input";
import type { FormState } from "@/lib/form-state";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {} as FormState);

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Password lama">
        <PasswordInput name="current" required autoComplete="current-password" />
      </Field>
      <Field label="Password baru (minimal 8 karakter)">
        <PasswordInput name="new" required minLength={8} autoComplete="new-password" />
      </Field>
      <Field label="Ulangi password baru">
        <PasswordInput name="confirm" required autoComplete="new-password" />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" full disabled={pending}>
        {pending ? "Menyimpan..." : "Ganti password"}
      </Button>
    </form>
  );
}
