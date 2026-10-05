"use client";

import { useState } from "react";
import { PasswordInput } from "@/components/password-input";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
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
      <p>
        Pendaftaran berhasil. Akunmu menunggu persetujuan, kamu bisa masuk
        setelah disetujui.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        Nama
        <input name="name" required autoComplete="name" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1">
        Username
        <input
          name="username"
          required
          autoComplete="username"
          autoCapitalize="none"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        Password (minimal 8 karakter)
        <PasswordInput
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      <label className="flex flex-col gap-1">
        Ulangi password
        <PasswordInput
          name="confirm"
          required
          autoComplete="new-password"
        />
      </label>
      {error && <p className={errorClass}>{error}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Mendaftar..." : "Daftar"}
      </button>
    </form>
  );
}
