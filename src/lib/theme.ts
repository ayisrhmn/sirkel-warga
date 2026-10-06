import type { CSSProperties } from "react";

// Each community picks one primary colour. The rest of the palette (dark and
// tint shades) is derived from it in CSS, so the choice stays a single value.

export const DEFAULT_PRIMARY = "#0e6b58";

// White text sits on the primary colour (buttons, the page header), so the
// colour must be dark enough for it to be readable: WCAG AA for normal text.
export const MIN_CONTRAST = 4.5;

// Ready-made choices, each checked against MIN_CONTRAST (see theme.test.ts).
export const PRIMARY_PRESETS = [
  { name: "Hijau", value: DEFAULT_PRIMARY },
  { name: "Biru", value: "#1d4ed8" },
  { name: "Ungu", value: "#6d28d9" },
  { name: "Magenta", value: "#a21caf" },
  { name: "Merah", value: "#be123c" },
  { name: "Oranye", value: "#b45309" },
  { name: "Cokelat", value: "#78350f" },
  { name: "Abu tua", value: "#334155" },
] as const;

// "#abc", "ABCDEF" or "#abcdef" -> "#aabbcc" / "#abcdef" (lower case), or null.
export function normalizeHex(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!match) return null;
  const digits = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1];
  return `#${digits.toLowerCase()}`;
}

// WCAG contrast ratio of white text on this colour (1 to 21).
export function contrastWithWhite(hex: string): number {
  const channel = (start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return 1.05 / (luminance + 0.05);
}

// Validates a colour typed or picked by a user. Run on the server for every
// write: the form's own check is only a courtesy.
export function checkPrimaryColor(input: unknown): { color: string } | { error: string } {
  const color = normalizeHex(input);
  if (!color) return { error: "Warna tidak valid." };
  if (contrastWithWhite(color) < MIN_CONTRAST)
    return { error: "Warna terlalu terang, teks putih di atasnya sulit dibaca. Pilih yang lebih gelap." };
  return { color };
}

// Style that re-points the primary tokens at a community's colour. Anything
// stored that is not a readable colour is ignored, so a bad value can never
// reach the page or break its contrast. No style for the default colour.
export function themeStyle(stored: string | null | undefined): CSSProperties | undefined {
  const checked = checkPrimaryColor(stored);
  if ("error" in checked || checked.color === DEFAULT_PRIMARY) return undefined;
  return {
    "--color-primary": checked.color,
    "--color-primary-dark": "color-mix(in oklab, var(--color-primary) 70%, black)",
    "--color-primary-tint": "color-mix(in oklab, var(--color-primary) 14%, white)",
  } as CSSProperties;
}
