"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Field } from "@/components/molecules/field";
import { FormMessage } from "@/components/molecules/form-message";
import { PasswordInput } from "@/components/molecules/password-input";
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
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Username">
        <Input name="username" required autoComplete="username" autoCapitalize="none" />
      </Field>
      <Field label="Password">
        <PasswordInput name="password" required autoComplete="current-password" />
      </Field>
      <FormMessage state={{ error }} />
      <Button type="submit" full disabled={pending}>
        {pending ? "Masuk..." : "Masuk"}
      </Button>
    </form>
  );
}
