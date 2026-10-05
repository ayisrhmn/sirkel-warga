import { CalendarDays, LayoutDashboard, Megaphone, Phone, SlidersHorizontal, Table2, Users, type LucideIcon } from "lucide-react";

export type AdminNavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

// The admin menu, in one place for the sidebar (desktop) and the bottom bar
// (phone). Users and settings are for super admins only.
export function adminNavSections(slug: string, owner: boolean): { label?: string; items: AdminNavItem[] }[] {
  const base = `/admin/${slug}`;
  return [
    { items: [{ href: base, label: "Ringkasan", icon: LayoutDashboard, exact: true }] },
    {
      label: "Konten",
      items: [
        { href: `${base}/announcements`, label: "Pengumuman", icon: Megaphone },
        { href: `${base}/events`, label: "Agenda", icon: CalendarDays },
        { href: `${base}/contacts`, label: "Kontak", icon: Phone },
        { href: `${base}/datasets`, label: "Laporan", icon: Table2 },
      ],
    },
    ...(owner
      ? [
          {
            label: "Kelola",
            items: [
              { href: `${base}/users`, label: "Pengguna", icon: Users },
              { href: `${base}/settings`, label: "Pengaturan", icon: SlidersHorizontal },
            ],
          },
        ]
      : []),
  ];
}
