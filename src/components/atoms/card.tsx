import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

const paddings = { none: "", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" } as const;

// The white rounded surface that groups content.
export function Card({ padding = "md", className, ...props }: ComponentProps<"div"> & { padding?: keyof typeof paddings }) {
  return <div className={cx("rounded-3xl border border-line bg-surface", paddings[padding], className)} {...props} />;
}
