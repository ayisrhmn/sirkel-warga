"use client";

import { useActionState, useState } from "react";
import { buttonClass, errorClass, inputClass } from "@/components/form-styles";
import type { FormState } from "@/lib/form-state";
import { DEFAULT_TIME_ZONE, TIME_ZONES, type TimeZone } from "@/lib/datetime";
import { slugify } from "@/lib/slug";
import { createCommunity } from "./actions";

export function CreateCommunityForm() {
  const [state, action, pending] = useActionState(createCommunity, {} as FormState);
  const [name, setName] = useState(state.values?.name ?? "");
  const [slug, setSlug] = useState(state.values?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        Nama komunitas
        <input
          name="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        Alamat link (slug)
        <input
          name="slug"
          required
          autoCapitalize="none"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugEdited(true);
          }}
          className={inputClass}
        />
        <span className="text-sm text-neutral-600">
          Tidak bisa diubah setelah dibuat. Link: /{slug || "slug-komunitas"}
        </span>
      </label>
      <label className="flex flex-col gap-1">
        Zona waktu
        <select name="timezone" defaultValue={DEFAULT_TIME_ZONE} className={inputClass}>
          {(Object.keys(TIME_ZONES) as TimeZone[]).map((zone) => (
            <option key={zone} value={zone}>
              {TIME_ZONES[zone].label} (UTC+{TIME_ZONES[zone].offsetHours})
            </option>
          ))}
        </select>
      </label>
      {state.error && <p className={errorClass}>{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Membuat..." : "Buat komunitas"}
      </button>
    </form>
  );
}
