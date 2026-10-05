"use client";

import { useActionState } from "react";
import { PasswordInput } from "@/components/password-input";
import { buttonClass, errorClass } from "@/components/form-styles";
import type { FormState } from "@/lib/form-state";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {} as FormState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        Password lama
        <PasswordInput
          name="current"
          required
          autoComplete="current-password"
        />
      </label>
      <label className="flex flex-col gap-1">
        Password baru (minimal 8 karakter)
        <PasswordInput
          name="new"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      <label className="flex flex-col gap-1">
        Ulangi password baru
        <PasswordInput
          name="confirm"
          required
          autoComplete="new-password"
        />
      </label>
      {state.error && <p className={errorClass}>{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Menyimpan..." : "Ganti password"}
      </button>
    </form>
  );
}
