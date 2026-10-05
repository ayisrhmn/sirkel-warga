import { cx } from "@/lib/cx";

// A decorative circle outline, the visual motif of the app. Position and size
// come from `className` (the parent must be `relative overflow-hidden`).
export function Ring({ className, tone = "light" }: { className?: string; tone?: "light" | "tint" | "accent" }) {
  const tones = { light: "border-white/10", tint: "border-primary-tint", accent: "border-accent-tint" };
  return <span aria-hidden="true" className={cx("pointer-events-none absolute rounded-full border-2", tones[tone], className)} />;
}

// The small solid dot that sits among the rings.
export function Dot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("pointer-events-none absolute rounded-full bg-accent", className)} />;
}
