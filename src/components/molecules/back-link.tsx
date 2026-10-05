import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// A link back up one level. "pill" floats on the page background (public
// pages), "inline" is plain text (admin pages).
export function BackLink({ href, variant = "pill", children }: { href: string; variant?: "pill" | "inline"; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex min-h-11 w-fit items-center gap-2 font-semibold",
        variant === "pill" ? "rounded-full border border-line bg-surface pr-4.5 pl-3.5 text-[15px] text-ink" : "font-bold text-primary",
      )}
    >
      <ArrowLeft aria-hidden="true" size={18} />
      {children}
    </Link>
  );
}
