"use client";

import { KeyRound, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { FormMessage } from "@/components/molecules/form-message";
import { PasswordInput } from "@/components/molecules/password-input";
import type { FormState } from "@/lib/form-state";
import { removeAdmin, resetPassword } from "./actions";

export function ResetPasswordForm({ slug, userId }: { slug: string; userId: string }) {
  const [state, action, pending] = useActionState(
    resetPassword.bind(null, slug, userId),
    {} as FormState,
  );

  return (
    <details>
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-2xl border-2 border-line-strong bg-surface px-4 text-sm font-bold hover:bg-zebra [&::-webkit-details-marker]:hidden">
        <KeyRound aria-hidden="true" size={18} />
        Reset password
      </summary>
      <form action={action} className="mt-3 flex flex-col gap-3 rounded-2xl bg-background p-4">
        <PasswordInput
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Password baru (minimal 8 karakter)"
        />
        <FormMessage state={state} />
        <Button type="submit" size="sm" disabled={pending} className="self-start">
          {pending ? "Menyimpan..." : "Simpan password"}
        </Button>
      </form>
    </details>
  );
}

export function RemoveAdminButton({ slug, userId, name }: { slug: string; userId: string; name: string }) {
  return (
    <form
      action={removeAdmin.bind(null, slug, userId)}
      onSubmit={(e) => {
        if (!confirm(`Hapus akun ${name}? Akses akan langsung dicabut.`))
          e.preventDefault();
      }}
    >
      <Button variant="danger-outline" size="sm" icon={Trash2}>
        Hapus akun
      </Button>
    </form>
  );
}
