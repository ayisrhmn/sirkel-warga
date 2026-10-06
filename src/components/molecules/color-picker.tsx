"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/atoms/button";
import { Chip } from "@/components/atoms/chip";
import { ThemeScope } from "@/components/atoms/theme-scope";
import { Banner } from "@/components/molecules/banner";
import { contrastWarning, DEFAULT_PRIMARY, parsePrimaryColor, PRIMARY_PRESETS } from "@/lib/theme";

// Picks a community's primary colour: ready-made swatches, or any other colour.
// Submits the colour as `name`. A light colour is allowed but gets a warning.
export function ColorPicker({ name = "primaryColor", defaultValue = DEFAULT_PRIMARY }: { name?: string; defaultValue?: string }) {
  const [color, setColor] = useState(defaultValue);
  const parsed = parsePrimaryColor(color);
  const valid = "color" in parsed;
  const warning = valid ? contrastWarning(parsed.color) : null;

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-[15px] font-semibold">Warna komunitas</legend>
      <input type="hidden" name={name} value={color} />

      <div className="flex flex-wrap gap-2.5">
        {PRIMARY_PRESETS.map((preset) => (
          <label
            key={preset.value}
            title={preset.name}
            className="relative flex size-12 cursor-pointer items-center justify-center rounded-full has-checked:ring-4 has-checked:ring-ink/25 has-focus-visible:outline-3 has-focus-visible:outline-accent"
            style={{ backgroundColor: preset.value }}
          >
            <input type="radio" name={`${name}-preset`} value={preset.value} checked={color === preset.value} onChange={() => setColor(preset.value)} className="sr-only" />
            <span className="sr-only">{preset.name}</span>
            {color === preset.value && <Check aria-hidden="true" size={22} strokeWidth={3} className="text-white drop-shadow" />}
          </label>
        ))}
      </div>

      <label className="flex w-fit items-center gap-3 text-[15px] font-semibold">
        <input type="color" value={valid ? parsed.color : "#000000"} onChange={(e) => setColor(e.target.value)} className="size-12 cursor-pointer rounded-xl border-[1.5px] border-line-strong bg-surface p-1" />
        <span className="flex flex-col">
          Warna lain
          <span className="font-mono text-sm font-normal text-muted">{color}</span>
        </span>
      </label>

      {!valid && (
        <p role="alert" className="text-sm font-medium text-danger">
          {parsed.error}
        </p>
      )}
      {warning && <Banner tone="warning">{warning}</Banner>}

      <ThemeScope color={valid ? color : null} fill={false}>
        <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="bg-primary-dark px-5 py-4 font-display text-xl font-extrabold text-white">Pratinjau tampilan</div>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <Button type="button" size="sm" tabIndex={-1}>
              Tombol utama
            </Button>
            <Chip tone="green">Publik</Chip>
            <span className="font-bold text-primary">Tautan</span>
          </div>
        </div>
      </ThemeScope>
    </fieldset>
  );
}
