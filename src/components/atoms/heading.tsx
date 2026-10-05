import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

const sizes = {
  hero: "font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl",
  page: "font-display text-[2rem] font-extrabold leading-tight tracking-tight sm:text-4xl",
  section: "font-display text-2xl font-bold leading-tight tracking-tight",
  card: "text-lg font-bold leading-snug",
} as const;

// One place for heading sizes, so a page picks a role ("page", "section")
// instead of inventing font sizes.
export function Heading({
  as: Tag = "h2",
  size = "section",
  className,
  children,
}: {
  as?: "h1" | "h2" | "h3";
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cx(sizes[size], "text-ink", className)}>{children}</Tag>;
}
