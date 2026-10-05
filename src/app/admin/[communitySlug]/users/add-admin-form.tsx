"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Banner } from "@/components/molecules/banner";
import { Field } from "@/components/molecules/field";
import { FormMessage } from "@/components/molecules/form-message";
import { PasswordInput } from "@/components/molecules/password-input";
import type { FormState } from "@/lib/form-state";
import { createAdmin } from "./actions";

export function AddAdminForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(
    createAdmin.bind(null, slug),
    {} as FormState,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Nama">
        <Input name="name" required defaultValue={state.values?.name} />
      </Field>
      <Field label="Username">
        <Input name="username" required autoCapitalize="none" defaultValue={state.values?.username} />
      </Field>
      <Field label="Password awal (minimal 8 karakter)">
        <PasswordInput name="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <Banner>Kirim password awal lewat chat. Akun baru wajib ganti password saat login pertama.</Banner>
      <FormMessage state={state} />
      <Button type="submit" full icon={UserPlus} disabled={pending}>
        {pending ? "Membuat..." : "Buat akun admin"}
      </Button>
    </form>
  );
}
