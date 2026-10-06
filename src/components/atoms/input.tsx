import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

// Shared by Input and Select so every form control has the same size and edge.
export const controlClass =
  "min-h-13 w-full rounded-xl border-[1.5px] border-line-strong bg-surface px-4 text-base text-ink placeholder:text-muted/80 disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(controlClass, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(controlClass, className)} {...props} />;
}
