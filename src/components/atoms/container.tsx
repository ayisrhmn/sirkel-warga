import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

const sizes = {
  narrow: "max-w-3xl", // reading width: one article
  content: "max-w-6xl", // pages with columns or tables
  form: "max-w-md", // a single small form
} as const;

// Centres page content at a readable width with side gutters.
export function Container({ size = "content", className, children }: { size?: keyof typeof sizes; className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto w-full px-5 sm:px-8", sizes[size], className)}>{children}</div>;
}
