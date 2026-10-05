"use client";

import { useActionState } from "react";
import { errorClass, inputClass } from "@/components/form-styles";
import type { FormState } from "@/lib/form-state";
import { removeAdmin, resetPassword } from "./actions";

export function ResetPasswordForm({
  slug,
  userId,
}: {
  slug: string;
  userId: string;
}) {
  const [state, action, pending] = useActionState(
    resetPassword.bind(null, slug, userId),
    {} as FormState,
  );

  return (
    <details>
      <summary className="cursor-pointer underline">Reset password</summary>
      <form action={action} className="mt-2 flex flex-col gap-2">
        <input
          name="password"
          type="text"
          required
          minLength={8}
          autoComplete="off"
          placeholder="Password baru (minimal 8 karakter)"
          className={inputClass}
        />
        {state.error && <p className={errorClass}>{state.error}</p>}
        {state.ok && (
          <p className="text-sm text-green-700">{state.ok}</p>
        )}
        <button type="submit" disabled={pending} className="w-fit underline">
          {pending ? "Menyimpan..." : "Simpan password"}
        </button>
      </form>
    </details>
  );
}

export function RemoveAdminButton({
  slug,
  userId,
  name,
}: {
  slug: string;
  userId: string;
  name: string;
}) {
  return (
    <form
      action={removeAdmin.bind(null, slug, userId)}
      onSubmit={(e) => {
        if (!confirm(`Hapus akun ${name}? Akses akan langsung dicabut.`))
          e.preventDefault();
      }}
    >
      <button className="text-red-600 underline">
        Hapus akun
      </button>
    </form>
  );
}
