"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/atoms/button";
import { Input, Select } from "@/components/atoms/input";
import { Field } from "@/components/molecules/field";
import { FormMessage } from "@/components/molecules/form-message";
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
    <form action={action} className="flex flex-col gap-5">
      <Field label="Nama komunitas">
        <Input
          name="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
        />
      </Field>
      <Field label="Alamat link (slug)" hint={`Tidak bisa diubah setelah dibuat. Link: /${slug || "slug-komunitas"}`}>
        <div className="flex">
          <span className="flex items-center rounded-l-xl border-[1.5px] border-r-0 border-line-strong bg-background px-3.5 font-mono text-muted">/</span>
          <Input
            name="slug"
            required
            autoCapitalize="none"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            className="rounded-l-none font-mono"
          />
        </div>
      </Field>
      <Field label="Zona waktu">
        <Select name="timezone" defaultValue={DEFAULT_TIME_ZONE}>
          {(Object.keys(TIME_ZONES) as TimeZone[]).map((zone) => (
            <option key={zone} value={zone}>
              {TIME_ZONES[zone].label} (UTC+{TIME_ZONES[zone].offsetHours})
            </option>
          ))}
        </Select>
      </Field>
      <FormMessage state={state} />
      <Button type="submit" full disabled={pending}>
        {pending ? "Membuat..." : "Buat komunitas"}
      </Button>
    </form>
  );
}
