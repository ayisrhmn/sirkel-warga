"use client";

import { useActionState } from "react";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
import type { FormState } from "@/lib/form-state";
import { createAdmin } from "./actions";

export function AddAdminForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(
    createAdmin.bind(null, slug),
    {} as FormState,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        Nama
        <input
          name="name"
          required
          defaultValue={state.values?.name}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        Username
        <input
          name="username"
          required
          autoCapitalize="none"
          defaultValue={state.values?.username}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        Password awal (minimal 8 karakter)
        <input
          name="password"
          type="text"
          required
          minLength={8}
          autoComplete="off"
          className={inputClass}
        />
      </label>
      {state.error && <p className={errorClass}>{state.error}</p>}
      {state.ok && <p className="text-sm text-green-700 dark:text-green-400">{state.ok}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Membuat..." : "Buat akun admin"}
      </button>
    </form>
  );
}
