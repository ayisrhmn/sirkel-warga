import { cx } from "@/lib/cx";

const tones = [
  "bg-primary-tint text-primary-dark",
  "bg-accent-tint text-accent-ink",
  "bg-blue-100 text-blue-900",
  "bg-pink-100 text-pink-900",
  "bg-violet-100 text-violet-900",
];

const initials = (name: string) =>
  name
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

// A circle with the person's initials. The colour follows the name, so the
// same person looks the same everywhere.
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const tone = tones[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % tones.length];
  return (
    <span
      aria-hidden="true"
      className={cx("flex shrink-0 items-center justify-center rounded-full font-display font-extrabold", tone, size === "sm" ? "size-10 text-sm" : "size-13 text-lg")}
    >
      {initials(name)}
    </span>
  );
}
