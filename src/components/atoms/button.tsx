import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

const variants = {
  primary: "border-primary bg-primary text-white hover:border-primary-dark hover:bg-primary-dark",
  secondary: "border-line-strong bg-surface text-ink hover:bg-zebra",
  ghost: "border-transparent bg-transparent text-ink hover:bg-primary-tint",
  danger: "border-danger bg-danger text-white hover:opacity-90",
  "danger-outline": "border-danger/30 bg-surface text-danger hover:bg-danger-tint",
  accent: "border-accent bg-accent text-ink hover:opacity-90",
  light: "border-white bg-white text-primary-dark hover:bg-primary-tint",
  "light-ghost": "border-white/35 bg-white/10 text-white hover:bg-white/20",
} as const;

const sizes = {
  md: { box: "min-h-13 px-6 text-base", icon: 20 },
  sm: { box: "min-h-11 px-4 text-sm", icon: 18 },
} as const;

export type ButtonStyle = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  full?: boolean;
  align?: "center" | "start";
  icon?: LucideIcon;
};

// The class list is exported for elements that cannot be a <Button> (for
// example a <summary>), so every button-like thing looks the same.
export function buttonClass(
  { variant = "primary", size = "md", full, align = "center" }: ButtonStyle = {},
  className?: string,
) {
  return cx(
    "inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-2xl border-2 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    align === "start" ? "justify-start" : "justify-center",
    variants[variant],
    sizes[size].box,
    full && "w-full",
    className,
  );
}

export function Button({ variant, size, full, align, icon: Icon, className, children, ...props }: ComponentProps<"button"> & ButtonStyle) {
  return (
    <button className={buttonClass({ variant, size, full, align }, className)} {...props}>
      {Icon && <Icon aria-hidden="true" size={sizes[size ?? "md"].icon} />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, full, align, icon: Icon, className, children, ...props }: ComponentProps<typeof Link> & ButtonStyle) {
  return (
    <Link className={buttonClass({ variant, size, full, align }, className)} {...props}>
      {Icon && <Icon aria-hidden="true" size={sizes[size ?? "md"].icon} />}
      {children}
    </Link>
  );
}
