import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

const tones = {
  green: "bg-primary-tint text-primary-dark",
  amber: "bg-accent-tint text-accent-ink",
  red: "bg-danger-tint text-danger",
  white: "bg-surface text-primary",
} as const;

const sizes = {
  sm: { box: "size-10", icon: 20 },
  md: { box: "size-11", icon: 22 },
  lg: { box: "size-16", icon: 30 },
} as const;

// A tinted tile that gives an icon some weight. Decorative: the text next to
// it carries the meaning.
export function IconTile({
  icon: Icon,
  tone = "green",
  size = "md",
  shape = "circle",
}: {
  icon: LucideIcon;
  tone?: keyof typeof tones;
  size?: keyof typeof sizes;
  shape?: "circle" | "square";
}) {
  return (
    <span
      aria-hidden="true"
      className={cx("flex shrink-0 items-center justify-center", shape === "circle" ? "rounded-full" : "rounded-2xl", tones[tone], sizes[size].box)}
    >
      <Icon size={sizes[size].icon} />
    </span>
  );
}
