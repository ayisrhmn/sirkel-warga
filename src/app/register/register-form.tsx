"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { IconTile } from "@/components/atoms/icon-tile";
import { Input } from "@/components/atoms/input";
import { Field } from "@/components/molecules/field";
import { FormMessage } from "@/components/molecules/form-message";
import { PasswordInput } from "@/components/molecules/password-input";
import { authClient, authMessage } from "@/lib/auth-client";
import { passwordProblem } from "@/lib/password-policy";
import { usernameToEmail } from "@/lib/username";

export function RegisterForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name")).trim();
    const username = String(form.get("username")).trim().toLowerCase();
    const password = String(form.get("password"));

    if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
      setError("Username 3-30 karakter: huruf kecil, angka, titik, atau garis bawah.");
      return;
    }
    const weak = passwordProblem(password, username);
    if (weak) {
      setError(weak);
      return;
    }
    if (password !== String(form.get("confirm"))) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setError("");
    setPending(true);
    const { error } = await authClient.signUp.email({
      email: usernameToEmail(username),
      password,
      name,
      username,
    });
    setPending(false);
    if (error) setError(authMessage(error));
    else setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-start gap-4">
        <IconTile icon={CircleCheck} size="lg" />
        <p className="text-lg text-body">
          Pendaftaran berhasil. Akunmu menunggu persetujuan, kamu bisa masuk
          setelah disetujui.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Nama">
        <Input name="name" required autoComplete="name" />
      </Field>
      <Field label="Username" hint="3-30 karakter: huruf kecil, angka, titik, atau garis bawah.">
        <Input name="username" required autoComplete="username" autoCapitalize="none" />
      </Field>
      <Field label="Password (minimal 8 karakter)">
        <PasswordInput name="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <Field label="Ulangi password">
        <PasswordInput name="confirm" required autoComplete="new-password" />
      </Field>
      <FormMessage state={{ error }} />
      <Button type="submit" full disabled={pending}>
        {pending ? "Mendaftar..." : "Daftar"}
      </Button>
    </form>
  );
}
