"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { Input, Select } from "@/components/atoms/input";
import { Field } from "@/components/molecules/field";
import { FormMessage } from "@/components/molecules/form-message";
import { PasswordInput } from "@/components/molecules/password-input";
import type { FormState } from "@/lib/form-state";
import { TIME_ZONES, type TimeZone } from "@/lib/datetime";
import { deleteCommunity, renameCommunity, setProtectedPassword, setTimezone } from "./actions";

export function RenameCommunityForm({ slug, name }: { slug: string; name: string }) {
  const [state, action, pending] = useActionState(
    renameCommunity.bind(null, slug),
    {} as FormState,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nama komunitas">
        <Input name="name" required defaultValue={state.values?.name ?? name} />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" full disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}

export function DeleteCommunityForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(
    deleteCommunity.bind(null, slug),
    {} as FormState,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        label={
          <>
            Ketik <span className="font-mono">{slug}</span> untuk mengonfirmasi
          </>
        }
      >
        <Input name="confirm" required autoComplete="off" autoCapitalize="none" />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" variant="danger" full icon={Trash2} disabled={pending}>
        {pending ? "Menghapus..." : "Hapus komunitas"}
      </Button>
    </form>
  );
}

export function ProtectedPasswordForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(
    setProtectedPassword.bind(null, slug),
    {} as FormState,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Password baru">
        <PasswordInput name="password" required minLength={8} autoComplete="new-password" placeholder="8-64 karakter" />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" full disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan password"}
      </Button>
    </form>
  );
}

export function TimezoneForm({ slug, timezone }: { slug: string; timezone: TimeZone }) {
  const [state, action, pending] = useActionState(setTimezone.bind(null, slug), {} as FormState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Zona waktu">
        <Select name="timezone" defaultValue={timezone}>
          {(Object.keys(TIME_ZONES) as TimeZone[]).map((zone) => (
            <option key={zone} value={zone}>
              {TIME_ZONES[zone].label} (UTC+{TIME_ZONES[zone].offsetHours})
            </option>
          ))}
        </Select>
      </Field>
      <FormMessage state={state} />
      <Button type="submit" full disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan zona waktu"}
      </Button>
    </form>
  );
}
