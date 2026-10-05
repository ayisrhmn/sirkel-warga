"use client";

import { useActionState } from "react";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
import type { FormState } from "@/lib/form-state";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {} as FormState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        Password lama
        <input
          name="current"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        Password baru (minimal 8 karakter)
        <input
          name="new"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        Ulangi password baru
        <input
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      {state.error && <p className={errorClass}>{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Menyimpan..." : "Ganti password"}
      </button>
    </form>
  );
}
