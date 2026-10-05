"use client";

import { KeyRound } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { Field } from "@/components/molecules/field";
import { FormMessage } from "@/components/molecules/form-message";
import { PasswordInput } from "@/components/molecules/password-input";
import type { FormState } from "@/lib/form-state";
import { unlockDatasets } from "./actions";

export function UnlockForm({ slug, id }: { slug: string; id: string }) {
  const [state, action, pending] = useActionState(
    unlockDatasets.bind(null, slug, id),
    {} as FormState,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Password">
        <PasswordInput name="password" required autoComplete="off" />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" full icon={KeyRound} disabled={pending}>
        {pending ? "Memeriksa..." : "Buka laporan"}
      </Button>
    </form>
  );
}
