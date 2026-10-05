"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordInput } from "@/components/password-input";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
import { authClient, authMessage } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError("");
    setPending(true);
    const { error } = await authClient.signIn.username({
      username: String(form.get("username")).trim(),
      password: String(form.get("password")),
    });
    if (error) {
      setPending(false);
      setError(authMessage(error));
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
        Password
        <PasswordInput
          name="password"
          required
          autoComplete="current-password"
        />
      </label>
      {error && <p className={errorClass}>{error}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Masuk..." : "Masuk"}
      </button>
    </form>
  );
}
