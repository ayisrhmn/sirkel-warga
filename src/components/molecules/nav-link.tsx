"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";

// A navigation entry that highlights itself on its own page. `exact` is for
// the section's index page, which would otherwise match every page below it.
// The icon is an element, not a component: a function cannot cross from a
// Server Component to this Client Component.
export function NavLink({ href, icon, exact = false, children }: { href: string; icon: ReactNode; exact?: boolean; children: string }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-[15px]",
        active ? "bg-primary-tint font-bold text-primary-dark" : "font-semibold text-body hover:bg-zebra",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
