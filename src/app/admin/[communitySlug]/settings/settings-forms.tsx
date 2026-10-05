"use client";

import { useActionState } from "react";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
import type { FormState } from "@/lib/form-state";
import { deleteCommunity, renameCommunity } from "./actions";

export function RenameCommunityForm({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const [state, action, pending] = useActionState(
    renameCommunity.bind(null, slug),
    {} as FormState,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="name"
        required
        defaultValue={state.values?.name ?? name}
        className={inputClass}
      />
      {state.error && <p className={errorClass}>{state.error}</p>}
      {state.ok && (
        <p className="text-sm text-green-700 dark:text-green-400">{state.ok}</p>
      )}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}

export function DeleteCommunityForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(
    deleteCommunity.bind(null, slug),
    {} as FormState,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        Ketik <span className="font-mono">{slug}</span> untuk mengonfirmasi
        <input
          name="confirm"
          required
          autoComplete="off"
          autoCapitalize="none"
          className={inputClass}
        />
      </label>
      {state.error && <p className={errorClass}>{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-red-600 px-3 py-2 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Menghapus..." : "Hapus komunitas"}
      </button>
    </form>
  );
}
