"use client";

import { Ellipsis, ExternalLink, KeyRound, LayoutDashboard, Megaphone, CalendarDays, Table2, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/molecules/logout-button";
import { cx } from "@/lib/cx";
import { adminNavSections } from "./admin-nav-items";

const MAIN_TABS = ["Ringkasan", "Pengumuman", "Agenda", "Laporan"];

const tabClass = (active: boolean) =>
  cx("flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-bold", active ? "text-primary" : "text-muted");
const pill = (active: boolean) => cx("flex h-7 w-13 items-center justify-center rounded-full", active && "bg-primary-tint");

// The admin menu on a phone: the four sections used most, and "Lainnya" that
// opens a sheet with everything else.
export function AdminBottomNav({ slug, owner, isPlatformAdmin }: { slug: string; owner: boolean; isPlatformAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = adminNavSections(slug, owner).flatMap((section) => section.items);
  const tabs = items.filter((item) => MAIN_TABS.includes(item.label));
  const more = items.filter((item) => !MAIN_TABS.includes(item.label));
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const moreActive = more.some((item) => isActive(item.href));
  const sheetLink = "flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold text-ink hover:bg-zebra";

  const icons: Record<string, LucideIcon> = { Ringkasan: LayoutDashboard, Pengumuman: Megaphone, Agenda: CalendarDays, Laporan: Table2 };

  return (
    <>
      {open && (
        <div className="fixed inset-x-0 bottom-[68px] z-20 mx-3 flex flex-col gap-0.5 rounded-2xl border border-line bg-surface p-2 shadow-xl">
          {more.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className={sheetLink}>
              <Icon aria-hidden="true" size={20} />
              {label}
            </Link>
          ))}
          <Link href={`/${slug}`} onClick={() => setOpen(false)} className={sheetLink}>
            <ExternalLink aria-hidden="true" size={20} />
            Halaman publik
          </Link>
          <Link href="/change-password" onClick={() => setOpen(false)} className={sheetLink}>
            <KeyRound aria-hidden="true" size={20} />
            Ganti password
          </Link>
          {isPlatformAdmin && (
            <Link href="/platform" onClick={() => setOpen(false)} className={sheetLink}>
              <ShieldCheck aria-hidden="true" size={20} />
              Platform
            </Link>
          )}
          <LogoutButton full align="start" size="md" />
        </div>
      )}
      <nav aria-label="Menu admin" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface px-1 pt-1.5 pb-3.5">
        {tabs.map(({ href, label, exact }) => {
          const Icon = icons[label];
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={tabClass(active && !open)}>
              <span className={pill(active && !open)}>
                <Icon aria-hidden="true" size={22} />
              </span>
              {label}
            </Link>
          );
        })}
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={cx(tabClass(open || moreActive), "cursor-pointer")}>
          <span className={pill(open || moreActive)}>
            <Ellipsis aria-hidden="true" size={22} />
          </span>
          Lainnya
        </button>
      </nav>
    </>
  );
}
